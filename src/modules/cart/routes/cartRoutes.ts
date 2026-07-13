import { Router } from "express";
import {
  getAllCartProducts,
  addToCart,
  setCartQuantity,
  deleteFromCart,
  removeCartItem,
  deleteAllFromCart,
} from "../controllers/cartController";
import { authenticateToken } from "../../../shared/middlewares/authMiddleware";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.use(authenticateToken);

router.get("/", asyncHandler(getAllCartProducts));
router.post("/add", asyncHandler(addToCart));
// Set an absolute line quantity (cart-page input). New endpoint.
router.put("/set-quantity", asyncHandler(setCartQuantity));
router.delete("/remove", asyncHandler(deleteFromCart));
// Delete an entire line in one call (cart-page trash button). New endpoint.
router.delete("/remove-item", asyncHandler(removeCartItem));
router.delete("/clear", asyncHandler(deleteAllFromCart));

export default router;
