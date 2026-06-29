import { Router } from "express";
import {
  registerUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/emailController";

const router = Router();

router.post("/registration", registerUser);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
