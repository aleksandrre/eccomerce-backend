import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  token: String,
  userId: String,
});

export const RefreshToken = mongoose.model("refreshToken", refreshTokenSchema);
