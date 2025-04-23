// models/Game.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  code: String,
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  status: { type: String, default: 'waiting' },
  currentQuestionIndex: { type: Number, default: 0 }
});

module.exports = mongoose.model('Game', gameSchema);
