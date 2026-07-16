import { Request, Response } from "express";
import { EmailSubscription } from "../models/EmailSubscriptionModel";
import { PhoneSubscription } from "../models/PhoneSubscriptionModel";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCode } from "../../../shared/errors/errorCodes";
import { sendSuccess } from "../../../shared/utils/apiResponse";
import {
  requireFields,
  assertValidEmail,
  PHONE_REGEX,
} from "../../../shared/utils/validators";

function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: number })?.code === 11000;
}

export const subscribeEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;
  requireFields(req.body, ["email"]);
  assertValidEmail(email);

  try {
    const subscription = await EmailSubscription.create({ email });
    sendSuccess(res, { subscription }, "Email subscribed successfully", 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw AppError.conflict(
        ErrorCode.DUPLICATE_SUBSCRIPTION,
        "This email is already subscribed"
      );
    }
    throw error;
  }
};

export const subscribePhone = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { phoneNumber } = req.body;
  requireFields(req.body, ["phoneNumber"]);
  if (typeof phoneNumber !== "string" || !PHONE_REGEX.test(phoneNumber)) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      "A valid phone number is required (format: 5xxxxxxxx)"
    );
  }

  try {
    const subscription = await PhoneSubscription.create({ phoneNumber });
    sendSuccess(res, { subscription }, "Phone subscribed successfully", 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw AppError.conflict(
        ErrorCode.DUPLICATE_SUBSCRIPTION,
        "This phone number is already subscribed"
      );
    }
    throw error;
  }
};

export const getEmailSubscribers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const subscribers = await EmailSubscription.find().select(
    "email subscriptionDate"
  );
  sendSuccess(
    res,
    { count: subscribers.length, subscribers },
    "Email subscribers fetched"
  );
};

export const getPhoneSubscribers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const subscribers = await PhoneSubscription.find().select(
    "phoneNumber subscriptionDate"
  );
  sendSuccess(
    res,
    { count: subscribers.length, subscribers },
    "Phone subscribers fetched"
  );
};
