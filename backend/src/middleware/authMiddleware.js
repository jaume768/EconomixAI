const jwt = require('jsonwebtoken');
const pool = require('../models/db');

// Configuración del JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';

// Middleware para verificar el token JWT
exports.authenticateJWT = (req, res, next) => {
  // Obtener el token del header de autorización
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de acceso'
    });
  }
  
  // El formato típico es "Bearer [token]"
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Formato de token inválido'
    });
  }
  
  try {
    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    console.error('Error al verificar token JWT:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Middleware para verificar roles de usuario
exports.authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      // Obtener los roles del usuario
      const [userRoles] = await pool.query(
        `SELECT r.name FROM roles r 
         JOIN user_roles ur ON r.id = ur.role_id 
         WHERE ur.user_id = ?`,
        [req.user.id]
      );
      
      const userRoleNames = userRoles.map(role => role.name);
      
      // Verificar si el usuario tiene al menos uno de los roles requeridos
      const hasRole = roles.some(role => userRoleNames.includes(role));
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a este recurso'
        });
      }
      
      next();
    } catch (error) {
      console.error('Error al verificar roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  };
};
