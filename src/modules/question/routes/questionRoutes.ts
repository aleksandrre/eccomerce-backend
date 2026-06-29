import { Router } from "express";
import {
  addQuestion,
  getAllQuestion,
  deleteAllQuestion,
} from "../controllers/questionController";

const router = Router();

router.get("/", getAllQuestion);
router.post("/add", addQuestion);
router.delete("/deleteAll", deleteAllQuestion);

export default router;
