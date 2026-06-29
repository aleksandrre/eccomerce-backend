import { Question } from "../models/questionModel.js";

export const addQuestion = async (req, res) => {
  try {
    const { userName, email, title, question } = req.body;

    // Create new question document
    const newQuestion = new Question({
      userName,
      email,
      title,
      question,
    });

    // Save question to database
    const savedQuestion = await newQuestion.save();

    // Send successful response
    res.status(201).json({
      success: true,
      message: "კითხვა წარმატებით დაემატა",
      //   data: savedQuestion,
    });
  } catch (error) {
    // Handle error
    res.status(500).json({
      success: false,
      message: "კითხვის დამატება ვერ მოხერხდა",
      error: error.message,
    });
  }
};

export const getAllQuestion = async (req, res) => {
  try {
    // Fetch all questions from the database
    const questions = await Question.find().sort({ createdAt: -1 });

    // Return success response with questions data
    res.status(200).json({
      success: true,
      count: questions.length,
      message: "ყველა კითხვა წარმატებით ჩაიტვირთა",
      data: questions,
    });
  } catch (error) {
    // Handle error
    res.status(500).json({
      success: false,
      message: "კითხვების ჩატვირთვა ვერ მოხერხდა",
      error: error.message,
    });
  }
};

export const deleteAllQuestion = async (req, res) => {
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
      error: error.message,
    });
  }
};
