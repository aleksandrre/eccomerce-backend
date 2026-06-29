import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser, ICartItem, ProductType } from "../types";

export interface ICartItemDocument extends Omit<ICartItem, "_id">, Document {
  discountedPrice: number;
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
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    priceSnapshot: {
      type: Number,
      required: true,
    },
    saleSnapshot: {
      type: Number,
      required: true,
      default: 0,
    },
    image: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cartItemSchema.virtual("discountedPrice").get(function () {
  return Number(
    (this.priceSnapshot - (this.priceSnapshot * this.saleSnapshot) / 100).toFixed(2)
  );
});

cartItemSchema.virtual("totalPrice").get(function () {
  return Number((this.discountedPrice * this.quantity).toFixed(2));
});

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    number: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    resetToken: String,
    resetTokenExpires: Date,
    cart: [cartItemSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("cartTotal").get(function () {
  if (!this.cart || this.cart.length === 0) return 0;
  return Number(
    this.cart.reduce((total: number, item: ICartItemDocument) => total + item.totalPrice, 0).toFixed(2)
  );
});

userSchema.virtual("cartOriginalTotal").get(function () {
  if (!this.cart || this.cart.length === 0) return 0;
  return Number(
    this.cart
      .reduce((total: number, item: ICartItemDocument) => total + item.priceSnapshot * item.quantity, 0)
      .toFixed(2)
  );
});

userSchema.virtual("cartSavings").get(function () {
  if (!this.cart || this.cart.length === 0) return 0;
  return Number((this.cartOriginalTotal - this.cartTotal).toFixed(2));
});

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>("users", userSchema);
