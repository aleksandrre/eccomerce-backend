import { Router } from "express";
import { addQuestion } from "../controllers/questionController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.post("/add", asyncHandler(addQuestion));

export default router;
