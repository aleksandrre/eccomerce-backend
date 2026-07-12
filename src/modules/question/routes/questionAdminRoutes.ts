import { Router } from "express";
import { getAllQuestion, deleteAllQuestion } from "../controllers/questionController";

const router = Router();

router.get("/", getAllQuestion);
router.delete("/deleteAll", deleteAllQuestion);

export default router;
