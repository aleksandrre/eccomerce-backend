import { Request } from "express";
import { Types } from "mongoose";

export type ProductType = "food" | "animal";

export interface JwtPayload {
  id: string;
  name: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ICartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  productType: ProductType;
  quantity: number;
  priceSnapshot: number;
  saleSnapshot: number;
  image?: string;
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  lastName: string;
  password: string;
  email: string;
  number: string;
  address?: string;
  isAdmin: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  emailVerified: boolean;
  resetToken?: string;
  resetTokenExpires?: Date;
  cart: ICartItem[];
  createdAt: Date;
  cartTotal: number;
  cartOriginalTotal: number;
  cartSavings: number;
}

export interface IFoodCategory {
  _id: Types.ObjectId;
  name: string;
  geoName: string;
  description?: string;
  icon: string;
  route: string;
  products: Types.ObjectId[];
}

export interface IAnimalCategory {
  _id: Types.ObjectId;
  name: string;
  geoName: string;
  description?: string;
  icon: string;
  route: string;
  products: Types.ObjectId[];
}

export interface IFoodProduct {
  _id: Types.ObjectId;
  name: string;
  productType: "food";
  category: Types.ObjectId;
  longDescription: string;
  shortDescription: string;
  images: string[];
  isNewProduct: boolean;
  isTopSale: boolean;
  sale: number;
  minKg: number;
  kgThreshold: number;
  priceBeforeThreshold: number;
  priceAfterThreshold: number;
  quantity: number;
  discountedPriceBeforeThreshold: number;
  discountedPriceAfterThreshold: number;
}

export interface IAnimalProduct {
  _id: Types.ObjectId;
  name: string;
  productType: "animal";
  category: Types.ObjectId;
  longDescription: string;
  shortDescription: string;
  images: string[];
  isNewProduct: boolean;
  isTopSale: boolean;
  sale: number;
  price: number;
  quantity: number;
  packageWeight: string;
  discountedPrice: number;
}

export interface IFaqQuestion {
  _id?: Types.ObjectId;
  question: string;
  answer: string;
  isActive: boolean;
}

export interface IFaq {
  _id: Types.ObjectId;
  name: string;
  icon: string;
  questions: IFaqQuestion[];
  isActive: boolean;
}

export interface IQuestion {
  _id: Types.ObjectId;
  userName: string;
  email: string;
  title?: string;
  question: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken {
  token: string;
  userId: string;
}

export interface IEmailSubscription {
  email: string;
  subscriptionDate: Date;
}

export interface IPhoneSubscription {
  phoneNumber: string;
  subscriptionDate: Date;
}
