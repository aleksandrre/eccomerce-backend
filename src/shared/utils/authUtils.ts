import jwt from "jsonwebtoken";
import { IUserDocument } from "../models/UserModel";
import { JwtPayload } from "../../types";
import { env } from "../config/env";

function toPayload(user: IUserDocument | JwtPayload): JwtPayload {
  return {
    id: String((user as IUserDocument)._id ?? (user as JwtPayload).id),
    name: user.name,
    isAdmin: user.isAdmin,
  };
}

export function generateAccessToken(user: IUserDocument | JwtPayload): string {
  return jwt.sign(toPayload(user), env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as jwt.SignOptions);
}

export function generateRefreshToken(user: IUserDocument | JwtPayload): string {
  return jwt.sign(toPayload(user), env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL,
  } as jwt.SignOptions);
}
