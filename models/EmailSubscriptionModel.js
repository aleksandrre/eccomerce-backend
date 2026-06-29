import mongoose from "mongoose";

const emailSubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email არის სავალდებულო"],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: (props) => `${props.value} არ არის სწორი email მისამართი!`,
    },
  },
  subscriptionDate: {
    type: Date,
    default: Date.now,
  },
});

export const EmailSubscription = mongoose.model(
  "EmailSubscription",
  emailSubscriptionSchema
);
