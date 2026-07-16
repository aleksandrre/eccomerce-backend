import { Router } from "express";
import {
  addFoodCategory,
  deleteFoodCategory,
  addFoodProduct,
  updateFoodProduct,
  deleteFoodProduct,
} from "../controllers/foodAdminController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

// Categories
router.post("/categories", asyncHandler(addFoodCategory));
router.delete("/categories/:categoryId", asyncHandler(deleteFoodCategory));

// Products
router.post("/products", asyncHandler(addFoodProduct));
router.put("/products/:productId", asyncHandler(updateFoodProduct));
router.delete("/products/:productId", asyncHandler(deleteFoodProduct));

export default router;
