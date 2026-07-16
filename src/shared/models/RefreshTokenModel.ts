import mongoose, { Schema, Document, Model } from "mongoose";
import { IRefreshToken } from "../../types";

export interface IRefreshTokenDocument extends IRefreshToken, Document {
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>({
  token: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  // TTL index: refresh tokens auto-expire after 7 days so abandoned sessions
  // don't accumulate stale documents forever.
  createdAt: { type: Date, default: Date.now, expires: "7d" },
});

export const RefreshToken: Model<IRefreshTokenDocument> =
  mongoose.model<IRefreshTokenDocument>("refreshToken", refreshTokenSchema);
