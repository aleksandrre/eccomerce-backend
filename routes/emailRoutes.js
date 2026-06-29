// routes/emailRoutes.js
import express from "express";
import * as emailController from "../controllers/emailController.js";

const router = express.Router();

router.post("/registration", emailController.registerUser);
router.get("/verify/:token", emailController.verifyEmail);
router.post("/forgot-password", emailController.forgotPassword);
router.post("/reset-password/:token", emailController.resetPassword);

export default router;
