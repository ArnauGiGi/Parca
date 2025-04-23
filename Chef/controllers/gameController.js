// controllers/gameController.js
const Game = require('../models/Game');
const Question = require('../models/Question');
const mongoose = require('mongoose');

exports.createGame = async (req, res) => {
  try {
    const hostId = req.user.id;

    // 1) Generar código de 6 dígitos alfanuméricos
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();

    // 2) Seleccionar N preguntas al azar (por ejemplo 10)
    const total = await Question.countDocuments();
    const count = Math.min(10, total);
    const randomSkip = Array.from({ length: count }, () => Math.floor(Math.random() * total));
    const questions = await Promise.all(
      randomSkip.map(skip =>
        Question.findOne().skip(skip)
      )
    );

    // 3) Crear partida
    const game = new Game({
      code,
      host: mongoose.Types.ObjectId(hostId),
      players: [hostId],
      questions: questions.map(q => q._id)
    });
    await game.save();

    res.status(201).json({ gameId: game._id, code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear la partida' });
  }
};

exports.joinGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.params;

    const game = await Game.findOne({ code });
    if (!game) return res.status(404).json({ message: 'Partida no encontrada' });
    if (game.players.includes(userId))
      return res.status(400).json({ message: 'Ya estás en la partida' });

    game.players.push(userId);
    await game.save();

    res.json({ gameId: game._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al unirse a la partida' });
  }
};

exports.getGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId)
      .populate('host', 'username')
      .populate('players', 'username')
      .populate('questions');
    if (!game) return res.status(404).json({ message: 'Partida no encontrada' });

    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener la partida' });
  }
};
