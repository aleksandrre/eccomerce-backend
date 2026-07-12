import { Router } from "express";
import { subscribeEmail, subscribePhone } from "../controllers/subscriptionController";

const router = Router();

router.post("/email/subscribe", subscribeEmail);
router.post("/phone/subscribe", subscribePhone);

export default router;
