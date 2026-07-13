import { Router } from "express";
import {
  addAnimalCategory,
  deleteAnimalCategory,
  addAnimalProduct,
  updateAnimalProduct,
  deleteAnimalProduct,
} from "../controllers/animalAdminController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

// Categories
router.post("/categories", asyncHandler(addAnimalCategory));
router.delete("/categories/:categoryId", asyncHandler(deleteAnimalCategory));

// Products
router.post("/products", asyncHandler(addAnimalProduct));
router.put("/products/:productId", asyncHandler(updateAnimalProduct));
router.delete("/products/:productId", asyncHandler(deleteAnimalProduct));

export default router;
