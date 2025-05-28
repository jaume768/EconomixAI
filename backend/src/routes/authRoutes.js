const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const passport = require('passport');

// Validadores para el registro
const registerValidators = [
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email no válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('first_name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre es requerido'),
  body('last_name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El apellido es requerido'),
];

// Validadores para el login
const loginValidators = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email no válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

// Validadores para refresh token
const refreshTokenValidators = [
  body('refresh_token')
    .isString()
    .notEmpty()
    .withMessage('Refresh token es requerido'),
];

// Middleware de autenticación
const { authenticateJWT } = require('../middleware/authMiddleware');

// Validadores para el código de verificación
const verificationCodeValidators = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email no válido'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('El código debe tener 6 dígitos')
];

// Rutas de autenticación
router.post('/send-verification-code', authController.sendVerificationCode);
router.post('/verify-code', verificationCodeValidators, authController.verifyCode);
router.post('/register', registerValidators, authController.register);
router.post('/login', loginValidators, authController.login);
router.post('/google', passport.authenticate('google-token', { session: false }), authController.googleAuth);
router.post('/refresh-token', refreshTokenValidators, authController.refreshToken);
router.get('/profile', authenticateJWT, authController.profile);

module.exports = router;
