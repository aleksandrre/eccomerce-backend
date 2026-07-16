import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/errorCodes";

interface ErrorEnvelope {
  success: false;
  code: ErrorCode;
  message: string;
}

function envelope(code: ErrorCode, message: string): ErrorEnvelope {
  return { success: false, code, message };
}

/**
 * Central error-handling middleware. Every error — thrown AppError, Mongoose
 * validation/cast errors, duplicate-key errors, Multer errors, or anything
 * unexpected — is converted into the standard error envelope here. Internal
 * details are never leaked to the client; unexpected errors are logged.
 *
 * Must be registered LAST, after all routes.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Our own operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json(envelope(err.code, err.message));
    return;
  }

  if (err && typeof err === "object") {
    const anyErr = err as {
      name?: string;
      code?: number;
      message?: string;
      errors?: Record<string, { message?: string }>;
      keyValue?: Record<string, unknown>;
    };

    // Mongoose schema validation error
    if (anyErr.name === "ValidationError" && anyErr.errors) {
      const first = Object.values(anyErr.errors)[0];
      res
        .status(400)
        .json(
          envelope(
            ErrorCode.VALIDATION_ERROR,
            first?.message || "Validation failed"
          )
        );
      return;
    }

    // Invalid ObjectId / cast error
    if (anyErr.name === "CastError") {
      res
        .status(400)
        .json(envelope(ErrorCode.VALIDATION_ERROR, "Invalid identifier format"));
      return;
    }

    // Duplicate unique key
    if (anyErr.code === 11000) {
      const field = anyErr.keyValue
        ? Object.keys(anyErr.keyValue)[0]
        : "field";
      res
        .status(409)
        .json(envelope(ErrorCode.CONFLICT, `${field} already exists`));
      return;
    }

    // Multer upload errors
    if (anyErr.name === "MulterError") {
      res
        .status(400)
        .json(
          envelope(
            ErrorCode.VALIDATION_ERROR,
            anyErr.message || "File upload error"
          )
        );
      return;
    }
  }

  // Anything else is unexpected — log it, hide details from the client.
  // eslint-disable-next-line no-console
  console.error("[unhandled error]", err);
  res
    .status(500)
    .json(envelope(ErrorCode.INTERNAL_ERROR, "Internal server error"));
}
