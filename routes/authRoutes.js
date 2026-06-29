// routes/authRoutes.js
import express from "express";
import * as authController from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/login", authController.login);
router.get("/token", authController.token);
router.post("/logout", authController.logout);
router.put("/changePassword", authenticateToken, authController.changePassword);
export default router;
