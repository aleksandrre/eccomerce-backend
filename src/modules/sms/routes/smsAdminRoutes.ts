import { Router } from "express";
import {
  sendTestSms,
  getBalance,
  getStatus,
} from "../controllers/smsAdminController";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

router.post("/send", asyncHandler(sendTestSms));
router.get("/balance", asyncHandler(getBalance));
router.get("/status", asyncHandler(getStatus));

export default router;
