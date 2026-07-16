import { Router } from "express";
import {
  subscribeEmail,
  subscribePhone,
} from "../controllers/subscriptionController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.post("/email/subscribe", asyncHandler(subscribeEmail));
router.post("/phone/subscribe", asyncHandler(subscribePhone));

export default router;
