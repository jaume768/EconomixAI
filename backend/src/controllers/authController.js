const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');

// Configuración del JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu_clave_refresh_muy_segura';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Generar tokens JWT (acceso y refresh)
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

// Registrar un nuevo usuario
exports.register = async (req, res) => {
  const { username, email, password, first_name, last_name, role = 'normal', plan = 'individual' } = req.body;
  
  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({ 
      success: false,
      message: 'Todos los campos son requeridos'
    });
  }
  
  // Iniciar transacción para garantizar consistencia
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El email o nombre de usuario ya está registrado'
      });
    }
    
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 1. Insertar usuario
    const [userResult] = await connection.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, first_name, last_name]
    );
    
    const userId = userResult.insertId;
    
    // 2. Obtener el ID del rol
    const [roleRows] = await connection.query(
      'SELECT id FROM roles WHERE name = ?',
      [role]
    );
    
    if (roleRows.length === 0) {
      throw new Error(`Rol "${role}" no encontrado`);
    }
    
    // 3. Asignar rol al usuario
    await connection.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, roleRows[0].id]
    );
    
    // 4. Obtener el ID del plan
    const [planRows] = await connection.query(
      'SELECT id FROM plans WHERE name = ?',
      [plan]
    );
    
    if (planRows.length === 0) {
      throw new Error(`Plan "${plan}" no encontrado`);
    }
    
    // 5. Asignar plan al usuario
    await connection.query(
      'INSERT INTO user_plans (user_id, plan_id) VALUES (?, ?)',
      [userId, planRows[0].id]
    );
    
    // 6. Crear cuenta bancaria por defecto
    await connection.query(
      'INSERT INTO accounts (user_id, name, account_type, currency) VALUES (?, ?, ?, ?)',
      [userId, 'Cuenta Principal', 'corriente', 'EUR']
    );
    
    // Generar tokens JWT
    const { accessToken, refreshToken } = generateTokens(userId);
    
    // Guardar refresh token en la base de datos (podrías crear una tabla para esto)
    
    // Confirmar transacción
    await connection.commit();
    
    // Evitar devolver la contraseña en la respuesta
    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      user: {
        id: userId,
        username,
        email,
        first_name,
        last_name
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error('Error al registrar usuario:', error);
    
    res.status(500).json({
      success: false,
      message: `Error en el servidor: ${error.message}`
    });
  } finally {
    // Liberar la conexión
    connection.release();
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son requeridos'
    });
  }
  
  try {
    // Buscar usuario por email
    const [users] = await pool.query(
      'SELECT id, username, email, password_hash, first_name, last_name FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    const user = users[0];
    
    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generar tokens JWT
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Guardar refresh token en la base de datos (podrías crear una tabla para esto)
    
    // Obtener roles del usuario
    const [roles] = await pool.query(
      `SELECT r.name FROM roles r 
       JOIN user_roles ur ON r.id = ur.role_id 
       WHERE ur.user_id = ?`,
      [user.id]
    );
    
    // Obtener planes del usuario
    const [plans] = await pool.query(
      `SELECT p.name FROM plans p 
       JOIN user_plans up ON p.id = up.plan_id 
       WHERE up.user_id = ?`,
      [user.id]
    );
    
    // Evitar devolver la contraseña en la respuesta
    delete user.password_hash;
    
    res.json({
      success: true,
      user: {
        ...user,
        roles: roles.map(role => role.name),
        plans: plans.map(plan => plan.name)
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Autenticación con Google
exports.googleAuth = async (req, res) => {
  try {
    // El objeto del usuario ya estará disponible en req.user gracias a Passport.js
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Error en autenticación con Google'
      });
    }
    
    const user = req.user;
    
    // Generar tokens JWT
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    res.json({
      success: true,
      user,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    console.error('Error en autenticación con Google:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Refrescar token
exports.refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token es requerido'
    });
  }
  
  try {
    // Verificar refresh token
    const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET);
    
    // Verificar que el usuario exista en la base de datos
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Generar nuevos tokens
    const { accessToken, refreshToken } = generateTokens(decoded.userId);
    
    res.json({
      success: true,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    console.error('Error al refrescar token:', error);
    
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
