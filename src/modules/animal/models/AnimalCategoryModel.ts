import mongoose, { Schema, Document, Model } from "mongoose";
import { IAnimalCategory } from "../../../types";
import { localizedStringSchema } from "../../../shared/models/localizedStringSchema";

export interface IAnimalCategoryDocument extends Omit<IAnimalCategory, "_id">, Document {}

const animalCategorySchema = new Schema<IAnimalCategoryDocument>({
  name: { type: localizedStringSchema, required: true },
  description: { type: String },
  icon: { type: String, required: true },
  slug: { type: String, required: true },
  products: [{ type: Schema.Types.ObjectId, ref: "AnimalProduct" }],
});

export const AnimalCategory: Model<IAnimalCategoryDocument> =
  mongoose.model<IAnimalCategoryDocument>("AnimalCategory", animalCategorySchema);
