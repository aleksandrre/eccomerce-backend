import mongoose, { Schema, Document, Model } from "mongoose";
import { IFoodProduct } from "../types";

export interface IFoodProductDocument extends Omit<IFoodProduct, "_id" | "discountedPriceBeforeThreshold" | "discountedPriceAfterThreshold">, Document {
  discountedPriceBeforeThreshold: number;
  discountedPriceAfterThreshold: number;
}

const foodProductSchema = new Schema<IFoodProductDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    productType: {
      type: String,
      default: "food",
      immutable: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "FoodCategory",
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
    minKg: {
      type: Number,
      required: true,
      min: 0,
    },
    kgThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
    priceBeforeThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
    priceAfterThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

foodProductSchema.virtual("discountedPriceBeforeThreshold").get(function () {
  return Number(
    (this.priceBeforeThreshold - (this.priceBeforeThreshold * this.sale) / 100).toFixed(2)
  );
});

foodProductSchema.virtual("discountedPriceAfterThreshold").get(function () {
  return Number(
    (this.priceAfterThreshold - (this.priceAfterThreshold * this.sale) / 100).toFixed(2)
  );
});

export const FoodProduct: Model<IFoodProductDocument> = mongoose.model<IFoodProductDocument>(
  "FoodProduct",
  foodProductSchema
);
