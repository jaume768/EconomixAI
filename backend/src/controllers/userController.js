// Controlador para operaciones relacionadas con usuarios
const mysql = require('mysql2/promise');
const pool = require('../models/db');

// Obtener todos los usuarios con sus roles y planes
exports.getAllUsers = async (req, res) => {
  try {
    // Consulta principal de usuarios
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at 
       FROM users u`
    );

    // Para cada usuario, obtenemos sus roles y planes
    for (const user of users) {
      // Obtener roles
      const [roles] = await pool.query(
        `SELECT r.name FROM roles r 
         JOIN user_roles ur ON r.id = ur.role_id 
         WHERE ur.user_id = ?`,
        [user.id]
      );
      user.roles = roles.map(role => role.name);

      // Obtener planes
      const [plans] = await pool.query(
        `SELECT p.name, p.description FROM plans p 
         JOIN user_plans up ON p.id = up.plan_id 
         WHERE up.user_id = ?`,
        [user.id]
      );
      user.plans = plans.map(plan => plan.name);

      // Obtener cuentas
      const [accounts] = await pool.query(
        `SELECT id, name, bank_name, account_type, currency 
         FROM accounts 
         WHERE user_id = ?`,
        [user.id]
      );
      user.accounts = accounts;
    }

    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener un usuario por ID con toda su información
exports.getUserById = async (req, res) => {
  try {
    // Consulta principal del usuario
    const [rows] = await pool.query(
      `SELECT id, username, email, first_name, last_name, created_at 
       FROM users 
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = rows[0];

    // Obtener roles
    const [roles] = await pool.query(
      `SELECT r.name FROM roles r 
       JOIN user_roles ur ON r.id = ur.role_id 
       WHERE ur.user_id = ?`,
      [user.id]
    );
    user.roles = roles.map(role => role.name);

    // Obtener planes
    const [plans] = await pool.query(
      `SELECT p.name, p.description FROM plans p 
       JOIN user_plans up ON p.id = up.plan_id 
       WHERE up.user_id = ?`,
      [user.id]
    );
    user.plans = plans.map(plan => plan.name);

    // Obtener cuentas
    const [accounts] = await pool.query(
      `SELECT id, name, bank_name, account_type, currency 
       FROM accounts 
       WHERE user_id = ?`,
      [user.id]
    );
    user.accounts = accounts;

    // Obtener transacciones recientes
    const [transactions] = await pool.query(
      `SELECT t.id, t.amount, t.type, c.name as category, 
              t.description, t.transaction_date 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC
       LIMIT 10`,
      [user.id]
    );
    user.recent_transactions = transactions;

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear un nuevo usuario
exports.createUser = async (req, res) => {
  const { username, email, password, first_name, last_name, role = 'normal', plan = 'individual' } = req.body;

  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({ message: 'Datos incompletos' });
  }

  // Iniciar transacción para garantizar consistencia
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Insertar usuario
    const [userResult] = await connection.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [username, email, password, first_name, last_name]
    );

    const userId = userResult.insertId;

    // 2. Obtener el ID del rol
    const [roleRows] = await connection.query(
      'SELECT id FROM roles WHERE name = ?',
      [role]
    );

    if (roleRows.length === 0) {
      throw new Error(`Rol "${role}" no encontrado`);
    }

    // 3. Asignar rol al usuario
    await connection.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, roleRows[0].id]
    );

    // 4. Obtener el ID del plan
    const [planRows] = await connection.query(
      'SELECT id FROM plans WHERE name = ?',
      [plan]
    );

    if (planRows.length === 0) {
      throw new Error(`Plan "${plan}" no encontrado`);
    }

    // 5. Asignar plan al usuario
    await connection.query(
      'INSERT INTO user_plans (user_id, plan_id) VALUES (?, ?)',
      [userId, planRows[0].id]
    );

    // 6. Crear cuenta bancaria por defecto
    await connection.query(
      'INSERT INTO accounts (user_id, name, account_type, currency) VALUES (?, ?, ?, ?)',
      [userId, 'Cuenta Principal', 'corriente', 'EUR']
    );

    // Confirmar transacción
    await connection.commit();

    res.status(201).json({
      id: userId,
      message: 'Usuario creado con éxito'
    });
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error('Error al crear usuario:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El nombre de usuario o email ya existe' });
    }

    res.status(500).json({ message: `Error interno del servidor: ${error.message}` });
  } finally {
    // Liberar la conexión
    connection.release();
  }
};

// Obtener transacciones de un usuario
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.params.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Verificar que el usuario existe
    const [userExists] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener transacciones
    const [transactions] = await pool.query(
      `SELECT t.id, t.amount, t.type, c.name as category, 
              t.description, t.transaction_date, a.name as account_name 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Obtener total de transacciones para paginación
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
      [userId]
    );

    res.json({
      transactions,
      pagination: {
        total: countResult[0].total,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener resumen financiero del usuario
exports.getUserFinancialSummary = async (req, res) => {
  try {
    const userId = req.params.id;

    // Verificar que el usuario existe
    const [userExists] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener saldo total de todas las cuentas
    const [accountsBalance] = await pool.query(
      `SELECT a.id, a.name, a.currency,
              (SELECT SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)
               FROM transactions t 
               WHERE t.account_id = a.id) as balance
       FROM accounts a
       WHERE a.user_id = ?`,
      [userId]
    );

    // Obtener ingresos y gastos del mes actual
    const currentMonth = new Date().toISOString().slice(0, 7); // formato YYYY-MM

    const [monthlyStats] = await pool.query(
      `SELECT 
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses
       FROM transactions t
       WHERE t.user_id = ? AND t.transaction_date LIKE ?`,
      [userId, `${currentMonth}%`]
    );

    // Obtener gastos por categoría del mes actual
    const [expensesByCategory] = await pool.query(
      `SELECT c.name as category, SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.transaction_date LIKE ?
       GROUP BY t.category_id
       ORDER BY total DESC`,
      [userId, `${currentMonth}%`]
    );

    res.json({
      accounts: accountsBalance,
      monthly_summary: {
        month: currentMonth,
        income: monthlyStats[0].total_income || 0,
        expenses: monthlyStats[0].total_expenses || 0,
        balance: (monthlyStats[0].total_income || 0) - (monthlyStats[0].total_expenses || 0)
      },
      expenses_by_category: expensesByCategory
    });
  } catch (error) {
    console.error('Error al obtener resumen financiero:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

