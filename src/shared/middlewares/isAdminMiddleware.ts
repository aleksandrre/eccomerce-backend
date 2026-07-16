import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/errorCodes";

export function isAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user?.isAdmin) {
    next(
      AppError.forbidden(
        ErrorCode.FORBIDDEN,
        "Access denied. Admin privileges are required."
      )
    );
    return;
  }
  next();
}
