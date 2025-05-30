const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const crypto = require('crypto');

// Importamos TODO el SDK en una sola variable
const Brevo = require('@getbrevo/brevo');
// 2) Desestructura solo lo que vayas a usar
const { TransactionalEmailsApi, SendSmtpEmail } = Brevo;

// Configuración del JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu_clave_refresh_muy_segura';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const apiInstance = new TransactionalEmailsApi();
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

// Generar tokens JWT
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

// Generar código de verificación de 6 dígitos
const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Enviar email con código de verificación
const sendVerificationEmail = async (email, code) => {
  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.subject = 'Verifica tu correo electrónico en EconomixAI';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; background: linear-gradient(135deg, #051923 0%, #003554 50%, #006494 100%); color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(to right, #0582CA, #00A6FB); border-radius: 50%; text-align: center; line-height: 60px; font-size: 24px; color: white; margin-bottom: 15px; box-shadow: 0 8px 20px rgba(0, 166, 251, 0.3);">
          <span>&#9993;</span>
        </div>
        <h1 style="color: #00A6FB; font-size: 28px; margin: 0;">EconomixAI</h1>
        <p style="color: rgba(255, 255, 255, 0.8); font-size: 16px; margin-top: 5px;">Verificación de correo electrónico</p>
      </div>
      
      <div style="background-color: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 8px; border: 1px solid rgba(0, 166, 251, 0.2); backdrop-filter: blur(10px);">
        <p style="font-size: 16px; line-height: 1.6;">Gracias por registrarte en EconomixAI. Para completar tu registro, introduce el siguiente código de verificación:</p>
        
        <div style="background: linear-gradient(to right, rgba(0, 100, 148, 0.3), rgba(0, 166, 251, 0.3)); padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #ffffff; border-radius: 8px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
          ${code}
        </div>
        
        <p style="font-size: 16px;">Este código expirará en <span style="color: #00A6FB; font-weight: bold;">30 minutos</span>.</p>
        <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">Si no has solicitado este código, puedes ignorar este mensaje.</p>
      </div>
      
      <div style="margin-top: 40px; text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 14px;">
        <p>© ${new Date().getFullYear()} EconomixAI - Tu asistente financiero inteligente</p>
      </div>
    </div>
  `;

  sendSmtpEmail.sender = { name: 'EconomixAI', email: 'contact.economixai@gmail.com' };
  sendSmtpEmail.to = [{ email }];

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, error };
  }
};
// Enviar código de verificación
exports.sendVerificationCode = async (req, res) => {
  const { email, resend = false } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'El correo electrónico es requerido'
    });
  }

  try {
    // Verificar si el email ya está registrado
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0 && !resend) {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado'
      });
    }

    // Generar código de verificación
    const verificationCode = generateVerificationCode();

    // Calcular la fecha de expiración (30 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Comprobar si ya existe un código para este email
    const [existingCodes] = await pool.query(
      'SELECT id FROM verification_codes WHERE email = ?',
      [email]
    );

    // Guardar el código en la base de datos (actualizar si ya existe)
    if (existingCodes.length > 0) {
      await pool.query(
        'UPDATE verification_codes SET code = ?, expires_at = ? WHERE email = ?',
        [verificationCode, expiresAt, email]
      );
    } else {
      await pool.query(
        'INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
        [email, verificationCode, expiresAt]
      );
    }

    // Enviar el código por email
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el email de verificación'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Código de verificación enviado',
      expiresAt
    });
  } catch (error) {
    console.error('Error enviando código de verificación:', error);
    res.status(500).json({
      success: false,
      message: `Error en el servidor: ${error.message}`
    });
  }
};

// Verificar código
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: 'Email y código son requeridos'
    });
  }

  try {
    // Buscar el código en la base de datos
    const [codes] = await pool.query(
      'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > NOW()',
      [email, code]
    );

    if (codes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // El código es válido
    res.status(200).json({
      success: true,
      message: 'Código verificado correctamente'
    });
  } catch (error) {
    console.error('Error verificando código:', error);
    res.status(500).json({
      success: false,
      message: `Error en el servidor: ${error.message}`
    });
  }
};

// Registrar un nuevo usuario
exports.register = async (req, res) => {
  const {
    username,
    email,
    password,
    first_name,
    last_name,
    second_last_name = null,
    role = 'normal',
    plan = 'individual',
    initial_balance = '0'
  } = req.body;

  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son requeridos'
    });
  }

  // Verificar que el email haya sido validado
  const [verifiedCodes] = await pool.query(
    'SELECT * FROM verification_codes WHERE email = ? AND expires_at > NOW()',
    [email]
  );

  if (verifiedCodes.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'El correo electrónico no ha sido verificado'
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
      'INSERT INTO users (username, email, password_hash, first_name, last_name, second_last_name) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, first_name, last_name, second_last_name]
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

    // 6. Crear cuenta bancaria por defecto con el saldo inicial
    const [accountResult] = await connection.query(
      'INSERT INTO accounts (user_id, name, account_type, currency) VALUES (?, ?, ?, ?)',
      [userId, 'Cuenta Principal', 'corriente', 'EUR']
    );

    // 7. Registrar saldo inicial como transacción
    // Siempre crear la transacción de saldo inicial, incluso si es 0
    const accountId = accountResult.insertId;
    const initialBalanceValue = parseFloat(initial_balance) || 0;

    if (initialBalanceValue > 0) {
      await connection.query(
        'INSERT INTO transactions (user_id, account_id, amount, type, description, transaction_date) VALUES (?, ?, ?, ?, ?, NOW())',
        [userId, accountId, initialBalanceValue, 'income', 'Saldo inicial', new Date()]
      );
    }

    // 8. Eliminar el código de verificación (ya utilizado)
    await connection.query(
      'DELETE FROM verification_codes WHERE email = ?',
      [email]
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
        last_name,
        second_last_name,
        plan
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

// Obtener perfil del usuario autenticado
exports.profile = async (req, res) => {
  try {
    // La autenticación ya ha sido verificada por el middleware
    const userId = req.user.id;

    // Obtener los datos del usuario
    const [users] = await pool.query(
      'SELECT id, username, email, first_name, last_name FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = users[0];

    // Obtener roles del usuario
    const [roles] = await pool.query(
      `SELECT r.name FROM roles r 
       JOIN user_roles ur ON r.id = ur.role_id 
       WHERE ur.user_id = ?`,
      [userId]
    );

    // Obtener planes del usuario
    const [plans] = await pool.query(
      `SELECT p.name FROM plans p 
       JOIN user_plans up ON p.id = up.plan_id 
       WHERE up.user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      user: {
        ...user,
        roles: roles.map(role => role.name),
        plans: plans.map(plan => plan.name)
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
