import express from "express";
import {
  addQuestion,
  deleteAllQuestion,
  getAllQuestion,
} from "../controllers/questionController.js";
const router = express.Router();

router.get("/", getAllQuestion);
router.post("/addQuestion", addQuestion);
router.delete("/deleteAllQuestion", deleteAllQuestion);

export default router;
