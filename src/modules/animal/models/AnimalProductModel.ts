import mongoose, { Schema, Document, Model } from "mongoose";
import { IAnimalProduct } from "../../../types";
import { localizedStringSchema } from "../../../shared/models/localizedStringSchema";

export interface IAnimalProductDocument
  extends Omit<IAnimalProduct, "_id" | "discountedPrice">,
    Document {
  discountedPrice: number;
}

/**
 * AnimalProduct — packaged animal food (sold per package).
 *
 * quantity      = number of packages in stock.
 * packageWeight = display-only weight label (e.g. "400g", "1kg").
 * sale          = discount percentage (0-100).
 * discountedPrice (virtual) = price * (1 - sale/100).
 */
const animalProductSchema = new Schema<IAnimalProductDocument>(
  {
    name: { type: localizedStringSchema, required: true },
    productType: { type: String, default: "animal", immutable: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "AnimalCategory",
      required: true,
    },
    description: { type: localizedStringSchema, required: true },
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
      comment: "Number of packages in stock",
    },
    packageWeight: {
      type: String,
      required: true,
      comment: "Display label, e.g. '400g', '1kg', '2kg'",
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
