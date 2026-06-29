import { Router } from "express";
import {
  subscribeEmail,
  subscribePhone,
  getEmailSubscribers,
  getPhoneSubscribers,
} from "../controllers/subscriptionController";

const router = Router();

router.post("/email/subscribe", subscribeEmail);
router.get("/email/subscribers", getEmailSubscribers);
router.post("/phone/subscribe", subscribePhone);
router.get("/phone/subscribers", getPhoneSubscribers);

export default router;
