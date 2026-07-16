import { Request, Response } from "express";
import {
  sendSms,
  getSmsBalance,
  getSmsStatus,
} from "../../../shared/services/smsService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCode } from "../../../shared/errors/errorCodes";
import { sendSuccess } from "../../../shared/utils/apiResponse";
import { requireFields } from "../../../shared/utils/validators";

/**
 * Admin-only endpoints for exercising the SMS Office integration manually
 * (send a test message, check credit balance, look up delivery status).
 *
 * Unlike the passive `sendSms` service — which never throws so notifications
 * can't break a business flow — a manual admin send is an explicit action, so a
 * failure is surfaced as an `AppError` (`SMS_SEND_FAILED`) with a clear message.
 */

/** POST /admin/sms/send — body: { to: string | string[], message, reference? } */
export const sendTestSms = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { to, message, reference } = req.body;
  requireFields(req.body, ["to", "message"]);

  const result = await sendSms(to, message, { reference });
  if (!result.success) {
    throw AppError.badRequest(
      ErrorCode.SMS_SEND_FAILED,
      result.skipped
        ? "SMS is not configured (missing SMS_API_KEY/SMS_SENDER)"
        : `SMS send failed (code ${result.errorCode}): ${result.message}`
    );
  }

  sendSuccess(res, result, "SMS sent");
};

/** GET /admin/sms/balance — remaining SMS credit count. */
export const getBalance = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const balance = await getSmsBalance();
  sendSuccess(res, { balance }, "SMS balance fetched");
};

/** GET /admin/sms/status?destination=...&reference=... — delivery status. */
export const getStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { destination, reference } = req.query;
  requireFields(req.query as Record<string, unknown>, [
    "destination",
    "reference",
  ]);

  const result = await getSmsStatus(String(destination), String(reference));
  sendSuccess(res, result, "SMS status fetched");
};
