import { Router } from "express";
import { addQuestion, getAllQuestion, deleteAllQuestion } from "../controllers/questionController";

const router = Router();

router.get("/", getAllQuestion);
router.post("/addQuestion", addQuestion);
router.delete("/deleteAllQuestion", deleteAllQuestion);

export default router;
