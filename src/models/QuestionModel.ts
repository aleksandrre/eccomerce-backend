import mongoose, { Schema, Document, Model } from "mongoose";
import { IQuestion } from "../types";

export interface IQuestionDocument extends Omit<IQuestion, "_id">, Document {}

const questionSchema = new Schema<IQuestionDocument>(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props: { value: string }) => `${props.value} არ არის სწორი email მისამართი!`,
      },
    },
    title: {
      type: String,
    },
    question: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Question: Model<IQuestionDocument> = mongoose.model<IQuestionDocument>("Question", questionSchema);
