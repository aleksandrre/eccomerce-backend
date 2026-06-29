import { Request, Response } from "express";
import { FAQ } from "../models/FaqModel";

export const getAllFAQTypes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const faqTypes = await FAQ.find({ isActive: true });

    if (!faqTypes.length) {
      res.status(404).json({ message: "No FAQ Types found." });
      return;
    }

    res.status(200).json({ message: "FAQ Types fetched successfully", data: faqTypes });
  } catch (error) {
    res.status(500).json({ message: "Error fetching FAQ Types", error: (error as Error).message });
  }
};
