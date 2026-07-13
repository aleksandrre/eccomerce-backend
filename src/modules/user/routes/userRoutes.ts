import { Router } from "express";
import { getUserInfo, updateUserInfo } from "../controllers/userController";
import { authenticateToken } from "../../../shared/middlewares/authMiddleware";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.use(authenticateToken);

router.get("/", asyncHandler(getUserInfo));
router.put("/updateUserInfo", asyncHandler(updateUserInfo));

export default router;
