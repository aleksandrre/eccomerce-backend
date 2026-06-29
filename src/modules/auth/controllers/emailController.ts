import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../../../shared/models/UserModel";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../../shared/utils/emailUtils";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, lastName, password, email, number } = req.body;

    if (req.body.isAdmin) {
      res.status(400).json({ message: "Cannot register as admin" });
      return;
    }
    if (await User.findOne({ email })) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }
    if (await User.findOne({ number })) {
      res.status(400).json({ message: "Number already in use" });
      return;
    }

    const emailVerificationToken = crypto.randomBytes(20).toString("hex");
    const newUser = new User({
      name,
      lastName,
      password: await bcrypt.hash(password, 10),
      email,
      number,
      emailVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await newUser.save();
    await sendVerificationEmail(newUser);

    res.status(201).json({
      message: "Registered successfully. Check your email for verification.",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
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

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const resetToken = crypto.randomBytes(20).toString("hex");
    const user = await User.findOneAndUpdate(
      { email: req.body.email },
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
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    user.password = await bcrypt.hash(req.body.newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
