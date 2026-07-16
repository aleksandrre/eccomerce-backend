import { env } from "../config/env";

/**
 * SMS Office (smsoffice.ge) integration — a use-case-agnostic sending service.
 *
 * The whole app talks to SMS Office through the three helpers below; no module
 * should call the HTTP API directly. `sendSms` is intentionally decoupled from
 * any specific purpose (verification, order notification, marketing, …) so it
 * can be reused in a single line from anywhere:
 *
 *   await sendSms(user.number, "თქვენი შეკვეთა მიღებულია!");
 *   await sendSms(["599111222", "995577000000"], "აქცია!"); // bulk, mixed formats
 *
 * Delivery is best-effort: a failed send is logged and reported via the returned
 * `SmsResult` — it NEVER throws — so an SMS notification can never break the
 * business flow it is attached to. Callers that must react to failure (e.g. OTP)
 * inspect `result.success`.
 *
 * Credentials are optional (see `shared/config/env.ts`): when unset, sends are
 * skipped with a warning instead of crashing, so local dev works without keys.
 */

const SEND_URL = "https://smsoffice.ge/api/v2/send/";
const BALANCE_URL = "https://smsoffice.ge/api/getBalance";
const STATUS_URL = "https://smsoffice.ge/api/v2/getMessageStatus/";

export interface SendSmsOptions {
  /** Unique label (≤20 chars) required to later query delivery status. */
  reference?: string;
  /** Bypass the recipient's Do-Not-Disturb block (needs an approved sender). */
  urgent?: boolean;
  /** Unix timestamp (seconds) to schedule the message for later. */
  scheduledAt?: number;
}

export interface SmsResult {
  /** True only when SMS Office accepted the message (`ErrorCode === 0`). */
  success: boolean;
  /** True when the send was skipped because SMS credentials are not configured. */
  skipped?: boolean;
  /** SMS Office `ErrorCode` (0 = accepted, 20 = no balance, 80 = user not found, …). */
  errorCode?: number;
  /** Human-readable message from SMS Office (or the local error text). */
  message?: string;
  /** Raw parsed response body, for logging/debugging. */
  raw?: unknown;
}

/** SMS Office's `send` JSON envelope. */
interface SmsOfficeResponse {
  Success?: boolean;
  Message?: string;
  Output?: unknown;
  ErrorCode?: number;
}

/**
 * Normalizes a phone number to the international format SMS Office expects
 * (`995XXXXXXXXX`, no `+`/`00`): local `5XXXXXXXX` numbers are prefixed with
 * `995`, already-international numbers are passed through, and any `+`/leading
 * `00`/spaces are stripped. Anything else is returned best-effort as digits.
 */
function normalizeNumber(raw: string): string {
  let digits = raw.trim().replace(/[\s-]/g, "");
  digits = digits.replace(/^\+/, "").replace(/^00/, "");
  if (/^5\d{8}$/.test(digits)) return `995${digits}`;
  return digits;
}

/**
 * Sends an SMS to one or many recipients in a single API call.
 * Returns an `SmsResult` and never throws — inspect `result.success`.
 */
export async function sendSms(
  to: string | string[],
  content: string,
  options: SendSmsOptions = {}
): Promise<SmsResult> {
  if (!env.SMS_API_KEY || !env.SMS_SENDER) {
    console.warn(
      "[sms] SMS_API_KEY/SMS_SENDER not configured — skipping send"
    );
    return { success: false, skipped: true };
  }

  const destination = (Array.isArray(to) ? to : [to])
    .map(normalizeNumber)
    .join(",");

  const params = new URLSearchParams({
    key: env.SMS_API_KEY,
    sender: env.SMS_SENDER,
    destination,
    content,
  });
  if (options.reference) params.set("reference", options.reference);
  if (options.urgent) params.set("urgent", "true");
  if (options.scheduledAt !== undefined) {
    params.set("scheduledAt", String(options.scheduledAt));
  }

  try {
    const response = await fetch(SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = (await response.json()) as SmsOfficeResponse;
    const success = data.Success === true && data.ErrorCode === 0;
    if (!success) {
      console.error("[sms] send failed:", data);
    }
    return {
      success,
      errorCode: data.ErrorCode,
      message: data.Message,
      raw: data,
    };
  } catch (error) {
    console.error("[sms] send error:", error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Returns the remaining SMS credit balance, or `null` if it can't be read.
 * Never throws.
 */
export async function getSmsBalance(): Promise<number | null> {
  if (!env.SMS_API_KEY) {
    console.warn("[sms] SMS_API_KEY not configured — cannot read balance");
    return null;
  }
  try {
    const params = new URLSearchParams({ key: env.SMS_API_KEY });
    const response = await fetch(`${BALANCE_URL}?${params.toString()}`);
    const text = (await response.text()).trim();
    const balance = Number(text);
    return Number.isFinite(balance) ? balance : null;
  } catch (error) {
    console.error("[sms] balance error:", error);
    return null;
  }
}

/**
 * Looks up the delivery status of a previously-sent message (identified by its
 * `reference`) for a single recipient. Returns an `SmsResult`; never throws.
 */
export async function getSmsStatus(
  destination: string,
  reference: string
): Promise<SmsResult> {
  if (!env.SMS_API_KEY) {
    console.warn("[sms] SMS_API_KEY not configured — cannot read status");
    return { success: false, skipped: true };
  }
  try {
    const params = new URLSearchParams({
      key: env.SMS_API_KEY,
      destination: normalizeNumber(destination),
      reference,
    });
    const response = await fetch(`${STATUS_URL}?${params.toString()}`);
    const data = (await response.json()) as SmsOfficeResponse;
    return {
      success: data.Success === true,
      errorCode: data.ErrorCode,
      message: data.Message,
      raw: data,
    };
  } catch (error) {
    console.error("[sms] status error:", error);
    return { success: false, message: (error as Error).message };
  }
}
