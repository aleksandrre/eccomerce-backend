import { Router } from "express";
import {
  addFoodCategory,
  deleteFoodCategory,
  addAnimalCategory,
  deleteAnimalCategory,
  addFoodProduct,
  updateFoodProduct,
  deleteFoodProduct,
  addAnimalProduct,
  updateAnimalProduct,
  deleteAnimalProduct,
  addFAQType,
  deleteFAQType,
  addFAQQuestion,
  deleteFAQQuestion,
} from "../controllers/adminController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/isAdminMiddleware";

const router = Router();

router.use(authenticateToken, isAdmin);

// Food categories
router.post("/food/add-category", addFoodCategory);
router.delete("/food/category/:categoryId", deleteFoodCategory);

// Animal categories
router.post("/animal/add-category", addAnimalCategory);
router.delete("/animal/category/:categoryId", deleteAnimalCategory);

// Food products
router.post("/food/add-product", addFoodProduct);
router.put("/food/products/:productId", updateFoodProduct);
router.delete("/food/products/:productId", deleteFoodProduct);

// Animal products
router.post("/animal/add-product", addAnimalProduct);
router.put("/animal/products/:productId", updateAnimalProduct);
router.delete("/animal/products/:productId", deleteAnimalProduct);

// FAQ
router.post("/addFaqType", addFAQType);
router.post("/addFaqQuestion", addFAQQuestion);
router.delete("/deleteFAQType/:faqTypeId", deleteFAQType);
router.delete("/deleteFAQQuestion/:faqTypeId/:faqQuestionId", deleteFAQQuestion);

export default router;
