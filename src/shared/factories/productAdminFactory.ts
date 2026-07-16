import { Response } from "express";
import mongoose, { Model } from "mongoose";
import { AuthRequest, ProductType } from "../../types";
import configureMulter from "../services/configureMulter";
import {
  uploadProductImages,
  deleteProductImages,
} from "../services/s3Service";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/errorCodes";
import { parseLocalizedField } from "../utils/validators";

const MAX_IMAGES = 4;

type Body = Record<string, unknown>;

interface ProductAdminConfig {
  /** Maps/validates the type-specific fields for creation (throws on invalid). */
  buildCreateFields: (body: Body) => Record<string, unknown>;
  /** Applies type-specific field updates onto an existing product document. */
  applyUpdateFields: (product: any, body: Body) => void;
}

/**
 * Shared create/update/delete logic for product admin endpoints. The common
 * concerns (multipart parsing, localized name/description parsing, category
 * existence + membership sync, image upload/cleanup, response envelope) live
 * here; only the type-specific fields differ per module via `config`.
 *
 * Localized `name`/`description` arrive as JSON strings in the multipart body
 * and are parsed by `parseLocalizedField`. All validation runs BEFORE images
 * are uploaded to S3 so a validation failure never leaves orphaned files.
 */
export function createProductAdminController(
  ProductModel: Model<any>,
  CategoryModel: Model<any>,
  productType: ProductType,
  config: ProductAdminConfig
) {
  const parseBoolean = (v: unknown): boolean => v === true || v === "true";

  const addProduct = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    await configureMulter(MAX_IMAGES)(req, res);
    const body = req.body as Body;
    const categoryId = body.categoryId as string | undefined;

    if (!categoryId || !(await CategoryModel.findById(categoryId))) {
      throw AppError.badRequest(
        ErrorCode.CATEGORY_NOT_FOUND,
        "Category not found"
      );
    }

    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      throw AppError.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "At least one product image is required"
      );
    }

    // Validate everything before touching S3.
    const name = parseLocalizedField(body.name, "name");
    const description = parseLocalizedField(body.description, "description");
    const typeFields = config.buildCreateFields(body);

    // Pre-generate the id so all images land under this product's prefix
    // (products/<type>/<productId>/) before the document is inserted.
    const productId = new mongoose.Types.ObjectId();
    const images = await uploadProductImages(
      productType,
      productId.toString(),
      files
    );

    let product;
    try {
      product = await ProductModel.create({
        _id: productId,
        name,
        description,
        category: categoryId,
        images,
        isNewProduct: parseBoolean(body.isNewProduct),
        ...typeFields,
      });
    } catch (err) {
      // Validation already ran before upload, so this only guards a DB failure;
      // clean up the just-uploaded images so they don't leak.
      await deleteProductImages(productType, productId.toString());
      throw err;
    }

    await CategoryModel.findByIdAndUpdate(categoryId, {
      $push: { products: product._id },
    });

    sendSuccess(res, { product }, "Product created successfully", 201);
  };

  const updateProduct = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    await configureMulter(MAX_IMAGES)(req, res);
    const body = req.body as Body;
    const productId = String(req.params.productId);

    const product = await ProductModel.findById(productId);
    if (!product) {
      throw AppError.notFound(ErrorCode.PRODUCT_NOT_FOUND, "Product not found");
    }

    if (body.name !== undefined) {
      product.name = parseLocalizedField(body.name, "name");
    }
    if (body.description !== undefined) {
      product.description = parseLocalizedField(body.description, "description");
    }

    const categoryId = body.categoryId as string | undefined;
    if (categoryId && String(categoryId) !== String(product.category)) {
      if (!(await CategoryModel.findById(categoryId))) {
        throw AppError.badRequest(
          ErrorCode.CATEGORY_NOT_FOUND,
          "Category not found"
        );
      }
      await CategoryModel.findByIdAndUpdate(product.category, {
        $pull: { products: productId },
      });
      await CategoryModel.findByIdAndUpdate(categoryId, {
        $push: { products: productId },
      });
      product.category = categoryId;
    }

    if (body.isNewProduct !== undefined) {
      product.isNewProduct = parseBoolean(body.isNewProduct);
    }

    config.applyUpdateFields(product, body);

    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length > 0) {
      await deleteProductImages(productType, productId);
      product.images = await uploadProductImages(productType, productId, files);
    }

    const updated = await product.save();
    sendSuccess(res, { product: updated }, "Product updated successfully");
  };

  const deleteProduct = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const product = await ProductModel.findById(req.params.productId);
    if (!product) {
      throw AppError.notFound(ErrorCode.PRODUCT_NOT_FOUND, "Product not found");
    }

    await deleteProductImages(productType, product._id.toString());
    await CategoryModel.findByIdAndUpdate(product.category, {
      $pull: { products: product._id },
    });
    await product.deleteOne();

    sendSuccess(res, null, "Product deleted successfully");
  };

  return { addProduct, updateProduct, deleteProduct };
}
