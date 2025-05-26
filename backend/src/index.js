require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const passport = require('passport');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');
const accountRoutes = require('./routes/accountRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const debtRoutes = require('./routes/debtRoutes');
const recurringTransactionRoutes = require('./routes/recurringTransactionRoutes');
const goalRoutes = require('./routes/goalRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Passport
require('./config/passport');
app.use(passport.initialize());

// Configuración de variables de entorno JWT
if (!process.env.JWT_SECRET) {
  console.warn('ADVERTENCIA: JWT_SECRET no está configurado en el archivo .env. Usando valor por defecto.');
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.warn('ADVERTENCIA: JWT_REFRESH_SECRET no está configurado en el archivo .env. Usando valor por defecto.');
}

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
    return false;
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/recurring-transactions', recurringTransactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/achievements', achievementRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a EconomixAI - API del Asesor Financiero Personal',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testDbConnection();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing HTTP server and DB pool');
  pool.end();
  process.exit(0);
});

module.exports = app;
