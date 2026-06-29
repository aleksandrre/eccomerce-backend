import mongoose, { Schema, Document, Model } from "mongoose";
import { IAnimalProduct } from "../types";

export interface IAnimalProductDocument extends Omit<IAnimalProduct, "_id" | "discountedPrice">, Document {
  discountedPrice: number;
}

const animalProductSchema = new Schema<IAnimalProductDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    productType: {
      type: String,
      default: "animal",
      immutable: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "AnimalCategory",
      required: true,
    },
    longDescription: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: true,
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    isTopSale: {
      type: Boolean,
      default: false,
    },
    sale: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    packageWeight: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

animalProductSchema.virtual("discountedPrice").get(function () {
  return Number(
    (this.price - (this.price * this.sale) / 100).toFixed(2)
  );
});

export const AnimalProduct: Model<IAnimalProductDocument> = mongoose.model<IAnimalProductDocument>(
  "AnimalProduct",
  animalProductSchema
);
