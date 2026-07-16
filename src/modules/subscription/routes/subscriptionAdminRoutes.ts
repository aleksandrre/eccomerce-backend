import { Router } from "express";
import {
  getEmailSubscribers,
  getPhoneSubscribers,
} from "../controllers/subscriptionController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.get("/email/subscribers", asyncHandler(getEmailSubscribers));
router.get("/phone/subscribers", asyncHandler(getPhoneSubscribers));

export default router;
