import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Auth
import authRoutes from "./modules/auth/routes/authRoutes";
import emailRoutes from "./modules/auth/routes/emailRoutes";

// Products
import foodProductRoutes from "./modules/food/routes/foodProductRoutes";
import animalProductRoutes from "./modules/animal/routes/animalProductRoutes";

// Admin
import foodAdminRoutes from "./modules/food/routes/foodAdminRoutes";
import animalAdminRoutes from "./modules/animal/routes/animalAdminRoutes";
import faqAdminRoutes from "./modules/faq/routes/faqAdminRoutes";
import questionAdminRoutes from "./modules/question/routes/questionAdminRoutes";
import subscriptionAdminRoutes from "./modules/subscription/routes/subscriptionAdminRoutes";

// Cart & User
import cartRoutes from "./modules/cart/routes/cartRoutes";
import userRoutes from "./modules/user/routes/userRoutes";

// Public
import faqRoutes from "./modules/faq/routes/faqRoutes";
import questionRoutes from "./modules/question/routes/questionRoutes";
import subscriptionRoutes from "./modules/subscription/routes/subscriptionRoutes";

import {
  authenticateToken,
} from "./shared/middlewares/authMiddleware";
import { isAdmin } from "./shared/middlewares/isAdminMiddleware";

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI as string;

const app = express();

app.use(cors());
app.use(express.json());

// ==================== AUTH ====================
app.use("/auth", authRoutes);
app.use("/email", emailRoutes);

// ==================== PRODUCTS (public) ====================
app.use("/products/food", foodProductRoutes);
app.use("/products/animal", animalProductRoutes);

// ==================== ADMIN ====================
app.use("/admin/food", authenticateToken, isAdmin, foodAdminRoutes);
app.use("/admin/animal", authenticateToken, isAdmin, animalAdminRoutes);
app.use("/admin/faq", authenticateToken, isAdmin, faqAdminRoutes);
app.use("/admin/question", authenticateToken, isAdmin, questionAdminRoutes);
app.use("/admin/subscription", authenticateToken, isAdmin, subscriptionAdminRoutes);

// ==================== CART & USER ====================
app.use("/cart", cartRoutes);
app.use("/user", userRoutes);

// ==================== PUBLIC ====================
app.use("/faq", faqRoutes);
app.use("/question", questionRoutes);
app.use("/subscription", subscriptionRoutes);

// ==================== DB ====================
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`App is listening on port ${PORT}`)
    );
  })
  .catch((error: Error) =>
    console.error("Error connecting to MongoDB:", error)
  );
