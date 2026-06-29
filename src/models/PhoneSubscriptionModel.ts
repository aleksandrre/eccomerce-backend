import mongoose, { Schema, Document, Model } from "mongoose";
import { IPhoneSubscription } from "../types";

export interface IPhoneSubscriptionDocument extends IPhoneSubscription, Document {}

const phoneSubscriptionSchema = new Schema<IPhoneSubscriptionDocument>({
  phoneNumber: {
    type: String,
    required: [true, "ტელეფონის ნომერი სავალდებულოა"],
    unique: true,
    trim: true,
    validate: {
      validator: function (v: string) {
        return /^5\d{8}$/.test(v);
      },
      message: (props: { value: string }) => `${props.value} არ არის სწორი ტელეფონის ნომერი!`,
    },
  },
  subscriptionDate: {
    type: Date,
    default: Date.now,
  },
});

export const PhoneSubscription: Model<IPhoneSubscriptionDocument> = mongoose.model<IPhoneSubscriptionDocument>(
  "PhoneSubscription",
  phoneSubscriptionSchema
);
