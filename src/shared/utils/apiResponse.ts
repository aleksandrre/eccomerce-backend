import { Response } from "express";

/**
 * Standard success envelope used by every endpoint:
 *   { "success": true, "data": <payload>, "message": "<English default>" }
 *
 * Keeping this in one place guarantees a consistent response shape across the
 * whole API. Error responses are produced by the central error handler.
 */
export function sendSuccess<T>(
  res: Response,
  data: T = null as T,
  message = "OK",
  statusCode = 200
): void {
  res.status(statusCode).json({ success: true, data, message });
}
