const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createGame,
  joinGame,
  getGame
} = require('../controllers/gameController');

router.post('/create', auth, createGame);
router.post('/join/:code', auth, joinGame);
router.get('/:gameId', auth, getGame);

module.exports = router;
