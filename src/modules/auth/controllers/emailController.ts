import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../../../shared/models/UserModel";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../../shared/utils/emailUtils";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCode } from "../../../shared/errors/errorCodes";
import { sendSuccess } from "../../../shared/utils/apiResponse";
import {
  requireFields,
  assertValidEmail,
  assertStrongPassword,
} from "../../../shared/utils/validators";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, lastName, password, email, number } = req.body;

  requireFields(req.body, [
    "name",
    "lastName",
    "password",
    "email",
    "number",
  ]);
  assertValidEmail(email);
  assertStrongPassword(password);

  if (await User.findOne({ email })) {
    throw AppError.conflict(ErrorCode.EMAIL_EXISTS, "Email already exists");
  }
  if (await User.findOne({ number })) {
    throw AppError.conflict(ErrorCode.NUMBER_EXISTS, "Number already in use");
  }

  const emailVerificationToken = crypto.randomBytes(20).toString("hex");
  const newUser = new User({
    name,
    lastName,
    password: await bcrypt.hash(password, 10),
    email,
    number,
    emailVerificationToken,
    emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });

  await newUser.save();
  await sendVerificationEmail(newUser);

  sendSuccess(
    res,
    null,
    "Registered successfully. Check your email for verification.",
    201
  );
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = await User.findOne({
    emailVerificationToken: req.params.token,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw AppError.badRequest(
      ErrorCode.TOKEN_INVALID,
      "Invalid or expired verification token"
    );
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  sendSuccess(res, null, "Email verified successfully");
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;
  requireFields(req.body, ["email"]);

  const resetToken = crypto.randomBytes(20).toString("hex");
  const user = await User.findOneAndUpdate(
    { email },
    {
      resetToken,
      resetTokenExpires: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
    { new: true }
  );

  // Send the email only if the account exists, but always return the same
  // generic response so accounts can't be enumerated via this endpoint.
  if (user) {
    await sendPasswordResetEmail(user);
  }

  sendSuccess(
    res,
    null,
    "If an account with that email exists, password reset instructions have been sent."
  );
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { newPassword } = req.body;
  requireFields(req.body, ["newPassword"]);
  assertStrongPassword(newPassword);

  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    throw AppError.badRequest(
      ErrorCode.TOKEN_INVALID,
      "Invalid or expired reset token"
    );
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  sendSuccess(res, null, "Password reset successful");
};
