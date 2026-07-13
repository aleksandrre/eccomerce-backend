import { Request, Response } from "express";
import { AuthRequest } from "../../../types";
import { FAQ, IFaqQuestionDocument } from "../models/FaqModel";
import { getLang, localizeDoc } from "../../../shared/utils/lang";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCode } from "../../../shared/errors/errorCodes";
import { sendSuccess } from "../../../shared/utils/apiResponse";
import { requireFields } from "../../../shared/utils/validators";

const FAQ_FIELDS = ["name", "questions.question", "questions.answer"];

export const getAllFAQTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  const lang = getLang(req);
  const faqTypes = await FAQ.find({ isActive: true }).lean();
  const data = faqTypes.map((faq) =>
    localizeDoc(faq as Record<string, unknown>, FAQ_FIELDS, lang)
  );
  sendSuccess(res, data, "FAQ types fetched successfully");
};

export const addFAQType = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { questions, name, icon } = req.body;
  requireFields(req.body, ["name", "icon"]);

  const faqType = await FAQ.create({ name, icon, questions });
  sendSuccess(res, { faqType }, "FAQ type added successfully", 201);
};

export const deleteFAQType = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const deleted = await FAQ.findByIdAndDelete(req.params.faqTypeId);
  if (!deleted) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "FAQ type not found");
  }
  sendSuccess(res, null, "FAQ type deleted successfully");
};

export const addFAQQuestion = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { faqTypeId, question, answer } = req.body;
  requireFields(req.body, ["faqTypeId", "question", "answer"]);

  const faqType = await FAQ.findById(faqTypeId);
  if (!faqType) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "FAQ type not found");
  }

  faqType.questions.push({
    question,
    answer,
  } as unknown as IFaqQuestionDocument);
  await faqType.save();

  sendSuccess(res, { faqType }, "Question added successfully", 201);
};

export const deleteFAQQuestion = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { faqTypeId, faqQuestionId } = req.params;

  const faqType = await FAQ.findById(faqTypeId);
  if (!faqType) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "FAQ type not found");
  }

  const idx = faqType.questions.findIndex(
    (q) => q._id?.toString() === faqQuestionId
  );
  if (idx === -1) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "Question not found");
  }

  faqType.questions.splice(idx, 1);
  await faqType.save();

  sendSuccess(res, null, "Question deleted successfully");
};
