const express = require('express');
const router = express.Router();
const tinkController = require('../controllers/tinkController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Ruta para obtener un enlace de autorización de Tink
router.get('/authorize', authenticateJWT, tinkController.getAuthorizationLink);

// Ruta para manejar el callback después de la conexión con el banco
router.get('/callback', authenticateJWT, tinkController.handleCallback);

// Ruta para obtener las conexiones del usuario
router.get('/connections', authenticateJWT, tinkController.getConnections);

// Ruta para eliminar una conexión
router.delete('/connections/:id', authenticateJWT, tinkController.deleteConnection);

// Ruta para sincronizar una conexión
router.post('/connections/:id/sync', authenticateJWT, tinkController.syncConnection);

module.exports = router;
