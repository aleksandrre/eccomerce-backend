import { Router } from "express";
import { getAllFAQTypes } from "../controllers/faqController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getAllFAQTypes));

export default router;
