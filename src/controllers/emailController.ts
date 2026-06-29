import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/UserModel";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailUtils";

export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, lastName, password, email, number } = req.body;

    if (req.body.isAdmin) {
      res.status(400).json({ message: "Cannot register as admin" });
      return;
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }

    const existingNumber = await User.findOne({ number });
    if (existingNumber) {
      res.status(400).json({ message: "Number already in use" });
      return;
    }

    const emailVerificationToken = crypto.randomBytes(20).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      lastName,
      password: hashedPassword,
      email,
      number,
      emailVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await newUser.save();
    await sendVerificationEmail(newUser);

    res.status(201).json({
      message: "User registered successfully. Check your email for verification.",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verification successful" });
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  try {
    const resetToken = crypto.randomBytes(20).toString("hex");

    const user = await User.findOneAndUpdate(
      { email },
      {
        resetToken,
        resetTokenExpires: new Date(Date.now() + 3600000),
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await sendPasswordResetEmail(user);
    res.status(200).json({ message: "Password reset instructions sent" });
  } catch (error) {
    console.error("Error during password reset request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
