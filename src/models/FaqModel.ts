import mongoose, { Schema, Document, Model } from "mongoose";
import { IFaq, IFaqQuestion } from "../types";

export interface IFaqQuestionDocument extends Omit<IFaqQuestion, "_id">, Document {}
export interface IFaqDocument extends Omit<IFaq, "_id" | "questions">, Document {
  questions: IFaqQuestionDocument[];
}

const faqQuestionSchema = new Schema<IFaqQuestionDocument>({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const faqTypeSchema = new Schema<IFaqDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  icon: {
    type: String,
    required: true,
  },
  questions: [faqQuestionSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
});

export const FAQ: Model<IFaqDocument> = mongoose.model<IFaqDocument>("FAQ", faqTypeSchema);
