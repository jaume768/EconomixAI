const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const pool = require('../models/db');
const bcrypt = require('bcryptjs');

// Configuración del JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';

// Opciones para la estrategia JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

// Estrategia JWT
passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    // Buscar usuario por ID
    const [users] = await pool.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [payload.userId]
    );
    
    if (users.length === 0) {
      return done(null, false);
    }
    
    return done(null, users[0]);
  } catch (error) {
    return done(error, false);
  }
}));

// Estrategia Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar si ya existe el usuario con este Google ID
    const [existingUsers] = await pool.query(
      'SELECT u.* FROM users u JOIN oauth_accounts o ON u.id = o.user_id WHERE o.provider = ? AND o.provider_user_id = ?',
      ['google', profile.id]
    );
    
    if (existingUsers.length > 0) {
      // Usuario ya existente
      return done(null, existingUsers[0]);
    }
    
    // Iniciar transacción para crear nuevo usuario
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Verificar si existe un usuario con el mismo email
      const [emailUsers] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [profile.emails[0].value]
      );
      
      let userId;
      
      if (emailUsers.length > 0) {
        // Existe un usuario con el mismo email, vinculamos la cuenta
        userId = emailUsers[0].id;
      } else {
        // Crear nuevo usuario
        const [userResult] = await connection.query(
          'INSERT INTO users (username, email, first_name, last_name) VALUES (?, ?, ?, ?)',
          [
            `user_${profile.id.substring(0, 8)}`,
            profile.emails[0].value,
            profile.name.givenName || '',
            profile.name.familyName || ''
          ]
        );
        
        userId = userResult.insertId;
        
        // Asignar rol de usuario normal
        const [roleRows] = await connection.query('SELECT id FROM roles WHERE name = ?', ['normal']);
        
        if (roleRows.length === 0) {
          throw new Error('Rol "normal" no encontrado');
        }
        
        await connection.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleRows[0].id]
        );
        
        // Asignar plan individual
        const [planRows] = await connection.query('SELECT id FROM plans WHERE name = ?', ['individual']);
        
        if (planRows.length === 0) {
          throw new Error('Plan "individual" no encontrado');
        }
        
        await connection.query(
          'INSERT INTO user_plans (user_id, plan_id) VALUES (?, ?)',
          [userId, planRows[0].id]
        );
        
        // Crear cuenta bancaria por defecto
        await connection.query(
          'INSERT INTO accounts (user_id, name, account_type, currency) VALUES (?, ?, ?, ?)',
          [userId, 'Cuenta Principal', 'corriente', 'EUR']
        );
      }
      
      // Guardar datos de OAuth
      await connection.query(
        'INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, refresh_token) VALUES (?, ?, ?, ?, ?)',
        [userId, 'google', profile.id, accessToken, refreshToken || null]
      );
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener usuario completo
      const [users] = await pool.query(
        'SELECT id, username, email, first_name, last_name FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return done(null, false);
      }
      
      return done(null, users[0]);
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      return done(error, false);
    } finally {
      // Liberar la conexión
      connection.release();
    }
  } catch (error) {
    return done(error, false);
  }
}));

module.exports = passport;
