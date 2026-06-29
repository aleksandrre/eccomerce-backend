import { Router } from "express";
import {
  addFAQType,
  deleteFAQType,
  addFAQQuestion,
  deleteFAQQuestion,
} from "../controllers/faqController";

const router = Router();

router.post("/types", addFAQType);
router.delete("/types/:faqTypeId", deleteFAQType);
router.post("/questions", addFAQQuestion);
router.delete("/questions/:faqTypeId/:faqQuestionId", deleteFAQQuestion);

export default router;
