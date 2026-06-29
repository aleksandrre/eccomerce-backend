import mongoose, { Schema, Document, Model } from "mongoose";
import { IFoodCategory } from "../../../types";

export interface IFoodCategoryDocument extends Omit<IFoodCategory, "_id">, Document {}

const foodCategorySchema = new Schema<IFoodCategoryDocument>({
  name: { type: String, required: true, unique: true },
  geoName: { type: String, required: true },
  description: { type: String },
  icon: { type: String, required: true },
  route: { type: String, required: true },
  products: [{ type: Schema.Types.ObjectId, ref: "FoodProduct" }],
});

export const FoodCategory: Model<IFoodCategoryDocument> =
  mongoose.model<IFoodCategoryDocument>("FoodCategory", foodCategorySchema);
