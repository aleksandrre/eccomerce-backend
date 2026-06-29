import { Request, Response } from "express";
import { Question } from "../models/QuestionModel";

export const addQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await new Question(req.body).save();
    res
      .status(201)
      .json({ success: true, message: "კითხვა წარმატებით დაემატა" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "კითხვის დამატება ვერ მოხერხდა",
    });
  }
};

export const getAllQuestion = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა" });
  }
};

export const deleteAllQuestion = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await Question.deleteMany({});
    res.status(200).json({
      success: true,
      message: "ყველა კითხვა წაიშალა",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა" });
  }
};
