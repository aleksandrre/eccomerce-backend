import { Router } from "express";
import {
  addFoodCategory,
  deleteFoodCategory,
  addFoodProduct,
  updateFoodProduct,
  deleteFoodProduct,
} from "../controllers/foodAdminController";

const router = Router();

// Categories
router.post("/categories", addFoodCategory);
router.delete("/categories/:categoryId", deleteFoodCategory);

// Products
router.post("/products", addFoodProduct);
router.put("/products/:productId", updateFoodProduct);
router.delete("/products/:productId", deleteFoodProduct);

export default router;
