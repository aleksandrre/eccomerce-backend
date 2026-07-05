import { Request, Response } from "express";
import { FoodProduct } from "../models/FoodProductModel";
import { FoodCategory } from "../models/FoodCategoryModel";
import { getLang, localizeDoc } from "../../../shared/utils/lang";

const PRODUCT_FIELDS = ["name", "description", "category.name"];
const CATEGORY_FIELDS = ["name"];

function localizeProduct(doc: Record<string, unknown>, lang: ReturnType<typeof getLang>) {
  return localizeDoc(doc, PRODUCT_FIELDS, lang);
}

export const getAllFoodProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = getLang(req);
    const products = await FoodProduct.find().populate("category").lean();
    res.json(products.map((p) => localizeProduct(p as Record<string, unknown>, lang)));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOneFoodProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = getLang(req);
    const product = await FoodProduct.findById(req.params.id).populate("category").lean();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(localizeProduct(product as Record<string, unknown>, lang));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFoodProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = getLang(req);
    const category = await FoodCategory.findOne({
      "name.en": req.params.categoryName,
    }).populate("products").lean();

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    const products = (category.products as unknown as Record<string, unknown>[]).map(
      (p) => localizeDoc(p, ["name", "description"], lang)
    );
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllFoodCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = getLang(req);
    const categories = await FoodCategory.find({}, "name icon route").lean();
    if (!categories.length) {
      res.status(404).json({ message: "No food categories found" });
      return;
    }
    res.status(200).json(
      categories.map((c) => localizeDoc(c as Record<string, unknown>, CATEGORY_FIELDS, lang))
    );
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
