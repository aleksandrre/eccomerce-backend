import { Request, Response } from "express";
import { ErrorCode } from "../errors/errorCodes";

/**
 * Catch-all for unmatched routes. Registered after all routers and before the
 * error handler so unknown paths get the standard error envelope instead of
 * Express's default HTML 404 page.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    code: ErrorCode.NOT_FOUND,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
