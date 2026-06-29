import { Router } from "express";
import {
  getAllCartProducts,
  addToCart,
  deleteFromCart,
  deleteAllFromCart,
} from "../controllers/cartController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/getAllCartProducts", getAllCartProducts);
router.post("/addToCart", addToCart);
router.delete("/deleteFromCart", deleteFromCart);
router.delete("/deleteAllFromCart", deleteAllFromCart);

export default router;
