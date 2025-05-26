const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Validadores
const transactionValidator = [
  body('account_id')
    .isInt()
    .withMessage('ID de cuenta debe ser un número entero'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser un número positivo'),
  
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('El tipo debe ser "income" o "expense"'),
  
  body('category_id')
    .optional({ nullable: true })
    .isInt()
    .withMessage('ID de categoría debe ser un número entero'),
  
  body('description')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 255 })
    .withMessage('La descripción no puede exceder los 255 caracteres'),
  
  body('transaction_date')
    .isISO8601()
    .withMessage('La fecha debe tener formato ISO8601 (YYYY-MM-DD)')
];

// Rutas para gestión de transacciones
router.get('/', transactionController.getTransactions);
router.post('/', transactionValidator, transactionController.createTransaction);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionValidator, transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

// Estas rutas serán registradas en userRoutes.js ya que son específicas de usuario
// Las dejamos como comentario para referencia
// /api/users/:userId/transactions/recent
// /api/users/:userId/transactions/summary

module.exports = router;
