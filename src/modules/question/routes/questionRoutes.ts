import { Router } from "express";
import { addQuestion } from "../controllers/questionController";

const router = Router();

router.post("/add", addQuestion);

export default router;
