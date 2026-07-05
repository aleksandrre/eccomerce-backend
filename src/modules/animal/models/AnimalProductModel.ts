import mongoose, { Schema, Document, Model } from "mongoose";
import { IAnimalProduct } from "../../../types";

export interface IAnimalProductDocument
  extends Omit<IAnimalProduct, "_id" | "discountedPrice">,
    Document {
  discountedPrice: number;
}

/**
 * AnimalProduct — ცხოველის საჭმელი (დაფასოებული პაკეტი).
 *
 * quantity = პაკეტების რაოდენობა მარაგში.
 * packageWeight = პაკეტის წონის აღწერა (მაგ. "400გ", "1კგ") — display only.
 * sale = ფასდაკლება %-ში (0-100).
 * discountedPrice (virtual) = price * (1 - sale/100).
 */
const localizedStringSchema = {
  en: { type: String, required: true },
  ka: { type: String, default: "" },
  ru: { type: String, default: "" },
};

const animalProductSchema = new Schema<IAnimalProductDocument>(
  {
    name: { type: localizedStringSchema, required: true },
    productType: { type: String, default: "animal", immutable: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "AnimalCategory",
      required: true,
    },
    longDescription: { type: localizedStringSchema, required: true },
    shortDescription: { type: localizedStringSchema, required: true },
    images: { type: [String], required: true },
    isNewProduct: { type: Boolean, default: false },
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
      comment: "პაკეტების რაოდენობა მარაგში",
    },
    packageWeight: {
      type: String,
      required: true,
      comment: "მაგ: '400გ', '1კგ', '2კგ'",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

animalProductSchema.virtual("discountedPrice").get(function () {
  return Number((this.price - (this.price * this.sale) / 100).toFixed(2));
});

export const AnimalProduct: Model<IAnimalProductDocument> =
  mongoose.model<IAnimalProductDocument>("AnimalProduct", animalProductSchema);
