// controllers/questionController.js
const Question = require('../models/Question');

exports.createQuestion = async (req, res) => {
  const { question, options, correctAnswer, category, difficulty } = req.body;
  try {
    const q = await Question.create({
      question,
      options,
      correctAnswer,
      category,
      difficulty
    });
    res.status(201).json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creando pregunta' });
  }
};
