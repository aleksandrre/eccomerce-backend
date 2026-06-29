import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes";
import emailRoutes from "./routes/emailRoutes";
import productRoutes from "./routes/productsRoutes";
import adminRoutes from "./routes/adminRoutes";
import cartRoutes from "./routes/cartRoutes";
import faqRoutes from "./routes/faqRoutes";
import userRoutes from "./routes/userRoutes";
import subscriptionRoutes from "./routes/subscriptionRoutes";
import questionRoutes from "./routes/questionRoutes";

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI as string;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/email", emailRoutes);
app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/cart", cartRoutes);
app.use("/faq", faqRoutes);
app.use("/user", userRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("/question", questionRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`App is listening on ${PORT} port`);
    });
  })
  .catch((error: Error) => {
    console.error("Error connecting to MongoDB:", error);
  });
