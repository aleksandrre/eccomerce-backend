import mongoose, { Schema, Document, Model } from "mongoose";
import { IRefreshToken } from "../../types";

export interface IRefreshTokenDocument extends IRefreshToken, Document {}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>({
  token: String,
  userId: String,
});

export const RefreshToken: Model<IRefreshTokenDocument> =
  mongoose.model<IRefreshTokenDocument>("refreshToken", refreshTokenSchema);
