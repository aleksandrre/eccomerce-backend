import { Request, Response } from "express";
import { AuthRequest } from "../../../types";
import { FAQ } from "../models/FaqModel";
import { getLang, localizeDoc } from "../../../shared/utils/lang";

export const getAllFAQTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = getLang(req);
    const faqTypes = await FAQ.find({ isActive: true }).lean();
    if (!faqTypes.length) {
      res.status(404).json({ message: "No FAQ Types found." });
      return;
    }
    const data = faqTypes.map((faq) =>
      localizeDoc(faq as Record<string, unknown>, [
        "name",
        "questions.question",
        "questions.answer",
      ], lang)
    );
    res.status(200).json({ message: "FAQ Types fetched successfully", data });
  } catch (error) {
    res.status(500).json({ message: "Error fetching FAQ Types" });
  }
};

export const addFAQType = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { questions, name, icon } = req.body;
    if (await FAQ.findOne({ "name.en": name?.en })) {
      res.status(400).json({ message: "FAQ type with this name already exists" });
      return;
    }
    const faqType = await new FAQ({ name, icon, questions }).save();
    res.status(201).json({ message: "FAQ Type added", data: faqType });
  } catch (error) {
    res.status(500).json({ message: "Error adding FAQ Type" });
  }
};

export const deleteFAQType = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const deleted = await FAQ.findByIdAndDelete(req.params.faqTypeId);
    if (!deleted) {
      res.status(404).json({ message: "FAQ Type not found" });
      return;
    }
    res.status(200).json({ message: "FAQ Type deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting FAQ Type" });
  }
};

export const addFAQQuestion = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { faqTypeId, question, answer } = req.body;
    const faqType = await FAQ.findById(faqTypeId);
    if (!faqType) {
      res.status(404).json({ message: "FAQ Type not found" });
      return;
    }
    faqType.questions.push({ question, answer } as never);
    await faqType.save();
    res.status(201).json({ message: "Question added" });
  } catch (error) {
    res.status(500).json({ message: "Error adding question" });
  }
};

export const deleteFAQQuestion = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { faqTypeId, faqQuestionId } = req.params;
    const faqType = await FAQ.findById(faqTypeId);
    if (!faqType) {
      res.status(404).json({ message: "FAQ Type not found" });
      return;
    }
    const idx = faqType.questions.findIndex(
      (q) => q._id?.toString() === faqQuestionId
    );
    if (idx === -1) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    faqType.questions.splice(idx, 1);
    await faqType.save();
    res.status(200).json({ message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting question" });
  }
};
