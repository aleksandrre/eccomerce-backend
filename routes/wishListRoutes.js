import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishListController.js";

const router = express.Router();

// სურვილების სრული სიის წამოღება
router.get("/", authenticateToken, getWishlist);

// სურვილების სიაში დამატება (colorId არის optional)
router.post("/add/:productId/:colorId?", authenticateToken, addToWishlist);

// სურვილების სიიდან წაშლა (colorId არის optional)
router.delete(
  "/remove/:productId/:colorId?",
  authenticateToken,
  removeFromWishlist
);

// მთლიანი სიის წაშლა
router.delete("/clear", authenticateToken, clearWishlist);

export default router;
