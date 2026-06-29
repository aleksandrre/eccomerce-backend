import { Router } from "express";
import {
  getAllAnimalCategories,
  getAnimalProductsByCategory,
  getOneAnimalProduct,
  getAllAnimalProducts,
} from "../controllers/animalProductController";

const router = Router();

router.get("/categories", getAllAnimalCategories);
router.get("/category/:categoryName", getAnimalProductsByCategory);
router.get("/:id", getOneAnimalProduct);
router.get("/", getAllAnimalProducts);

export default router;
