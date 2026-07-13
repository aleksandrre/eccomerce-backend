import { Router } from "express";
import {
  getAllFoodCategories,
  getFoodProductsByCategory,
  getOneFoodProduct,
  getAllFoodProducts,
} from "../controllers/foodProductController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

// Specific routes must be declared before the "/:id" catch-all.
router.get("/categories", asyncHandler(getAllFoodCategories));
router.get("/category/:categoryId", asyncHandler(getFoodProductsByCategory));
router.get("/:id", asyncHandler(getOneFoodProduct));
router.get("/", asyncHandler(getAllFoodProducts));

export default router;
