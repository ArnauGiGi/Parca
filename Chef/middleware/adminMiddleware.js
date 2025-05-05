// middleware/adminMiddleware.js
module.exports = (req, res, next) => {
    // req.user viene de authMiddleware (que valida el JWT)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado: administrador requerido' });
    }
    next();
  };
  