import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../../types";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/errorCodes";
import { env } from "../config/env";

export function authenticateToken(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    next(
      AppError.unauthorized(
        ErrorCode.TOKEN_MISSING,
        "Authorization token is missing or malformed"
      )
    );
    return;
  }

  jwt.verify(token, env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      next(
        AppError.unauthorized(
          ErrorCode.TOKEN_INVALID,
          "Token verification failed"
        )
      );
      return;
    }
    req.user = decoded as JwtPayload;
    next();
  });
}
