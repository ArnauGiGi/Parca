// routes/questionRoutes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const admin   = require('../middleware/adminMiddleware');
const qc      = require('../controllers/questionController');

// POST /api/questions (admin only)
router.post('/', auth, admin, qc.createQuestion);
router.get('/', auth, admin, qc.getQuestions);
router.delete('/:id', auth, admin, qc.deleteQuestion);

module.exports = router;
