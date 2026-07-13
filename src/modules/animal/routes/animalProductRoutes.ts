import { Router } from "express";
import {
  getAllAnimalCategories,
  getAnimalProductsByCategory,
  getOneAnimalProduct,
  getAllAnimalProducts,
} from "../controllers/animalProductController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

// Specific routes must be declared before the "/:id" catch-all.
router.get("/categories", asyncHandler(getAllAnimalCategories));
router.get("/category/:categoryId", asyncHandler(getAnimalProductsByCategory));
router.get("/:id", asyncHandler(getOneAnimalProduct));
router.get("/", asyncHandler(getAllAnimalProducts));

export default router;
