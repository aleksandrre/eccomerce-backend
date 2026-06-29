import { Router } from "express";
import {
  addAnimalCategory,
  deleteAnimalCategory,
  addAnimalProduct,
  updateAnimalProduct,
  deleteAnimalProduct,
} from "../controllers/animalAdminController";

const router = Router();

// Categories
router.post("/categories", addAnimalCategory);
router.delete("/categories/:categoryId", deleteAnimalCategory);

// Products
router.post("/products", addAnimalProduct);
router.put("/products/:productId", updateAnimalProduct);
router.delete("/products/:productId", deleteAnimalProduct);

export default router;
