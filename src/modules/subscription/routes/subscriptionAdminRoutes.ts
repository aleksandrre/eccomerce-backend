import { Router } from "express";
import { getEmailSubscribers, getPhoneSubscribers } from "../controllers/subscriptionController";

const router = Router();

router.get("/email/subscribers", getEmailSubscribers);
router.get("/phone/subscribers", getPhoneSubscribers);

export default router;
