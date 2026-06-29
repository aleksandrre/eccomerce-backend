import express from "express";
import {
  getAllCategoryName,
  getAllProducts,
  getCategory,
  getOneProduct,
} from "../controllers/productController.js"; // Adjust the path based on your project structure

const router = express.Router();

router.get("/", getAllProducts);
router.get("/allCategoryNames", getAllCategoryName);

router.get("/:id", getOneProduct);

router.get("/category/:categoryName", getCategory);

export default router;
