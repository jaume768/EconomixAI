const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Validadores para creación/actualización de logros
const achievementValidator = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('description')
    .isString()
    .isLength({ min: 10 })
    .withMessage('La descripción debe tener al menos 10 caracteres'),
  
  body('criteria')
    .custom(value => {
      try {
        const obj = typeof value === 'string' ? JSON.parse(value) : value;
        return obj && typeof obj === 'object';
      } catch (e) {
        return false;
      }
    })
    .withMessage('El criterio debe ser un objeto JSON válido')
];

// Rutas para gestión de logros (sólo lectura para usuarios normales)
router.get('/', achievementController.getAchievements);
router.get('/:id', achievementController.getAchievementById);

// Rutas para administradores
router.post('/', achievementValidator, achievementController.createAchievement);
router.put('/:id', achievementValidator, achievementController.updateAchievement);
router.delete('/:id', achievementController.deleteAchievement);

module.exports = router;
