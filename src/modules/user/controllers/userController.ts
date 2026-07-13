import { Response } from "express";
import { AuthRequest } from "../../../types";
import { User } from "../../../shared/models/UserModel";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCode } from "../../../shared/errors/errorCodes";
import { sendSuccess } from "../../../shared/utils/apiResponse";

export const getUserInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const user = await User.findById(req.user?.id).select(
    "name lastName email number address"
  );
  if (!user) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "User not found");
  }
  sendSuccess(res, { user }, "User fetched successfully");
};

export const updateUserInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { name, lastName, number, address } = req.body;

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "User not found");
  }

  const updates: Partial<{
    name: string;
    lastName: string;
    number: string;
    address: string;
  }> = {};

  if (name && name !== user.name) updates.name = name;
  if (lastName && lastName !== user.lastName) updates.lastName = lastName;
  if (number && number !== user.number) updates.number = number;
  if (address && address !== user.address) updates.address = address;

  if (!Object.keys(updates).length) {
    throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, "No changes detected");
  }

  Object.assign(user, updates);
  await user.save();

  sendSuccess(
    res,
    {
      user: {
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        number: user.number,
        address: user.address,
      },
    },
    "User updated successfully"
  );
};
