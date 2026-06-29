import { FAQ } from "../models/faqModel.js"; // Import the FAQ model

// Get all FAQ Types with questions
export const getAllFAQTypes = async (req, res) => {
  try {
    // Query to get all active FAQ types
    const faqTypes = await FAQ.find({ isActive: true });

    // Check if no FAQ types found
    if (!faqTypes.length) {
      return res.status(404).json({ message: "No FAQ Types found." });
    }

    // Respond with the FAQ types and questions
    res
      .status(200)
      .json({ message: "FAQ Types fetched successfully", data: faqTypes });
  } catch (error) {
    // Handle any errors that occur during the query
    res
      .status(500)
      .json({ message: "Error fetching FAQ Types", error: error.message });
  }
};
