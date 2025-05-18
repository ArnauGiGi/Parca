const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const { getUsers, updateUserRole } = require('../controllers/userController');

// Rutas protegidas solo para admin
router.get('/', auth, admin, getUsers);
router.patch('/:userId/role', auth, admin, updateUserRole);

module.exports = router;