import { Response } from "express";
import mongoose, { Model } from "mongoose";
import { AuthRequest } from "../../types";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/errorCodes";
import { requireFields, parseLocalizedField } from "../utils/validators";
import { deleteFilesFromS3 } from "../services/s3Service";

/**
 * Category admin endpoints (create/delete) are identical for Food and Animal,
 * so they're generated here. Categories are created via JSON (no file upload),
 * so `name` arrives as an object; `parseLocalizedField` validates it either way.
 *
 * deleteCategory is a CASCADING, destructive action: it removes the category
 * AND every product that belongs to it (plus those products' S3 images).
 */

/** Detects the "transactions not supported" error on standalone MongoDB. */
function isTransactionUnsupported(err: unknown): boolean {
  const e = err as { code?: number; message?: string };
  return (
    e?.code === 20 ||
    /Transaction numbers are only allowed|replica set|mongos/i.test(
      e?.message ?? ""
    )
  );
}

/**
 * Deletes all products of a category and then the category itself. Runs inside
 * a transaction when the server supports it (atomic all-or-nothing); otherwise
 * falls back to a safe sequential order (products first, then the category) so
 * a mid-way failure never leaves products with a dangling category reference.
 * Returns the number of products deleted.
 */
async function deleteCategoryAndProducts(
  CategoryModel: Model<any>,
  ProductModel: Model<any>,
  categoryId: string
): Promise<number> {
  let deletedProductsCount = 0;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await ProductModel.deleteMany(
        { category: categoryId },
        { session }
      );
      deletedProductsCount = result.deletedCount ?? 0;
      await CategoryModel.deleteOne({ _id: categoryId }, { session });
    });
  } catch (err) {
    if (!isTransactionUnsupported(err)) throw err;
    // Sequential fallback: products first, then the category.
    const result = await ProductModel.deleteMany({ category: categoryId });
    deletedProductsCount = result.deletedCount ?? 0;
    await CategoryModel.deleteOne({ _id: categoryId });
  } finally {
    await session.endSession();
  }
  return deletedProductsCount;
}

export function createCategoryAdminController(
  CategoryModel: Model<any>,
  ProductModel: Model<any>
) {
  const addCategory = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const body = req.body as Record<string, unknown>;
    requireFields(body, ["name", "icon", "slug"]);
    const name = parseLocalizedField(body.name, "name");

    const category = await CategoryModel.create({
      name,
      description:
        typeof body.description === "string" ? body.description : undefined,
      icon: body.icon,
      slug: body.slug,
    });

    sendSuccess(res, { category }, "Category created successfully", 201);
  };

  /**
   * DESTRUCTIVE + IRREVERSIBLE. Deletes the category and every product in it,
   * along with those products' S3 images. Responds with `deletedProductsCount`
   * so the admin sees the exact scope of what was removed.
   */
  const deleteCategory = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const categoryId = String(req.params.categoryId);

    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      throw AppError.notFound(
        ErrorCode.CATEGORY_NOT_FOUND,
        "Category not found"
      );
    }

    // Collect image keys BEFORE deleting so we can clean up S3 afterwards.
    const products = await ProductModel.find({ category: categoryId }).select(
      "images"
    );
    const productImages = products.flatMap(
      (p) => (p.images as string[] | undefined) ?? []
    );

    // Delete products + category from the database (atomic where supported).
    const deletedProductsCount = await deleteCategoryAndProducts(
      CategoryModel,
      ProductModel,
      categoryId
    );

    // DB is now consistent — clean up S3 images best-effort (orphaned files
    // are harmless storage waste and must not fail an already-committed delete).
    if (productImages.length > 0) {
      try {
        await deleteFilesFromS3(productImages);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[cascade delete] S3 image cleanup failed:", e);
      }
    }

    sendSuccess(
      res,
      { deletedProductsCount },
      `Category and ${deletedProductsCount} product(s) deleted successfully`
    );
  };

  return { addCategory, deleteCategory };
}
