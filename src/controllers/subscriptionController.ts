import { Request, Response } from "express";
import { EmailSubscription } from "../models/EmailSubscriptionModel";
import { PhoneSubscription } from "../models/PhoneSubscriptionModel";

export const subscribeEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "გთხოვთ მიუთითოთ email" });
      return;
    }

    const subscription = new EmailSubscription({ email });
    await subscription.save();

    res.status(201).json({
      success: true,
      message: "email გამოწერა წარმატებით დასრულდა",
      data: subscription,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      res.status(400).json({ success: false, message: "ეს email უკვე გამოწერილია" });
      return;
    }
    res.status(500).json({
      success: false,
      message: "დაფიქსირდა შეცდომა გამოწერისას",
      error: (error as Error).message,
    });
  }
};

export const subscribePhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      res.status(400).json({ success: false, message: "გთხოვთ მიუთითოთ ტელეფონის ნომერი" });
      return;
    }

    const subscription = new PhoneSubscription({ phoneNumber });
    await subscription.save();

    res.status(201).json({
      success: true,
      message: "ტელეფონის ნომრის გამოწერა წარმატებით დასრულდა",
      data: subscription,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      res.status(400).json({ success: false, message: "ეს ნომერი უკვე გამოწერილია" });
      return;
    }
    res.status(500).json({
      success: false,
      message: "დაფიქსირდა შეცდომა გამოწერისას",
      error: (error as Error).message,
    });
  }
};

export const getEmailSubscribers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subscribers = await EmailSubscription.find().select("email subscriptionDate");
    res.status(200).json({ success: true, count: subscribers.length, data: subscribers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა email გამომწერების სიის მიღებისას",
      error: (error as Error).message,
    });
  }
};

export const getPhoneSubscribers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subscribers = await PhoneSubscription.find().select("phoneNumber subscriptionDate");
    res.status(200).json({ success: true, count: subscribers.length, data: subscribers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა ტელეფონის გამომწერების სიის მიღებისას",
      error: (error as Error).message,
    });
  }
};
