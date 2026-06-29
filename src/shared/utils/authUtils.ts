import jwt from "jsonwebtoken";
import { IUserDocument } from "../models/UserModel";
import { JwtPayload } from "../../types";

export function generateAccessToken(
  user: IUserDocument | JwtPayload
): string {
  const payload: JwtPayload = {
    id: String((user as IUserDocument)._id ?? (user as JwtPayload).id),
    name: user.name,
    isAdmin: user.isAdmin,
  };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: "22760s",
  });
}

export function generateRefreshToken(
  user: IUserDocument | JwtPayload
): string {
  const payload: JwtPayload = {
    id: String((user as IUserDocument)._id ?? (user as JwtPayload).id),
    name: user.name,
    isAdmin: user.isAdmin,
  };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: "7d",
  });
}
