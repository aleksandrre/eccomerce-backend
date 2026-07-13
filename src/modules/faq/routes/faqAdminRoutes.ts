import { Router } from "express";
import {
  addFAQType,
  deleteFAQType,
  addFAQQuestion,
  deleteFAQQuestion,
} from "../controllers/faqController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.post("/types", asyncHandler(addFAQType));
router.delete("/types/:faqTypeId", asyncHandler(deleteFAQType));
router.post("/questions", asyncHandler(addFAQQuestion));
router.delete(
  "/questions/:faqTypeId/:faqQuestionId",
  asyncHandler(deleteFAQQuestion)
);

export default router;
