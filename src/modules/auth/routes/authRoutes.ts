import { Router } from "express";
import { login, token, logout, changePassword } from "../controllers/authController";
import { authenticateToken } from "../../../shared/middlewares/authMiddleware";

const router = Router();

router.post("/login", login);
router.get("/token", token);
router.post("/logout", logout);
router.put("/changePassword", authenticateToken, changePassword);

export default router;
