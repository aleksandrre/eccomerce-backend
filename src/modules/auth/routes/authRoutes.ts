import { Router } from "express";
import {
  login,
  token,
  logout,
  changePassword,
} from "../controllers/authController";
import { authenticateToken } from "../../../shared/middlewares/authMiddleware";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.post("/login", asyncHandler(login));
// Refresh access token. Changed from GET to POST: the refresh token travels in
// the request body, and GET bodies are unreliable (stripped by many proxies).
router.post("/token", asyncHandler(token));
router.post("/logout", asyncHandler(logout));
router.put("/changePassword", authenticateToken, asyncHandler(changePassword));

export default router;
