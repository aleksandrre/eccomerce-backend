import { Request, Response } from "express";
import { EmailSubscription } from "../models/EmailSubscriptionModel";
import { PhoneSubscription } from "../models/PhoneSubscriptionModel";

export const subscribeEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res
        .status(400)
        .json({ success: false, message: "გთხოვთ მიუთითოთ email" });
      return;
    }
    const sub = await new EmailSubscription({ email }).save();
    res.status(201).json({
      success: true,
      message: "Email გამოწერა წარმატებით დასრულდა",
      data: sub,
    });
  } catch (error) {
    const isDuplicate = (error as { code?: number }).code === 11000;
    res.status(isDuplicate ? 400 : 500).json({
      success: false,
      message: isDuplicate
        ? "ეს email უკვე გამოწერილია"
        : "შეცდომა გამოწერისას",
    });
  }
};

export const subscribePhone = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      res.status(400).json({
        success: false,
        message: "გთხოვთ მიუთითოთ ტელეფონის ნომერი",
      });
      return;
    }
    const sub = await new PhoneSubscription({ phoneNumber }).save();
    res.status(201).json({
      success: true,
      message: "ტელეფონის გამოწერა წარმატებით დასრულდა",
      data: sub,
    });
  } catch (error) {
    const isDuplicate = (error as { code?: number }).code === 11000;
    res.status(isDuplicate ? 400 : 500).json({
      success: false,
      message: isDuplicate
        ? "ეს ნომერი უკვე გამოწერილია"
        : "შეცდომა გამოწერისას",
    });
  }
};

export const getEmailSubscribers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const subs = await EmailSubscription.find().select(
      "email subscriptionDate"
    );
    res.status(200).json({ success: true, count: subs.length, data: subs });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა" });
  }
};

export const getPhoneSubscribers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const subs = await PhoneSubscription.find().select(
      "phoneNumber subscriptionDate"
    );
    res.status(200).json({ success: true, count: subs.length, data: subs });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა" });
  }
};
