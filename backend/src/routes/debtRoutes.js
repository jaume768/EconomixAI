const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Validadores
const debtValidator = [
  body('creditor')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del acreedor debe tener entre 2 y 100 caracteres'),
  
  body('original_amount')
    .isFloat({ min: 0.01 })
    .withMessage('El monto original debe ser un número positivo'),
  
  body('current_balance')
    .isFloat({ min: 0 })
    .withMessage('El saldo actual debe ser un número positivo o cero'),
  
  body('interest_rate')
    .isFloat({ min: 0 })
    .withMessage('La tasa de interés debe ser un número positivo o cero'),
  
  body('installment_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('El monto de la cuota debe ser un número positivo o cero'),
  
  body('installment_period')
    .optional()
    .isIn(['monthly', 'quarterly', 'yearly'])
    .withMessage('El período de pago debe ser monthly, quarterly o yearly'),
  
  body('start_date')
    .isISO8601()
    .withMessage('La fecha de inicio debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  body('end_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('La fecha de fin debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  body('status')
    .optional()
    .isIn(['active', 'paid_off', 'defaulted'])
    .withMessage('El estado debe ser active, paid_off o defaulted')
];

// Rutas para gestión de deudas
router.get('/', debtController.getDebts);
router.post('/', debtValidator, debtController.createDebt);
router.get('/:id', debtController.getDebtById);
router.put('/:id', debtValidator, debtController.updateDebt);
router.delete('/:id', debtController.deleteDebt);

module.exports = router;
