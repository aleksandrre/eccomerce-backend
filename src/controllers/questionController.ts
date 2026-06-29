import { Request, Response } from "express";
import { Question } from "../models/QuestionModel";

export const addQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userName, email, title, question } = req.body;
    const newQuestion = new Question({ userName, email, title, question });
    await newQuestion.save();
    res.status(201).json({ success: true, message: "კითხვა წარმატებით დაემატა" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "კითხვის დამატება ვერ მოხერხდა",
      error: (error as Error).message,
    });
  }
};

export const getAllQuestion = async (_req: Request, res: Response): Promise<void> => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: questions.length,
      message: "ყველა კითხვა წარმატებით ჩაიტვირთა",
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "კითხვების ჩატვირთვა ვერ მოხერხდა",
      error: (error as Error).message,
    });
  }
};

export const deleteAllQuestion = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await Question.deleteMany({});
    res.status(200).json({
      success: true,
      message: "ყველა კითხვა წარმატებით წაიშალა",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "კითხვების წაშლა ვერ მოხერხდა",
      error: (error as Error).message,
    });
  }
};
