const pool = require('../models/db');

// Listar todas las transacciones recurrentes del usuario
exports.getRecurringTransactions = async (req, res) => {
  const userId = req.user.id;
  const {
    kind,
    category_id,
    frequency,
    sort_by = 'next_date',
    sort_order = 'ASC'
  } = req.query;

  try {
    // Construir consulta base
    let query = `
      SELECT rt.*, c.name as category_name, d.creditor as debt_creditor
      FROM recurring_transactions rt
      LEFT JOIN categories c ON rt.category_id = c.id
      LEFT JOIN debts d ON rt.debt_id = d.id
      WHERE rt.user_id = ?
    `;

    const params = [userId];

    // Agregar filtros
    if (kind && ['expense', 'debt_payment'].includes(kind)) {
      query += ' AND rt.kind = ?';
      params.push(kind);
    }

    if (category_id) {
      query += ' AND rt.category_id = ?';
      params.push(category_id);
    }

    if (frequency && ['daily', 'weekly', 'monthly'].includes(frequency)) {
      query += ' AND rt.frequency = ?';
      params.push(frequency);
    }

    // Validar y agregar ordenamiento
    const validSortFields = ['name', 'amount', 'frequency', 'next_date', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    const sortField = validSortFields.includes(sort_by) ? sort_by : 'next_date';
    const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'ASC';

    query += ` ORDER BY rt.${sortField} ${sortOrder}`;

    // Ejecutar consulta
    const [transactions] = await pool.query(query, params);

    // Calcular totales por tipo y frecuencia
    const [totals] = await pool.query(
      `SELECT 
        SUM(amount) as total_amount,
        SUM(CASE WHEN kind = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN kind = 'debt_payment' THEN amount ELSE 0 END) as total_debt_payments,
        SUM(CASE WHEN frequency = 'monthly' THEN amount ELSE 0 END) as total_monthly
       FROM recurring_transactions
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      recurring_transactions: transactions,
      summary: {
        total_amount: parseFloat(totals[0].total_amount || 0),
        total_expenses: parseFloat(totals[0].total_expenses || 0),
        total_debt_payments: parseFloat(totals[0].total_debt_payments || 0),
        total_monthly: parseFloat(totals[0].total_monthly || 0)
      }
    });
  } catch (error) {
    console.error('Error al obtener transacciones recurrentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Crear una nueva transacción recurrente
exports.createRecurringTransaction = async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    amount,
    frequency,
    next_date,
    category_id,
    kind,
    debt_id
  } = req.body;

  // Validar campos requeridos
  if (!name || !amount || !frequency || !next_date) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos: name, amount, frequency, next_date'
    });
  }

  try {
    // Validar que la frecuencia sea válida
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'La frecuencia debe ser daily, weekly o monthly'
      });
    }

    // Validar que el tipo sea válido
    if (kind && !['expense', 'debt_payment'].includes(kind)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo debe ser expense o debt_payment'
      });
    }

    // Si es un pago de deuda, verificar que la deuda exista y pertenezca al usuario
    if (kind === 'debt_payment' && debt_id) {
      const [debtCheck] = await pool.query(
        'SELECT * FROM debts WHERE id = ? AND user_id = ?',
        [debt_id, userId]
      );

      if (debtCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Deuda no encontrada o no te pertenece'
        });
      }
    }

    // Si se proporciona una categoría, verificar que exista
    if (category_id) {
      const [categoryCheck] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categoryCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
    }

    // Crear la transacción recurrente
    const [result] = await pool.query(
      `INSERT INTO recurring_transactions (
        user_id, name, amount, frequency, next_date, 
        category_id, kind, debt_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        amount,
        frequency,
        next_date,
        category_id || null,
        kind || 'expense',
        debt_id || null
      ]
    );

    // Obtener detalles de la transacción recurrente creada
    const [newTransaction] = await pool.query(
      `SELECT rt.*, c.name as category_name, d.creditor as debt_creditor
       FROM recurring_transactions rt
       LEFT JOIN categories c ON rt.category_id = c.id
       LEFT JOIN debts d ON rt.debt_id = d.id
       WHERE rt.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Transacción recurrente creada con éxito',
      recurring_transaction: newTransaction[0]
    });
  } catch (error) {
    console.error('Error al crear transacción recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener detalles de una transacción recurrente específica
exports.getRecurringTransactionById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Obtener detalles de la transacción recurrente
    const [transactions] = await pool.query(
      `SELECT rt.*, c.name as category_name, d.creditor as debt_creditor
       FROM recurring_transactions rt
       LEFT JOIN categories c ON rt.category_id = c.id
       LEFT JOIN debts d ON rt.debt_id = d.id
       WHERE rt.id = ? AND rt.user_id = ?`,
      [id, userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción recurrente no encontrada o no tienes permiso para verla'
      });
    }

    res.json({
      success: true,
      recurring_transaction: transactions[0]
    });
  } catch (error) {
    console.error('Error al obtener transacción recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar una transacción recurrente
exports.updateRecurringTransaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    name,
    amount,
    frequency,
    next_date,
    category_id,
    kind,
    debt_id
  } = req.body;

  try {
    // Verificar que la transacción recurrente exista y pertenezca al usuario
    const [transactionCheck] = await pool.query(
      'SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (transactionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción recurrente no encontrada o no tienes permiso para modificarla'
      });
    }

    // Validaciones
    if (frequency && !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'La frecuencia debe ser daily, weekly o monthly'
      });
    }

    if (kind && !['expense', 'debt_payment'].includes(kind)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo debe ser expense o debt_payment'
      });
    }

    // Si es un pago de deuda, verificar que la deuda exista y pertenezca al usuario
    if (kind === 'debt_payment' && debt_id) {
      const [debtCheck] = await pool.query(
        'SELECT * FROM debts WHERE id = ? AND user_id = ?',
        [debt_id, userId]
      );

      if (debtCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Deuda no encontrada o no te pertenece'
        });
      }
    }

    // Si se proporciona una categoría, verificar que exista
    if (category_id) {
      const [categoryCheck] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categoryCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
    }

    // Construir consulta de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      queryParams.push(name);
    }

    if (amount !== undefined) {
      updateFields.push('amount = ?');
      queryParams.push(amount);
    }

    if (frequency !== undefined) {
      updateFields.push('frequency = ?');
      queryParams.push(frequency);
    }

    if (next_date !== undefined) {
      updateFields.push('next_date = ?');
      queryParams.push(next_date);
    }

    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      queryParams.push(category_id === null ? null : category_id);
    }

    if (kind !== undefined) {
      updateFields.push('kind = ?');
      queryParams.push(kind);
    }

    if (debt_id !== undefined) {
      updateFields.push('debt_id = ?');
      queryParams.push(debt_id === null ? null : debt_id);
    }

    // Si no hay nada que actualizar
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    // Ejecutar la actualización
    queryParams.push(id);
    await pool.query(
      `UPDATE recurring_transactions SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );

    // Obtener la transacción recurrente actualizada
    const [updatedTransaction] = await pool.query(
      `SELECT rt.*, c.name as category_name, d.creditor as debt_creditor
       FROM recurring_transactions rt
       LEFT JOIN categories c ON rt.category_id = c.id
       LEFT JOIN debts d ON rt.debt_id = d.id
       WHERE rt.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Transacción recurrente actualizada con éxito',
      recurring_transaction: updatedTransaction[0]
    });
  } catch (error) {
    console.error('Error al actualizar transacción recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar una transacción recurrente
exports.deleteRecurringTransaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que la transacción recurrente exista y pertenezca al usuario
    const [transactionCheck] = await pool.query(
      'SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (transactionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción recurrente no encontrada o no tienes permiso para eliminarla'
      });
    }

    // Eliminar la transacción recurrente
    await pool.query('DELETE FROM recurring_transactions WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Transacción recurrente eliminada con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar transacción recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener transacciones recurrentes de un usuario específico
exports.getUserRecurringTransactions = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;

  try {
    // Verificar permisos - solo el propio usuario puede ver sus transacciones recurrentes
    if (parseInt(userId) !== requesterId) {
      // Verificar si ambos usuarios pertenecen a la misma familia
      const [commonFamilies] = await pool.query(
        `SELECT fm1.family_id
         FROM family_members fm1
         JOIN family_members fm2 ON fm1.family_id = fm2.family_id
         WHERE fm1.user_id = ? AND fm2.user_id = ?`,
        [requesterId, userId]
      );

      // Solo se permite si son parte de la misma familia
      if (commonFamilies.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver las transacciones recurrentes de este usuario'
        });
      }
    }

    // Obtener transacciones recurrentes del usuario
    const [transactions] = await pool.query(
      `SELECT rt.*, c.name as category_name, d.creditor as debt_creditor
       FROM recurring_transactions rt
       LEFT JOIN categories c ON rt.category_id = c.id
       LEFT JOIN debts d ON rt.debt_id = d.id
       WHERE rt.user_id = ?
       ORDER BY rt.next_date ASC`,
      [userId]
    );

    // Calcular totales
    const [totals] = await pool.query(
      `SELECT 
        SUM(amount) as total_amount,
        SUM(CASE WHEN kind = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN kind = 'debt_payment' THEN amount ELSE 0 END) as total_debt_payments,
        SUM(CASE WHEN frequency = 'monthly' THEN amount ELSE 0 END) as total_monthly
       FROM recurring_transactions
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      recurring_transactions: transactions,
      summary: {
        total_amount: parseFloat(totals[0].total_amount || 0),
        total_expenses: parseFloat(totals[0].total_expenses || 0),
        total_debt_payments: parseFloat(totals[0].total_debt_payments || 0),
        total_monthly: parseFloat(totals[0].total_monthly || 0)
      }
    });
  } catch (error) {
    console.error('Error al obtener transacciones recurrentes del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
