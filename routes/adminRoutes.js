import express from "express";

const router = express.Router();
import {
  addProduct,
  deleteProductById,
  updateProduct,
  addCategory,
  addColorToProduct,
  deleteColorFromProductById,
  addFAQType,
  addQuestion,
  deleteFAQType,
  deleteFuqQuestion,
} from "../controllers/adminController.js"; // Adjust the path based on your project structure
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdminMiddleware .js";

router.post("/add-product", authenticateToken, isAdmin, addProduct);
router.post("/add-Category", authenticateToken, isAdmin, addCategory);
router.post("/add-color", authenticateToken, isAdmin, addColorToProduct);

router.delete(
  "/delete-product/:productId/:colorId",
  authenticateToken,
  isAdmin,
  deleteColorFromProductById
);
router.delete(
  "/delete-product/:productId",
  authenticateToken,
  isAdmin,
  deleteProductById
);
router.put("/products/:productId", authenticateToken, isAdmin, updateProduct);

//FAQ
router.post("/addFaqType", authenticateToken, isAdmin, addFAQType);
router.post("/addFaqQuestion", authenticateToken, isAdmin, addQuestion);
router.delete(
  "/deleteFAQType/:faqTypeId",
  authenticateToken,
  isAdmin,
  deleteFAQType
);
router.delete(
  "/deleteFuqQuestion/:faqTypeId/:FaqQuestionId",
  authenticateToken,
  isAdmin,
  deleteFuqQuestion
);

export default router;
