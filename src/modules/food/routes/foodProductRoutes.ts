import { Router } from "express";
import {
  getAllFoodCategories,
  getFoodProductsByCategory,
  getOneFoodProduct,
  getAllFoodProducts,
} from "../controllers/foodProductController";

const router = Router();

// სპეციფიკური route-ები /:id -ზე ადრე
router.get("/categories", getAllFoodCategories);
router.get("/category/:slug", getFoodProductsByCategory);
router.get("/:id", getOneFoodProduct);
router.get("/", getAllFoodProducts);

export default router;
