const express = require('express');
const router = express.Router();
const recurringTransactionController = require('../controllers/recurringTransactionController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Validadores
const recurringTransactionValidator = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser un número positivo'),
  
  body('frequency')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('La frecuencia debe ser daily, weekly o monthly'),
  
  body('next_date')
    .isISO8601()
    .withMessage('La fecha debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  body('category_id')
    .optional({ nullable: true })
    .isInt()
    .withMessage('ID de categoría debe ser un número entero'),
  
  body('kind')
    .optional()
    .isIn(['expense', 'debt_payment'])
    .withMessage('El tipo debe ser expense o debt_payment'),
  
  body('debt_id')
    .optional({ nullable: true })
    .isInt()
    .withMessage('ID de deuda debe ser un número entero')
];

// Rutas para gestión de transacciones recurrentes
router.get('/', recurringTransactionController.getRecurringTransactions);
router.post('/', recurringTransactionValidator, recurringTransactionController.createRecurringTransaction);
router.get('/:id', recurringTransactionController.getRecurringTransactionById);
router.put('/:id', recurringTransactionValidator, recurringTransactionController.updateRecurringTransaction);
router.delete('/:id', recurringTransactionController.deleteRecurringTransaction);

module.exports = router;
