const express = require('express');
const router = express.Router({ mergeParams: true });
const goalController = require('../controllers/goalController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Validadores
const goalValidator = [
  body('goal_type')
    .isIn(['ahorro', 'compra', 'viaje', 'jubilacion'])
    .withMessage('El tipo debe ser ahorro, compra, viaje o jubilacion'),
  
  body('target_amount')
    .isFloat({ min: 0.01 })
    .withMessage('El monto objetivo debe ser un número positivo'),
  
  body('target_date')
    .isISO8601()
    .withMessage('La fecha objetivo debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  body('description')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 255 })
    .withMessage('La descripción no puede exceder los 255 caracteres')
];

// Rutas para gestión de metas
router.get('/', goalController.getUserGoals);
router.post('/', goalValidator, goalController.createUserGoal);
router.put('/:id', goalValidator, goalController.updateUserGoal);
router.delete('/:id', goalController.deleteUserGoal);

module.exports = router;
