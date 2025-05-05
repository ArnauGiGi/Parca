// routes/questionRoutes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const admin   = require('../middleware/adminMiddleware');
const qc      = require('../controllers/questionController');

// POST /api/questions (admin only)
router.post('/', auth, admin, qc.createQuestion);

module.exports = router;
