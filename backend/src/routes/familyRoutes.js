const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Validadores
const createFamilyValidator = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
];

const addMemberValidator = [
  body('userId')
    .optional()
    .isInt()
    .withMessage('ID de usuario debe ser un número entero'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email no válido')
];

// Rutas para gestión de familias
router.post('/', createFamilyValidator, familyController.createFamily);
router.get('/:familyId', familyController.getFamilyById);
router.put('/:familyId', createFamilyValidator, familyController.updateFamily);
router.delete('/:familyId', familyController.deleteFamily);

// Rutas para gestión de miembros
router.get('/:familyId/members', familyController.getFamilyMembers);
router.post('/:familyId/members', addMemberValidator, familyController.addFamilyMember);
router.delete('/:familyId/members/:userId', familyController.removeFamilyMember);

module.exports = router;
