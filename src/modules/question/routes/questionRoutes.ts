import { Router } from "express";
import {
  addQuestion,
  getAllQuestion,
  deleteAllQuestion,
} from "../controllers/questionController";
import { authenticateToken } from "../../../shared/middlewares/authMiddleware";
import { isAdmin } from "../../../shared/middlewares/isAdminMiddleware";

const router = Router();

router.post("/add", addQuestion);
router.get("/", authenticateToken, isAdmin, getAllQuestion);
router.delete("/deleteAll", authenticateToken, isAdmin, deleteAllQuestion);

export default router;
