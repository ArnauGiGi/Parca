const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const { login, register } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, (req, res) => {
    res.clearCookie('token', { path: '/' })
       .status(200)
       .json({ message: 'Logout exitoso' });
  });
router.get('/me', auth, (req, res) => {
    res.json({ user: req.user });
  });

module.exports = router;
