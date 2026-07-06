import { Router } from "express";
import {
  subscribeEmail,
  subscribePhone,
  getEmailSubscribers,
  getPhoneSubscribers,
} from "../controllers/subscriptionController";
import { authenticateToken } from "../../../shared/middlewares/authMiddleware";
import { isAdmin } from "../../../shared/middlewares/isAdminMiddleware";

const router = Router();

router.post("/email/subscribe", subscribeEmail);
router.post("/phone/subscribe", subscribePhone);
router.get("/email/subscribers", authenticateToken, isAdmin, getEmailSubscribers);
router.get("/phone/subscribers", authenticateToken, isAdmin, getPhoneSubscribers);

export default router;
