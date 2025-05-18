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

exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener preguntas' });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pregunta eliminada con éxito' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar pregunta' });
  }
};