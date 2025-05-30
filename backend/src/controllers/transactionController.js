const pool = require('../models/db');

// Listar todas las transacciones con filtros
exports.getTransactions = async (req, res) => {
  const userId = req.user.id;
  const {
    startDate,
    endDate,
    type,
    category_id,
    account_id,
    min_amount,
    max_amount,
    limit = 50,
    offset = 0,
    sort_by = 'transaction_date',
    sort_order = 'DESC'
  } = req.query;
  
  try {
    // Construir consulta base
    let query = `
      SELECT t.id, t.user_id, t.account_id, t.amount, t.type, 
             t.category_id, t.description, t.transaction_date, 
             t.created_at, t.updated_at,
             a.name as account_name, c.name as category_name
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      WHERE t.user_id = ?
    `;
    
    // Parámetros para la consulta
    let params = [userId];
    let countParams = [userId];
    
    // Agregar filtros
    if (startDate) {
      query += ' AND t.transaction_date >= ?';
      countQuery += ' AND t.transaction_date >= ?';
      params.push(startDate);
      countParams.push(startDate);
    }
    
    if (endDate) {
      query += ' AND t.transaction_date <= ?';
      countQuery += ' AND t.transaction_date <= ?';
      params.push(endDate);
      countParams.push(endDate);
    }
    
    if (type && ['income', 'expense'].includes(type)) {
      query += ' AND t.type = ?';
      countQuery += ' AND t.type = ?';
      params.push(type);
      countParams.push(type);
    }
    
    if (category_id) {
      query += ' AND t.category_id = ?';
      countQuery += ' AND t.category_id = ?';
      params.push(category_id);
      countParams.push(category_id);
    }
    
    if (account_id) {
      query += ' AND t.account_id = ?';
      countQuery += ' AND t.account_id = ?';
      params.push(account_id);
      countParams.push(account_id);
    }
    
    if (min_amount) {
      query += ' AND t.amount >= ?';
      countQuery += ' AND t.amount >= ?';
      params.push(min_amount);
      countParams.push(min_amount);
    }
    
    if (max_amount) {
      query += ' AND t.amount <= ?';
      countQuery += ' AND t.amount <= ?';
      params.push(max_amount);
      countParams.push(max_amount);
    }
    
    // Validar y agregar ordenamiento
    const validSortFields = ['transaction_date', 'amount', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'transaction_date';
    const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY t.${sortField} ${sortOrder}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // Ejecutar consulta para obtener transacciones
    const [transactions] = await pool.query(query, params);
    
    // Ejecutar consulta para obtener el total
    const [countResult] = await pool.query(countQuery, countParams);
    
    res.json({
      success: true,
      transactions,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Crear una nueva transacción
exports.createTransaction = async (req, res) => {
  const userId = req.user.id;
  const {
    account_id,
    amount,
    type,
    category_id,
    description,
    transaction_date
  } = req.body;
  
  // Validaciones básicas
  if (!account_id || !amount || !type || !transaction_date) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos: account_id, amount, type, transaction_date'
    });
  }
  
  // Validar el tipo de transacción
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'El tipo debe ser "income" o "expense"'
    });
  }
  
  try {
    // Verificar que la cuenta exista y pertenezca al usuario o a una de sus familias
    const [accountCheck] = await pool.query(
      `SELECT a.*, f.id as family_id
       FROM accounts a
       LEFT JOIN families f ON a.family_id = f.id
       WHERE a.id = ?`,
      [account_id]
    );
    
    if (accountCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }
    
    const account = accountCheck[0];
    
    // Verificar permisos
    if (account.user_id !== userId) {
      // Si es una cuenta familiar, verificar que el usuario pertenezca a la familia
      if (account.family_id) {
        const [memberCheck] = await pool.query(
          'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
          [account.family_id, userId]
        );
        
        if (memberCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para agregar transacciones a esta cuenta'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para agregar transacciones a esta cuenta'
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
    
    // Crear la transacción
    const [result] = await pool.query(
      `INSERT INTO transactions 
       (user_id, account_id, amount, type, category_id, description, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        account_id,
        amount,
        type,
        category_id || null,
        description || null,
        transaction_date
      ]
    );
    
    // Obtener detalles de la transacción creada
    const [newTransaction] = await pool.query(
      `SELECT t.*, a.name as account_name, c.name as category_name
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Transacción creada con éxito',
      transaction: newTransaction[0]
    });
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener detalles de una transacción
exports.getTransactionById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // Obtener la transacción con detalles de cuenta y categoría
    const [transactions] = await pool.query(
      `SELECT t.*, a.name as account_name, c.name as category_name,
              a.family_id, a.user_id as account_owner_id
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }
    
    const transaction = transactions[0];
    
    // Verificar permisos
    if (transaction.user_id !== userId) {
      // Si es una cuenta familiar, verificar que el usuario pertenezca a la familia
      if (transaction.family_id) {
        const [memberCheck] = await pool.query(
          'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
          [transaction.family_id, userId]
        );
        
        if (memberCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para ver esta transacción'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta transacción'
        });
      }
    }
    
    // Obtener información adicional sobre la cuenta
    if (transaction.family_id) {
      const [familyInfo] = await pool.query(
        'SELECT name FROM families WHERE id = ?',
        [transaction.family_id]
      );
      
      if (familyInfo.length > 0) {
        transaction.family_name = familyInfo[0].name;
      }
    }
    
    delete transaction.family_id; // Limpiar datos internos
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error al obtener transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar una transacción
exports.updateTransaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    account_id,
    amount,
    type,
    category_id,
    description,
    transaction_date
  } = req.body;
  
  try {
    // Verificar que la transacción exista
    const [transactionCheck] = await pool.query(
      `SELECT t.*, a.family_id, a.user_id as account_owner_id
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ?`,
      [id]
    );
    
    if (transactionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }
    
    const transaction = transactionCheck[0];
    
    // Verificar permisos
    if (transaction.user_id !== userId) {
      // Si es una cuenta familiar, verificar que el usuario pertenezca a la familia
      if (transaction.family_id) {
        const [memberCheck] = await pool.query(
          'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
          [transaction.family_id, userId]
        );
        
        if (memberCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para modificar esta transacción'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar esta transacción'
        });
      }
    }
    
    // Si se cambia la cuenta, verificar permisos sobre la nueva cuenta
    if (account_id && account_id !== transaction.account_id) {
      const [accountCheck] = await pool.query(
        `SELECT a.*, f.id as family_id
         FROM accounts a
         LEFT JOIN families f ON a.family_id = f.id
         WHERE a.id = ?`,
        [account_id]
      );
      
      if (accountCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cuenta no encontrada'
        });
      }
      
      const account = accountCheck[0];
      
      // Verificar permisos sobre la nueva cuenta
      if (account.user_id !== userId) {
        // Si es una cuenta familiar, verificar que el usuario pertenezca a la familia
        if (account.family_id) {
          const [memberCheck] = await pool.query(
            'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
            [account.family_id, userId]
          );
          
          if (memberCheck.length === 0) {
            return res.status(403).json({
              success: false,
              message: 'No tienes permiso para usar esta cuenta'
            });
          }
        } else {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para usar esta cuenta'
          });
        }
      }
    }
    
    // Si se proporciona una categoría, verificar que exista
    if (category_id !== undefined && category_id !== null && category_id !== transaction.category_id) {
      const [categoryCheck] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );
      
      if (category_id !== null && categoryCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
    }
    
    // Validar el tipo de transacción
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo debe ser "income" o "expense"'
      });
    }
    
    // Construir consulta de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];
    
    if (account_id !== undefined) {
      updateFields.push('account_id = ?');
      queryParams.push(account_id);
    }
    
    if (amount !== undefined) {
      updateFields.push('amount = ?');
      queryParams.push(amount);
    }
    
    if (type !== undefined) {
      updateFields.push('type = ?');
      queryParams.push(type);
    }
    
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      queryParams.push(category_id === null ? null : category_id);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      queryParams.push(description === null ? null : description);
    }
    
    if (transaction_date !== undefined) {
      updateFields.push('transaction_date = ?');
      queryParams.push(transaction_date);
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
      `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );
    
    // Obtener la transacción actualizada
    const [updatedTransaction] = await pool.query(
      `SELECT t.*, a.name as account_name, c.name as category_name
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Transacción actualizada con éxito',
      transaction: updatedTransaction[0]
    });
  } catch (error) {
    console.error('Error al actualizar transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar una transacción
exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // Verificar que la transacción exista
    const [transactionCheck] = await pool.query(
      `SELECT t.*, a.family_id
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ?`,
      [id]
    );
    
    if (transactionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }
    
    const transaction = transactionCheck[0];
    
    // Verificar permisos
    if (transaction.user_id !== userId) {
      // Si es una cuenta familiar, verificar que el usuario pertenezca a la familia
      if (transaction.family_id) {
        const [memberCheck] = await pool.query(
          'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
          [transaction.family_id, userId]
        );
        
        if (memberCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para eliminar esta transacción'
          });
        }
        
        // Solo propietarios de la familia pueden eliminar transacciones de otros
        if (memberCheck[0].role !== 'owner' && transaction.user_id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Solo el propietario de la familia puede eliminar transacciones de otros miembros'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar esta transacción'
        });
      }
    }
    
    // Eliminar la transacción
    await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Transacción eliminada con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener las transacciones recientes de un usuario
exports.getUserRecentTransactions = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;
  const { limit = 10 } = req.query;
  
  try {
    // Verificar permisos
    if (parseInt(userId) !== requesterId) {
      // Verificar si ambos usuarios pertenecen a la misma familia
      const [commonFamilies] = await pool.query(
        `SELECT fm1.family_id
         FROM family_members fm1
         JOIN family_members fm2 ON fm1.family_id = fm2.family_id
         WHERE fm1.user_id = ? AND fm2.user_id = ?`,
        [requesterId, userId]
      );
      
      if (commonFamilies.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver las transacciones de este usuario'
        });
      }
    }
    
    // Obtener transacciones recientes
    const [transactions] = await pool.query(
      `SELECT t.id, t.amount, t.type, t.description, t.transaction_date,
              c.name as category_name, a.name as account_name
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC, t.id DESC
       LIMIT ?`,
      [userId, parseInt(limit)]
    );
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error al obtener transacciones recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener resumen de transacciones de un usuario
exports.getUserTransactionsSummary = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;
  const { period = 'month', year, month, category_id } = req.query;
  
  try {
    // Verificar permisos
    if (parseInt(userId) !== requesterId) {
      // Verificar si ambos usuarios pertenecen a la misma familia
      const [commonFamilies] = await pool.query(
        `SELECT fm1.family_id
         FROM family_members fm1
         JOIN family_members fm2 ON fm1.family_id = fm2.family_id
         WHERE fm1.user_id = ? AND fm2.user_id = ?`,
        [requesterId, userId]
      );
      
      if (commonFamilies.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver las transacciones de este usuario'
        });
      }
    }
    
    // Configurar fechas basadas en el período
    let dateFilter = '';
    let dateParams = [];
    const currentDate = new Date();
    const currentYear = year || currentDate.getFullYear();
    const currentMonth = month || (currentDate.getMonth() + 1);
    
    if (period === 'month') {
      // Filtrar por mes específico
      dateFilter = 'AND YEAR(t.transaction_date) = ? AND MONTH(t.transaction_date) = ?';
      dateParams = [currentYear, currentMonth];
    } else if (period === 'year') {
      // Filtrar por año
      dateFilter = 'AND YEAR(t.transaction_date) = ?';
      dateParams = [currentYear];
    } else if (period === 'all') {
      // Sin filtro de fecha
      dateFilter = '';
      dateParams = [];
    }
    
    // Configurar filtro de categoría
    let categoryFilter = '';
    let categoryParams = [];
    
    if (category_id) {
      categoryFilter = 'AND t.category_id = ?';
      categoryParams = [category_id];
    }
    
    // Obtener resumen de ingresos y gastos para el período seleccionado
    const [summary] = await pool.query(
      `SELECT 
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses
       FROM transactions t
       WHERE t.user_id = ? ${dateFilter} ${categoryFilter}`,
      [userId, ...dateParams, ...categoryParams]
    );
    
    // Obtener el balance total acumulado (todas las transacciones de todas las fechas)
    const [totalBalance] = await pool.query(
      `SELECT 
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as balance_total
       FROM transactions t
       WHERE t.user_id = ?`,
      [userId]
    );
    
    // Obtener desglose por categoría
    const [byCategory] = await pool.query(
      `SELECT c.name as category, t.type, SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? ${dateFilter} ${categoryFilter}
       GROUP BY t.category_id, t.type
       ORDER BY t.type, total DESC`,
      [userId, ...dateParams, ...categoryParams]
    );
    
    // Procesar categorías para formato más fácil de usar
    const incomeCategories = [];
    const expenseCategories = [];
    
    byCategory.forEach(item => {
      if (item.type === 'income') {
        incomeCategories.push({
          category: item.category || 'Sin categoría',
          amount: parseFloat(item.total) || 0
        });
      } else {
        expenseCategories.push({
          category: item.category || 'Sin categoría',
          amount: parseFloat(item.total) || 0
        });
      }
    });
    
    // Obtener desglose por mes (si el período es 'year')
    let byMonth = [];
    if (period === 'year') {
      const [monthData] = await pool.query(
        `SELECT 
          MONTH(t.transaction_date) as month,
          SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
          SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expense
         FROM transactions t
         WHERE t.user_id = ? AND YEAR(t.transaction_date) = ? ${categoryFilter}
         GROUP BY MONTH(t.transaction_date)
         ORDER BY month`,
        [userId, currentYear, ...categoryParams]
      );
      
      byMonth = monthData.map(item => ({
        month: item.month,
        income: parseFloat(item.income) || 0,
        expense: parseFloat(item.expense) || 0,
        balance: parseFloat(item.income) - parseFloat(item.expense)
      }));
    }
    
    // Calcular saldo neto
    const netBalance = (parseFloat(summary[0].total_income) || 0) - (parseFloat(summary[0].total_expenses) || 0);
    
    res.json({
      success: true,
      summary: {
        period,
        year: currentYear,
        month: period === 'month' ? currentMonth : undefined,
        income: parseFloat(summary[0].total_income) || 0,
        expenses: parseFloat(summary[0].total_expenses) || 0,
        net_balance: netBalance,
        balance_total: parseFloat(totalBalance[0].balance_total) || 0
      },
      details: {
        income_categories: incomeCategories,
        expense_categories: expenseCategories,
        by_month: period === 'year' ? byMonth : undefined
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
