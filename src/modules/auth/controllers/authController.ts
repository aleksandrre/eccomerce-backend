import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../../../shared/models/UserModel";
import { RefreshToken } from "../../../shared/models/RefreshTokenModel";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../shared/utils/authUtils";
import { AuthRequest, JwtPayload } from "../../../types";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCode } from "../../../shared/errors/errorCodes";
import { sendSuccess } from "../../../shared/utils/apiResponse";
import {
  requireFields,
  assertStrongPassword,
} from "../../../shared/utils/validators";
import { env } from "../../../shared/config/env";

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  requireFields(req.body, ["email", "password"]);

  // Password is select:false, so request it explicitly for the comparison.
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw AppError.unauthorized(
      ErrorCode.INVALID_CREDENTIALS,
      "Invalid email or password"
    );
  }
  if (!user.emailVerified) {
    throw AppError.unauthorized(
      ErrorCode.EMAIL_NOT_VERIFIED,
      "Please verify your email before logging in"
    );
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await RefreshToken.create({ token: refreshToken, userId: user._id });

  sendSuccess(res, { accessToken, refreshToken }, "Login successful");
};

export const token = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.body.token as string | undefined;
  if (!refreshToken) {
    throw AppError.unauthorized(
      ErrorCode.TOKEN_MISSING,
      "Refresh token is missing"
    );
  }

  const exists = await RefreshToken.findOne({ token: refreshToken });
  if (!exists) {
    throw AppError.forbidden(
      ErrorCode.TOKEN_INVALID,
      "Invalid refresh token"
    );
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as JwtPayload;
  } catch {
    throw AppError.forbidden(
      ErrorCode.TOKEN_INVALID,
      "Refresh token verification failed"
    );
  }

  sendSuccess(
    res,
    { accessToken: generateAccessToken(decoded) },
    "Access token refreshed"
  );
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.body.token as string | undefined;
  if (!refreshToken) {
    throw AppError.unauthorized(
      ErrorCode.TOKEN_MISSING,
      "Refresh token is missing"
    );
  }

  const deleted = await RefreshToken.findOneAndDelete({ token: refreshToken });
  if (!deleted) {
    throw AppError.forbidden(
      ErrorCode.TOKEN_INVALID,
      "Invalid refresh token"
    );
  }

  sendSuccess(res, null, "Logout successful");
};

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { oldPassword, newPassword, newPasswordRepeat } = req.body;
  requireFields(req.body, ["oldPassword", "newPassword", "newPasswordRepeat"]);

  if (oldPassword === newPassword) {
    throw AppError.badRequest(
      ErrorCode.SAME_PASSWORD,
      "New password must be different from the old password"
    );
  }
  if (newPassword !== newPasswordRepeat) {
    throw AppError.badRequest(
      ErrorCode.PASSWORDS_DO_NOT_MATCH,
      "New passwords do not match"
    );
  }
  assertStrongPassword(newPassword);

  const user = await User.findById(req.user?.id).select("+password");
  if (!user) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "User not found");
  }
  if (!(await bcrypt.compare(oldPassword, user.password))) {
    throw AppError.badRequest(
      ErrorCode.INCORRECT_OLD_PASSWORD,
      "Old password is incorrect"
    );
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  sendSuccess(res, null, "Password updated successfully");
};
