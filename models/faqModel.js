import mongoose from "mongoose";

// FAQ კითხვის სქემა
const faqQuestionSchema = new mongoose.Schema({
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

// FAQ ტიპის სქემა
const faqTypeSchema = new mongoose.Schema({
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

export const FAQ = mongoose.model("FAQ", faqTypeSchema);
