import { Router } from "express";
import { getUserInfo, updateUserInfo } from "../controllers/userController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getUserInfo);
router.put("/updateUserInfo", updateUserInfo);

export default router;
