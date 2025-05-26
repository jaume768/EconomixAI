const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Validadores
const categoryValidator = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('parent_id')
    .optional()
    .isInt()
    .withMessage('ID de categoría padre debe ser un número entero')
];

// Rutas para gestión de categorías
router.get('/', categoryController.getCategories);
router.post('/', categoryValidator, categoryController.createCategory);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', categoryValidator, categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
