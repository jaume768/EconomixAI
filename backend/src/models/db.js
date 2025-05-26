const mysql = require('mysql2/promise');
const dbConfig = require('../../config/database');

// Determinar el entorno actual
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Crear el pool de conexiones
const pool = mysql.createPool({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
  port: config.port,
  waitForConnections: config.waitForConnections,
  connectionLimit: config.connectionLimit,
  queueLimit: config.queueLimit
});

module.exports = pool;
