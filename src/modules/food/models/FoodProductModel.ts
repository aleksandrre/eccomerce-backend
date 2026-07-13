import mongoose, { Schema, Document, Model } from "mongoose";
import { IFoodProduct } from "../../../types";
import { localizedStringSchema } from "../../../shared/models/localizedStringSchema";

export interface IFoodProductDocument
  extends Omit<IFoodProduct, "_id">,
    Document {}

/**
 * FoodProduct — food sold by the kilogram.
 *
 * Price is derived from the ordered quantity (see shared/utils/pricing.ts):
 *   quantity <  kgThreshold → pricePerKg      (normal)
 *   quantity >= kgThreshold → bulkPricePerKg  (bulk / lower)
 *
 * There is no percentage sale for food — the discount is volume-based only.
 */
const foodProductSchema = new Schema<IFoodProductDocument>(
  {
    name: { type: localizedStringSchema, required: true },
    productType: { type: String, default: "food", immutable: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "FoodCategory",
      required: true,
    },
    description: { type: localizedStringSchema, required: true },
    images: { type: [String], required: true },
    isNewProduct: { type: Boolean, default: false },
    minKg: {
      type: Number,
      required: true,
      min: 0,
      comment: "Minimum order in kg (e.g. 0.5)",
    },
    kgThreshold: {
      type: Number,
      required: true,
      min: 0,
      comment: "Quantity at/above which bulk price applies (e.g. 10)",
    },
    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
      comment: "Price per kg when quantity < kgThreshold",
    },
    bulkPricePerKg: {
      type: Number,
      required: true,
      min: 0,
      comment: "Price per kg when quantity >= kgThreshold (lower)",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      comment: "Stock in kilograms",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const FoodProduct: Model<IFoodProductDocument> =
  mongoose.model<IFoodProductDocument>("FoodProduct", foodProductSchema);
