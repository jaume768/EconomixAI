const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Validadores
const accountValidator = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('account_type')
    .isIn(['ahorro', 'corriente', 'inversión'])
    .withMessage('El tipo de cuenta debe ser ahorro, corriente o inversión'),
  
  body('currency')
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('La moneda debe ser un código de 3 letras (ej: EUR, USD)'),
  
  body('family_id')
    .optional()
    .isInt()
    .withMessage('ID de familia debe ser un número entero')
];

// Rutas para gestión de cuentas
router.get('/', accountController.getAccounts);
router.post('/', accountValidator, accountController.createAccount);
router.get('/:accountId', accountController.getAccountById);
router.put('/:accountId', accountValidator, accountController.updateAccount);
router.delete('/:accountId', accountController.deleteAccount);

module.exports = router;
