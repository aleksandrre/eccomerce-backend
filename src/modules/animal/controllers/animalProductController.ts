import { Request, Response } from "express";
import { AnimalProduct } from "../models/AnimalProductModel";
import { AnimalCategory } from "../models/AnimalCategoryModel";
import { getLang, localizeDoc } from "../../../shared/utils/lang";

const PRODUCT_FIELDS = ["name", "description", "category.name"];
const CATEGORY_FIELDS = ["name"];

function localizeProduct(doc: Record<string, unknown>, lang: ReturnType<typeof getLang>) {
  return localizeDoc(doc, PRODUCT_FIELDS, lang);
}

export const getAllAnimalProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = getLang(req);
    const products = await AnimalProduct.find().populate("category").lean();
    res.json(products.map((p) => localizeProduct(p as Record<string, unknown>, lang)));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOneAnimalProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = getLang(req);
    const product = await AnimalProduct.findById(req.params.id).populate("category").lean();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(localizeProduct(product as Record<string, unknown>, lang));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAnimalProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = getLang(req);
    const category = await AnimalCategory.findOne({
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

export const getAllAnimalCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = getLang(req);
    const categories = await AnimalCategory.find({}, "name icon route").lean();
    if (!categories.length) {
      res.status(404).json({ message: "No animal categories found" });
      return;
    }
    res.status(200).json(
      categories.map((c) => localizeDoc(c as Record<string, unknown>, CATEGORY_FIELDS, lang))
    );
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
