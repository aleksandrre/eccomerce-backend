import { Router } from "express";
import {
  getAllCartProducts,
  addToCart,
  deleteFromCart,
  deleteAllFromCart,
} from "../controllers/cartController";
import { authenticateToken } from "../../../shared/middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getAllCartProducts);
router.post("/add", addToCart);
router.delete("/remove", deleteFromCart);
router.delete("/clear", deleteAllFromCart);

export default router;
