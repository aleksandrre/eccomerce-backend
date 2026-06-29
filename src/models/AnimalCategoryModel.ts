import mongoose, { Schema, Document, Model } from "mongoose";
import { IAnimalCategory } from "../types";

export interface IAnimalCategoryDocument extends Omit<IAnimalCategory, "_id">, Document {}

const animalCategorySchema = new Schema<IAnimalCategoryDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  geoName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  icon: {
    type: String,
    required: true,
  },
  route: {
    type: String,
    required: true,
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "AnimalProduct",
    },
  ],
});

export const AnimalCategory: Model<IAnimalCategoryDocument> = mongoose.model<IAnimalCategoryDocument>(
  "AnimalCategory",
  animalCategorySchema
);
