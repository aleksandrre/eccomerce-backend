import { Request, Response } from "express";
import { FoodProduct } from "../models/FoodProductModel";
import { FoodCategory } from "../models/FoodCategoryModel";

export const getAllFoodProducts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await FoodProduct.find().populate("category");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOneFoodProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await FoodProduct.findById(req.params.id).populate(
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

export const getFoodProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await FoodCategory.findOne({
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

export const getAllFoodCategories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await FoodCategory.find(
      {},
      "name geoName icon route"
    );
    if (!categories.length) {
      res.status(404).json({ message: "No food categories found" });
      return;
    }
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
