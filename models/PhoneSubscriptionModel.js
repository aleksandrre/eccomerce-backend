// models/PhoneSubscriptionModel.js
import mongoose from "mongoose";

const phoneSubscriptionSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, "ტელეფონის ნომერი სავალდებულოა"],
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^5\d{8}$/.test(v); // ვალიდაცია ქართული ნომრებისთვის (5xx-xx-xx-xx)
      },
      message: (props) => `${props.value} არ არის სწორი ტელეფონის ნომერი!`,
    },
  },
  subscriptionDate: {
    type: Date,
    default: Date.now,
  },
});

export const PhoneSubscription = mongoose.model(
  "PhoneSubscription",
  phoneSubscriptionSchema
);
