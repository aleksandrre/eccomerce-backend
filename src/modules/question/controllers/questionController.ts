import { Request, Response } from "express";
import { Question } from "../models/QuestionModel";
import { sendSuccess } from "../../../shared/utils/apiResponse";
import {
  requireFields,
  assertValidEmail,
} from "../../../shared/utils/validators";

export const addQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userName, email, title, question } = req.body;
  requireFields(req.body, ["userName", "email", "question"]);
  assertValidEmail(email);

  await Question.create({ userName, email, title, question });
  sendSuccess(res, null, "Question submitted successfully", 201);
};

export const getAllQuestion = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const questions = await Question.find().sort({ createdAt: -1 });
  sendSuccess(res, { count: questions.length, questions }, "Questions fetched");
};

export const deleteAllQuestion = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await Question.deleteMany({});
  sendSuccess(
    res,
    { deletedCount: result.deletedCount },
    "All questions deleted"
  );
};
