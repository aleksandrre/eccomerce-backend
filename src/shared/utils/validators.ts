import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/errorCodes";
import { ILocalizedString } from "../../types";

/**
 * Lightweight, dependency-free validation helpers. Each throws an `AppError`
 * with an appropriate code so the central error handler produces the standard
 * envelope. (A schema library such as Zod is a recommended future upgrade —
 * see PROJECT_STATUS.md.)
 */

export const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
export const PHONE_REGEX = /^5\d{8}$/;
// At least 8 chars, first is uppercase, ≥1 digit, ≥1 special character.
export const PASSWORD_REGEX =
  /^[A-Z](?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,24}$/;

export function requireFields(
  body: Record<string, unknown>,
  fields: string[]
): void {
  const missing = fields.filter((f) => {
    const v = body[f];
    return v === undefined || v === null || v === "";
  });
  if (missing.length > 0) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      `Missing required field(s): ${missing.join(", ")}`
    );
  }
}

export function assertValidEmail(email: unknown): asserts email is string {
  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      "A valid email address is required"
    );
  }
}

export function assertStrongPassword(
  password: unknown
): asserts password is string {
  if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
    throw AppError.badRequest(
      ErrorCode.INVALID_PASSWORD,
      "Password must be 8-24 characters, start with an uppercase letter, and contain at least one digit and one special character (!@#$%^&*)"
    );
  }
}

/**
 * Parses and validates a numeric field arriving as a string (form-data) or
 * number (JSON). Throws VALIDATION_ERROR on anything non-numeric.
 */
export function parseNumber(
  value: unknown,
  field: string,
  opts: { min?: number; max?: number; integer?: boolean } = {}
): number {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      `${field} must be a valid number`
    );
  }
  if (opts.integer && !Number.isInteger(num)) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      `${field} must be a whole number`
    );
  }
  if (opts.min !== undefined && num < opts.min) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      `${field} must be at least ${opts.min}`
    );
  }
  if (opts.max !== undefined && num > opts.max) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      `${field} must be at most ${opts.max}`
    );
  }
  return num;
}

/**
 * Accepts a localized field as either a JSON string (multipart form-data) or an
 * already-parsed object (JSON body) and returns a validated `{ en, ka, ru }`.
 * `en` is required; `ka`/`ru` default to "".
 */
export function parseLocalizedField(
  value: unknown,
  field: string
): ILocalizedString {
  let obj: unknown = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value);
    } catch {
      throw AppError.badRequest(
        ErrorCode.VALIDATION_ERROR,
        `${field} must be valid JSON with { en, ka, ru }`
      );
    }
  }
  if (
    !obj ||
    typeof obj !== "object" ||
    typeof (obj as Record<string, unknown>).en !== "string" ||
    !(obj as Record<string, unknown>).en
  ) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      `${field}.en is required`
    );
  }
  const rec = obj as Record<string, unknown>;
  return {
    en: rec.en as string,
    ka: typeof rec.ka === "string" ? rec.ka : "",
    ru: typeof rec.ru === "string" ? rec.ru : "",
  };
}
