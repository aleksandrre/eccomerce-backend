// routes/authRoutes.js
import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { getUserInfo, updateUserInfo } from "../controllers/userController.js";

const router = express.Router();

router.get("/", authenticateToken, getUserInfo);
router.put("/updateUserInfo", authenticateToken, updateUserInfo);

export default router;
