import mongoose, { Schema, Document, Model } from "mongoose";
import { IPhoneSubscription } from "../../../types";

export interface IPhoneSubscriptionDocument
  extends IPhoneSubscription,
    Document {}

const phoneSubscriptionSchema = new Schema<IPhoneSubscriptionDocument>({
  phoneNumber: {
    type: String,
    required: [true, "ტელეფონის ნომერი სავალდებულოა"],
    unique: true,
    trim: true,
    validate: {
      validator: (v: string) => /^5\d{8}$/.test(v),
      message: (p: { value: string }) =>
        `${p.value} არ არის სწორი ნომერი! (5xxxxxxxx)`,
    },
  },
  subscriptionDate: { type: Date, default: Date.now },
});

export const PhoneSubscription: Model<IPhoneSubscriptionDocument> =
  mongoose.model<IPhoneSubscriptionDocument>(
    "PhoneSubscription",
    phoneSubscriptionSchema
  );
