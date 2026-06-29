import { Request, Response } from "express";
import { AnimalProduct } from "../models/AnimalProductModel";
import { AnimalCategory } from "../models/AnimalCategoryModel";

export const getAllAnimalProducts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await AnimalProduct.find().populate("category");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOneAnimalProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await AnimalProduct.findById(req.params.id).populate(
      "category"
    );
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAnimalProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await AnimalCategory.findOne({
      name: req.params.categoryName,
    }).populate("products");

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(200).json(category.products);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllAnimalCategories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await AnimalCategory.find(
      {},
      "name geoName icon route"
    );
    if (!categories.length) {
      res.status(404).json({ message: "No animal categories found" });
      return;
    }
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
