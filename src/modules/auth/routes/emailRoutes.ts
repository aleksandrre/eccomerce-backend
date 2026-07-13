import { Router } from "express";
import {
  registerUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/emailController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.post("/registration", asyncHandler(registerUser));
router.get("/verify/:token", asyncHandler(verifyEmail));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password/:token", asyncHandler(resetPassword));

export default router;
