import mongoose, { Schema, Document, Model } from "mongoose";
import { IFoodCategory } from "../../../types";

export interface IFoodCategoryDocument extends Omit<IFoodCategory, "_id">, Document {}

const localizedStringSchema = {
  en: { type: String, required: true },
  ka: { type: String, default: "" },
  ru: { type: String, default: "" },
};

const foodCategorySchema = new Schema<IFoodCategoryDocument>({
  name: { type: localizedStringSchema, required: true },
  description: { type: String },
  icon: { type: String, required: true },
  slug: { type: String, required: true },
  products: [{ type: Schema.Types.ObjectId, ref: "FoodProduct" }],
});

export const FoodCategory: Model<IFoodCategoryDocument> =
  mongoose.model<IFoodCategoryDocument>("FoodCategory", foodCategorySchema);
