import { Request, Response } from "express";
import { FoodProduct } from "../models/FoodProductModel";
import { AnimalProduct } from "../models/AnimalProductModel";
import { FoodCategory } from "../models/FoodCategoryModel";
import { AnimalCategory } from "../models/AnimalCategoryModel";

// ==================== FOOD PRODUCTS ====================

export const getAllFoodProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await FoodProduct.find().populate("category");
    res.json(products);
  } catch (error) {
    console.error("Error fetching food products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOneFoodProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const product = await FoodProduct.findById(id).populate("category");
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching food product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFoodProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  const { categoryName } = req.params;
  try {
    const category = await FoodCategory.findOne({ name: categoryName }).populate("products");
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(200).json(category.products);
  } catch (error) {
    console.error("Error fetching food products by category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllFoodCategoryNames = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await FoodCategory.find({}, "name geoName icon route");
    if (categories.length === 0) {
      res.status(404).json({ message: "No categories found" });
      return;
    }
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving food category names", error });
  }
};

// ==================== ANIMAL PRODUCTS ====================

export const getAllAnimalProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await AnimalProduct.find().populate("category");
    res.json(products);
  } catch (error) {
    console.error("Error fetching animal products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOneAnimalProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const product = await AnimalProduct.findById(id).populate("category");
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching animal product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAnimalProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  const { categoryName } = req.params;
  try {
    const category = await AnimalCategory.findOne({ name: categoryName }).populate("products");
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(200).json(category.products);
  } catch (error) {
    console.error("Error fetching animal products by category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllAnimalCategoryNames = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await AnimalCategory.find({}, "name geoName icon route");
    if (categories.length === 0) {
      res.status(404).json({ message: "No categories found" });
      return;
    }
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving animal category names", error });
  }
};
