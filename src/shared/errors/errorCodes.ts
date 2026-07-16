/**
 * Stable, machine-readable error codes returned to the client alongside a
 * human-readable English message. The frontend can switch on `code` for
 * distinct UI behavior and/or map it to its own localized text.
 *
 * Generic codes cover the common cases; specific codes exist only where the
 * frontend needs to react differently (e.g. show "email not verified" vs a
 * plain "invalid credentials").
 */
export const ErrorCode = {
  // ── Generic ────────────────────────────────────────────────
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",

  // ── Auth / token ───────────────────────────────────────────
  TOKEN_MISSING: "TOKEN_MISSING",
  TOKEN_INVALID: "TOKEN_INVALID",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  PASSWORDS_DO_NOT_MATCH: "PASSWORDS_DO_NOT_MATCH",
  SAME_PASSWORD: "SAME_PASSWORD",
  INCORRECT_OLD_PASSWORD: "INCORRECT_OLD_PASSWORD",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  NUMBER_EXISTS: "NUMBER_EXISTS",

  // ── Products / cart ────────────────────────────────────────
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
  CART_ITEM_NOT_FOUND: "CART_ITEM_NOT_FOUND",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  BELOW_MIN_KG: "BELOW_MIN_KG",

  // ── Subscriptions ──────────────────────────────────────────
  DUPLICATE_SUBSCRIPTION: "DUPLICATE_SUBSCRIPTION",

  // ── SMS ────────────────────────────────────────────────────
  SMS_SEND_FAILED: "SMS_SEND_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
