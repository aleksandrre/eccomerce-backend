import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
  getAllCartProducts,
  addToCart,
  deleteFromCart,
  deleteAllFromCart,
} from "../controllers/cartController.js"; // Adjust the path based on your project structure

const router = express.Router();

router.get("/getAllCartProducts", authenticateToken, getAllCartProducts);
router.post("/addToCart", authenticateToken, addToCart);
router.delete("/deleteFromCart", authenticateToken, deleteFromCart);
router.delete("/deleteAllFromCart", authenticateToken, deleteAllFromCart);

export default router;
