import { Router } from "express";
import {
  getAllQuestion,
  deleteAllQuestion,
} from "../controllers/questionController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getAllQuestion));
router.delete("/deleteAll", asyncHandler(deleteAllQuestion));

export default router;
