// controllers/subscriptionController.js
import { EmailSubscription } from "../models/EmailSubscriptionModel.js";
import { PhoneSubscription } from "../models/PhoneSubscriptionModel.js";

export const subscribeEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "გთხოვთ მიუთითოთ email",
      });
    }

    const subscription = new EmailSubscription({ email });
    await subscription.save();

    res.status(201).json({
      success: true,
      message: "email გამოწერა წარმატებით დასრულდა",
      data: subscription,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "ეს email უკვე გამოწერილია",
      });
    }

    res.status(500).json({
      success: false,
      message: "დაფიქსირდა შეცდომა გამოწერისას",
      error: error.message,
    });
  }
};

export const subscribePhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "გთხოვთ მიუთითოთ ტელეფონის ნომერი",
      });
    }

    const subscription = new PhoneSubscription({ phoneNumber });
    await subscription.save();

    res.status(201).json({
      success: true,
      message: "ტელეფონის ნომრის გამოწერა წარმატებით დასრულდა",
      data: subscription,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "ეს ნომერი უკვე გამოწერილია",
      });
    }

    res.status(500).json({
      success: false,
      message: "დაფიქსირდა შეცდომა გამოწერისას",
      error: error.message,
    });
  }
};

export const getEmailSubscribers = async (req, res) => {
  try {
    const subscribers = await EmailSubscription.find().select(
      "email subscriptionDate"
    );

    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა email გამომწერების სიის მიღებისას",
      error: error.message,
    });
  }
};

export const getPhoneSubscribers = async (req, res) => {
  try {
    const subscribers = await PhoneSubscription.find().select(
      "phoneNumber subscriptionDate"
    );

    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა ტელეფონის გამომწერების სიის მიღებისას",
      error: error.message,
    });
  }
};
