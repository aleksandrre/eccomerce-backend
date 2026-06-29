import mongoose, { Schema, Document, Model } from "mongoose";
import { IEmailSubscription } from "../../../types";

export interface IEmailSubscriptionDocument
  extends IEmailSubscription,
    Document {}

const emailSubscriptionSchema = new Schema<IEmailSubscriptionDocument>({
  email: {
    type: String,
    required: [true, "Email სავალდებულოა"],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v: string) =>
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v),
      message: (p: { value: string }) =>
        `${p.value} არ არის სწორი email!`,
    },
  },
  subscriptionDate: { type: Date, default: Date.now },
});

export const EmailSubscription: Model<IEmailSubscriptionDocument> =
  mongoose.model<IEmailSubscriptionDocument>(
    "EmailSubscription",
    emailSubscriptionSchema
  );
