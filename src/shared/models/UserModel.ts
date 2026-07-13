import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser, ICartItem, ProductType } from "../../types";

export interface ICartItemDocument extends Omit<ICartItem, "_id">, Document {
  totalPrice: number;
}

export interface IUserDocument extends Omit<IUser, "_id" | "cart">, Document {
  cart: ICartItemDocument[];
}

const cartItemSchema = new Schema<ICartItemDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "cart.productType",
    },
    productType: {
      type: String,
      required: true,
      enum: ["food", "animal"] as ProductType[],
    },
    quantity: { type: Number, required: true, min: 0 },
    priceSnapshot: { type: Number, required: true },
    image: { type: String },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Per-line convenience total. Cart-level totals (including original price and
// savings) are computed live in the cart controller from current product
// prices — see modules/cart/cartController.ts.
cartItemSchema.virtual("totalPrice").get(function () {
  return Number((this.priceSnapshot * this.quantity).toFixed(2));
});

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    // select:false → the hash is never loaded/serialized unless explicitly
    // requested via .select("+password") (login / changePassword only).
    password: { type: String, required: true, select: false },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    number: { type: String, required: true, unique: true, trim: true },
    address: { type: String },
    isAdmin: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    emailVerified: { type: Boolean, default: false },
    resetToken: String,
    resetTokenExpires: Date,
    cart: [cartItemSchema],
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>(
  "users",
  userSchema
);
