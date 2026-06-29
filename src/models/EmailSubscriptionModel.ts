import mongoose, { Schema, Document, Model } from "mongoose";
import { IEmailSubscription } from "../types";

export interface IEmailSubscriptionDocument extends IEmailSubscription, Document {}

const emailSubscriptionSchema = new Schema<IEmailSubscriptionDocument>({
  email: {
    type: String,
    required: [true, "Email არის სავალდებულო"],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v: string) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: (props: { value: string }) => `${props.value} არ არის სწორი email მისამართი!`,
    },
  },
  subscriptionDate: {
    type: Date,
    default: Date.now,
  },
});

export const EmailSubscription: Model<IEmailSubscriptionDocument> = mongoose.model<IEmailSubscriptionDocument>(
  "EmailSubscription",
  emailSubscriptionSchema
);
