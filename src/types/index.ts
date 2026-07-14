import { Request } from "express";
import { Types } from "mongoose";

export type ProductType = "food" | "animal";

export interface ILocalizedString {
  en: string;
  ka: string;
  ru: string;
}

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

// ==================== CART ====================

export interface ICartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  productType: ProductType;
  quantity: number;
  priceSnapshot: number;
  image?: string;
}

// ==================== USER ====================

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
}

// ==================== FOOD ====================

export interface IFoodCategory {
  _id: Types.ObjectId;
  name: ILocalizedString;
  description?: string;
  image: string;
  slug: string;
  products: Types.ObjectId[];
}

/**
 * საკვები პროდუქტი (კილოგრამებში).
 * ფასი ორ-საფეხურიანია:
 *   - pricePerKg       → ჩვეულებრივი ფასი (kgThreshold-ზე ნაკლები შეკვეთისას)
 *   - bulkPricePerKg   → ბალახური ფასი (kgThreshold-ის ან მეტის შეკვეთისას)
 * sale/ფასდაკლების % არ არის - ფასდაკლება მხოლოდ მოცულობის მიხედვით.
 */
export interface IFoodProduct {
  _id: Types.ObjectId;
  name: ILocalizedString;
  productType: "food";
  category: Types.ObjectId;
  description: ILocalizedString;
  images: string[];
  isNewProduct: boolean;
  minKg: number;
  kgThreshold: number;
  pricePerKg: number;
  bulkPricePerKg: number;
  quantity: number;
}

// ==================== ANIMAL ====================

export interface IAnimalCategory {
  _id: Types.ObjectId;
  name: ILocalizedString;
  description?: string;
  image: string;
  slug: string;
  products: Types.ObjectId[];
}

/**
 * ცხოველის საჭმელი (დაფასოებული პაკეტები).
 * quantity = პაკეტების რაოდენობა.
 * sale = ფასდაკლების % (0-100).
 * discountedPrice virtual = price * (1 - sale/100).
 */
export interface IAnimalProduct {
  _id: Types.ObjectId;
  name: ILocalizedString;
  productType: "animal";
  category: Types.ObjectId;
  description: ILocalizedString;
  images: string[];
  isNewProduct: boolean;
  sale: number;
  price: number;
  quantity: number;
  packageWeight: string;
  discountedPrice: number;
}

// ==================== FAQ ====================

export interface IFaqQuestion {
  _id?: Types.ObjectId;
  question: ILocalizedString;
  answer: ILocalizedString;
  isActive: boolean;
}

export interface IFaq {
  _id: Types.ObjectId;
  name: ILocalizedString;
  icon: string;
  questions: IFaqQuestion[];
  isActive: boolean;
}

// ==================== MISC ====================

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
