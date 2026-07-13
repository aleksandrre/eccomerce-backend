import { ErrorCode } from "./errorCodes";

/**
 * Operational error carrying an HTTP status, a stable machine code, and a
 * human-readable English message. Thrown from controllers/services and
 * translated into the standard error envelope by the central error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational = true;

  constructor(statusCode: number, code: ErrorCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(
    code: ErrorCode = ErrorCode.VALIDATION_ERROR,
    message = "Invalid request"
  ): AppError {
    return new AppError(400, code, message);
  }

  static unauthorized(
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
    message = "Unauthorized"
  ): AppError {
    return new AppError(401, code, message);
  }

  static forbidden(
    code: ErrorCode = ErrorCode.FORBIDDEN,
    message = "Access denied"
  ): AppError {
    return new AppError(403, code, message);
  }

  static notFound(
    code: ErrorCode = ErrorCode.NOT_FOUND,
    message = "Resource not found"
  ): AppError {
    return new AppError(404, code, message);
  }

  static conflict(
    code: ErrorCode = ErrorCode.CONFLICT,
    message = "Resource already exists"
  ): AppError {
    return new AppError(409, code, message);
  }
}
