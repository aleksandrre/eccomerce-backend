import mongoose, { Schema, Document, Model } from "mongoose";
import { IFoodProduct } from "../../../types";

export interface IFoodProductDocument
  extends Omit<IFoodProduct, "_id">,
    Document {}

/**
 * FoodProduct — საკვები პროდუქტი კილოგრამებში.
 *
 * ფასი ავტომატურად განისაზღვრება შეკვეთის მოცულობის მიხედვით:
 *   quantity < kgThreshold  → pricePerKg  (ჩვეულებრივი ფასი)
 *   quantity >= kgThreshold → bulkPricePerKg (ბირთვული/დაბალი ფასი)
 *
 * sale/ფასდაკლება % არ არის — ფასდაკლება მხოლოდ მოცულობით.
 */
const localizedStringSchema = {
  en: { type: String, required: true },
  ka: { type: String, default: "" },
  ru: { type: String, default: "" },
};

const foodProductSchema = new Schema<IFoodProductDocument>(
  {
    name: { type: localizedStringSchema, required: true },
    productType: { type: String, default: "food", immutable: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "FoodCategory",
      required: true,
    },
    longDescription: { type: localizedStringSchema, required: true },
    shortDescription: { type: localizedStringSchema, required: true },
    images: { type: [String], required: true },
    isNewProduct: { type: Boolean, default: false },
    minKg: {
      type: Number,
      required: true,
      min: 0,
      comment: "მინიმალური შეკვეთის კგ (მაგ. 0.5)",
    },
    kgThreshold: {
      type: Number,
      required: true,
      min: 0,
      comment: "ზღვარი ბულკ-ფასზე გადასასვლელად (მაგ. 10)",
    },
    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
      comment: "ფასი კგ-ზე kgThreshold-ზე ნაკლები შეკვეთისთვის",
    },
    bulkPricePerKg: {
      type: Number,
      required: true,
      min: 0,
      comment: "ფასი კგ-ზე kgThreshold-ის ან მეტი შეკვეთისთვის (დაბალი)",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      comment: "მარაგი კილოგრამებში",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const FoodProduct: Model<IFoodProductDocument> =
  mongoose.model<IFoodProductDocument>("FoodProduct", foodProductSchema);
