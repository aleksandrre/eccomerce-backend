// routes/subscriptionRoutes.js
import express from "express";
import {
  subscribeEmail,
  subscribePhone,
  getEmailSubscribers,
  getPhoneSubscribers,
} from "../controllers/subscriptionController.js";

const router = express.Router();

// Email subscription routes
router.post("/email/subscribe", subscribeEmail);
router.get("/email/subscribers", getEmailSubscribers);

// Phone subscription routes
router.post("/phone/subscribe", subscribePhone);
router.get("/phone/subscribers", getPhoneSubscribers);

export default router;
