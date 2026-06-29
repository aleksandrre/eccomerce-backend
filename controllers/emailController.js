// controllers/emailController.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/UserModel.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/emailUtils.js";

export async function registerUser(req, res) {
  try {
    const { name, lastName, password, email, number } = req.body;

    // Check if the email already exists
    const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    // Check if the number already exists
    const existingNumber = await User.findOne({ number: number });
    if (existingNumber) {
      return res.status(400).json({ message: "Number already in use" });
    }

    // Check if the user is trying to register as an admin
    if (req.body.isAdmin) {
      return res.status(400).json({ message: "Cannot register as admin" });
    }

    // Generate a random token for email verification
    const emailVerificationToken = crypto.randomBytes(20).toString("hex");

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the hashed password and email verification token
    const newUser = new User({
      name,
      lastName,
      password: hashedPassword,
      email,
      number,
      emailVerificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // Token expiration time (24 hours)
    });

    // Save the new user to the database
    await newUser.save();

    // Send email with verification link
    await sendVerificationEmail(newUser);

    res.status(201).json({
      message:
        "User registered successfully. Check your email for verification.",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const token = req.params.token;

    // Find the user with the corresponding email verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }, // Check if the token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    // Mark the user account as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    // Save the updated user information to the database
    await user.save();

    res.status(200).json({ message: "Email verification successful" });
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    // Step 2: Generate a Reset Token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Step 3: Store the Token
    const user = await User.findOneAndUpdate(
      { email },
      {
        resetToken: resetToken,
        resetTokenExpires: Date.now() + 3600000, // 1 hour expiration
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 4: Send Reset Instructions
    await sendPasswordResetEmail(user);

    res.status(200).json({ message: "Password reset instructions sent" });
  } catch (error) {
    console.error("Error during password reset request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function resetPassword(req, res) {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    // Step 6: Verify Token and Update Password
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }, // Check if the token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
