const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const accountController = require('../controllers/accountController');
const transactionController = require('../controllers/transactionController');
const debtController = require('../controllers/debtController');
const recurringTransactionController = require('../controllers/recurringTransactionController');
const goalController = require('../controllers/goalController');
const challengeController = require('../controllers/challengeController');
const achievementController = require('../controllers/achievementController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Middleware de autenticación para rutas protegidas
router.use('/:id/accounts', authenticateJWT);
router.use('/:id/transactions', authenticateJWT);
router.use('/:id/debts', authenticateJWT);
router.use('/:id/recurring-transactions', authenticateJWT);
router.use('/:id/goals', authenticateJWT);
router.use('/:id/challenges', authenticateJWT);
router.use('/:id/achievements', authenticateJWT);
router.use('/:id/summary', authenticateJWT);

// Rutas para usuarios
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);

// Rutas para cuentas de usuario
router.get('/:userId/accounts', accountController.getUserAccounts);

// Rutas para transacciones de usuario
router.get('/:userId/transactions', userController.getUserTransactions);
router.get('/:userId/transactions/recent', transactionController.getUserRecentTransactions);
router.get('/:userId/transactions/summary', transactionController.getUserTransactionsSummary);

// Ruta para obtener deudas de un usuario
router.get('/:userId/debts', debtController.getUserDebts);

// Ruta para obtener transacciones recurrentes de un usuario
router.get('/:userId/recurring-transactions', recurringTransactionController.getUserRecurringTransactions);

// Rutas para metas de usuario
router.get('/:userId/goals', goalController.getUserGoals);
router.post('/:userId/goals', goalController.createUserGoal);
router.put('/:userId/goals/:id', goalController.updateUserGoal);
router.delete('/:userId/goals/:id', goalController.deleteUserGoal);

// Rutas para retos de usuario
router.get('/:userId/challenges', challengeController.getUserChallenges);
router.post('/:userId/challenges', challengeController.joinChallenge);
router.put('/:userId/challenges/:challengeId', challengeController.updateUserChallenge);
router.delete('/:userId/challenges/:challengeId', challengeController.leaveChallenge);

// Rutas para logros de usuario
router.get('/:userId/achievements', achievementController.getUserAchievements);
router.put('/:userId/achievements/:achievementId', achievementController.updateUserAchievement);

// Ruta para resumen financiero
router.get('/:userId/summary', userController.getUserFinancialSummary);



module.exports = router;
