import mongoose, { Schema, Document, Model } from "mongoose";
import { IAnimalCategory } from "../../../types";

export interface IAnimalCategoryDocument extends Omit<IAnimalCategory, "_id">, Document {}

const localizedStringSchema = {
  en: { type: String, required: true },
  ka: { type: String, default: "" },
  ru: { type: String, default: "" },
};

const animalCategorySchema = new Schema<IAnimalCategoryDocument>({
  name: { type: localizedStringSchema, required: true },
  description: { type: String },
  icon: { type: String, required: true },
  slug: { type: String, required: true },
  products: [{ type: Schema.Types.ObjectId, ref: "AnimalProduct" }],
});

export const AnimalCategory: Model<IAnimalCategoryDocument> =
  mongoose.model<IAnimalCategoryDocument>("AnimalCategory", animalCategorySchema);
