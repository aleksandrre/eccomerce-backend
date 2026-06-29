import { Router } from "express";
import {
  getAllFoodProducts,
  getOneFoodProduct,
  getFoodProductsByCategory,
  getAllFoodCategoryNames,
  getAllAnimalProducts,
  getOneAnimalProduct,
  getAnimalProductsByCategory,
  getAllAnimalCategoryNames,
} from "../controllers/productController";

const router = Router();

// ==================== FOOD ROUTES ====================
// სპეციფიკური route-ები /:id -ზე ადრე!
router.get("/food/categories", getAllFoodCategoryNames);
router.get("/food/category/:categoryName", getFoodProductsByCategory);
router.get("/food/:id", getOneFoodProduct);
router.get("/food", getAllFoodProducts);

// ==================== ANIMAL ROUTES ====================
router.get("/animal/categories", getAllAnimalCategoryNames);
router.get("/animal/category/:categoryName", getAnimalProductsByCategory);
router.get("/animal/:id", getOneAnimalProduct);
router.get("/animal", getAllAnimalProducts);

export default router;
