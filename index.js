// Import necessary modules
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import productRoutes from "./routes/productsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishListRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";

import bcrypt from "bcryptjs";
import { User } from "./models/UserModel.js";

const PORT = process.env.PORT || 3001;

const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.use("/auth", authRoutes);
app.use("/email", emailRoutes);
app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/cart", cartRoutes);
app.use("/wishList", wishlistRoutes);
app.use("/faq", faqRoutes);
app.use("/user", userRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("/question", questionRoutes);

// Database connection
mongoose
  .connect(MONGODB_URI, {})
  .then(() => {
    console.log("Successfully connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`App is listening on ${PORT} port`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// async function createAdmin() {
//   try {
//     await mongoose.connect(MONGODB_URI);

//     const existingAdmin = await User.findOne({
//       email: "alekochokheli.01@gmail.com",
//     });
//     if (existingAdmin) {
//       console.log("Admin already exists!");
//       return;
//     }

//     const hashedPassword = await bcrypt.hash("vardisferi021", 10);

//     const adminUser = new User({
//       name: "carizma_admin", // შევცვალე username-დან name-ზე და გავხადე უნიკალური
//       lastName: "carizma",
//       email: "alekochokheli.01@gmail.com",
//       emailVerified: true,
//       password: hashedPassword,
//       isAdmin: true,
//       number:555168446,
//     });

//     await adminUser.save();
//     console.log("Admin user created successfully!");
//   } catch (error) {
//     console.error("Error creating admin:", error);
//   } finally {
//     await mongoose.connection.close();
//   }
// }

// createAdmin();
