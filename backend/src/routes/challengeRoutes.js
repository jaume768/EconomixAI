const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Validadores
const challengeValidator = [
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

// Rutas para gestión de retos globales
router.get('/', challengeController.getChallenges);
router.post('/', challengeValidator, challengeController.createChallenge);
router.get('/:id', challengeController.getChallengeById);
router.put('/:id', challengeValidator, challengeController.updateChallenge);
router.delete('/:id', challengeController.deleteChallenge);

module.exports = router;
