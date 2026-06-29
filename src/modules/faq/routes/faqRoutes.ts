import { Router } from "express";
import { getAllFAQTypes } from "../controllers/faqController";

const router = Router();

router.get("/", getAllFAQTypes);

export default router;
