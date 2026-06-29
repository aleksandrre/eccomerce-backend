import express from "express";
import { getAllFAQTypes } from "../controllers/faqController.js";

const router = express.Router();

router.get("/", getAllFAQTypes);
export default router;
