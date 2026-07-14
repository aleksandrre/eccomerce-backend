import { Request, Response } from "express";
import { Model } from "mongoose";
import { getLang, localizeDoc } from "../utils/lang";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/errorCodes";

/**
 * The public read endpoints for Food and Animal products are identical except
 * for the underlying models, so they're generated from this single factory.
 * All responses use the standard success envelope and are localized by the
 * `?lang` query parameter (en | ka | ru, default en).
 */

const PRODUCT_FIELDS = ["name", "description", "category.name"];
const CATEGORY_FIELDS = ["name"];

type Lean = Record<string, unknown>;

/**
 * @param enrichProduct Optional hook to add computed fields to each lean
 *   product (e.g. Animal's `discountedPrice`, which `.lean()` strips because
 *   it's a virtual). Applied after localization.
 */
export function createProductReadController(
  ProductModel: Model<any>,
  CategoryModel: Model<any>,
  enrichProduct: (doc: Lean) => Lean = (doc) => doc
) {
  const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    const lang = getLang(req);
    const products = await ProductModel.find().populate("category").lean();
    sendSuccess(
      res,
      products.map((p) => enrichProduct(localizeDoc(p as Lean, PRODUCT_FIELDS, lang)))
    );
  };

  const getOneProduct = async (req: Request, res: Response): Promise<void> => {
    const lang = getLang(req);
    const product = await ProductModel.findById(req.params.id)
      .populate("category")
      .lean();
    if (!product) {
      throw AppError.notFound(ErrorCode.PRODUCT_NOT_FOUND, "Product not found");
    }
    sendSuccess(res, enrichProduct(localizeDoc(product as Lean, PRODUCT_FIELDS, lang)));
  };

  const getProductsByCategory = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const lang = getLang(req);
    const category = await CategoryModel.findById(req.params.categoryId)
      .populate("products")
      .lean();
    if (!category) {
      throw AppError.notFound(
        ErrorCode.CATEGORY_NOT_FOUND,
        "Category not found"
      );
    }
    const categoryProducts =
      ((category as Lean).products as Lean[] | undefined) ?? [];
    const products = categoryProducts.map((p) =>
      enrichProduct(localizeDoc(p, ["name", "description"], lang))
    );
    sendSuccess(res, products);
  };

  const getAllCategories = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const lang = getLang(req);
    const categories = await CategoryModel.find({}, "name image slug").lean();
    sendSuccess(
      res,
      categories.map((c) => localizeDoc(c as Lean, CATEGORY_FIELDS, lang))
    );
  };

  return {
    getAllProducts,
    getOneProduct,
    getProductsByCategory,
    getAllCategories,
  };
}
