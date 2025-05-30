const pool = require('../models/db');

// Listar todas las cuentas del usuario (individuales + familia)
exports.getAccounts = async (req, res) => {
  const userId = req.user.id;

  try {
    // Obtener cuentas personales del usuario
    const [personalAccounts] = await pool.query(
      `SELECT a.*, NULL as family_name
       FROM accounts a
       WHERE a.user_id = ? AND a.family_id IS NULL`,
      [userId]
    );

    // Obtener familias a las que pertenece el usuario
    const [families] = await pool.query(
      `SELECT f.id, f.name
       FROM families f
       JOIN family_members fm ON f.id = fm.family_id
       WHERE fm.user_id = ?`,
      [userId]
    );

    // Obtener cuentas familiares
    let familyAccounts = [];
    if (families.length > 0) {
      const familyIds = families.map(f => f.id);
      const placeholders = familyIds.map(() => '?').join(',');

      const [accounts] = await pool.query(
        `SELECT a.*, f.name as family_name, u.username as owner_username, u.first_name as owner_first_name
         FROM accounts a
         JOIN families f ON a.family_id = f.id
         JOIN users u ON a.user_id = u.id
         WHERE a.family_id IN (${placeholders})`,
        [...familyIds]
      );

      familyAccounts = accounts;
    }

    // Combinar todas las cuentas
    const allAccounts = [
      ...personalAccounts.map(acc => ({
        ...acc,
        type: 'personal'
      })),
      ...familyAccounts.map(acc => ({
        ...acc,
        type: 'family'
      }))
    ];

    // Para cada cuenta, calcular su balance actual basado en transacciones
    const accountsWithBalance = await Promise.all(allAccounts.map(async (account) => {
      // Obtener suma de ingresos
      const [incomeResult] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_income
         FROM transactions
         WHERE account_id = ? AND type = 'income'`,
        [account.id]
      );

      // Obtener suma de gastos
      const [expenseResult] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_expense
         FROM transactions
         WHERE account_id = ? AND type = 'expense'`,
        [account.id]
      );

      // Calcular balance
      const totalIncome = parseFloat(incomeResult[0].total_income || 0);
      const totalExpense = Math.abs(parseFloat(expenseResult[0].total_expense || 0));
      const balance = totalIncome - totalExpense;

      return {
        ...account,
        balance
      };
    }));

    // Calcular balance total de todas las cuentas
    const totalBalance = accountsWithBalance.reduce((sum, account) => sum + account.balance, 0);

    res.json({
      success: true,
      accounts: accountsWithBalance,
      totalBalance
    });
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Crear una nueva cuenta
exports.createAccount = async (req, res) => {
  const { name, bank_name, account_type, currency = 'EUR', family_id } = req.body;
  const userId = req.user.id;

  if (!name || !account_type) {
    return res.status(400).json({
      success: false,
      message: 'El nombre y tipo de cuenta son requeridos'
    });
  }

  // Validar que el tipo de cuenta sea válido
  const validTypes = ['ahorro', 'corriente', 'inversión'];
  if (!validTypes.includes(account_type)) {
    return res.status(400).json({
      success: false,
      message: `El tipo de cuenta debe ser uno de: ${validTypes.join(', ')}`
    });
  }

  try {
    // Si es una cuenta familiar, verificar que el usuario pertenezca a la familia
    if (family_id) {
      const [memberCheck] = await pool.query(
        'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
        [family_id, userId]
      );

      if (memberCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No perteneces a esta familia'
        });
      }
    }

    // Crear la cuenta
    const [result] = await pool.query(
      'INSERT INTO accounts (user_id, family_id, name, bank_name, account_type, currency) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, family_id || null, name, bank_name || null, account_type, currency]
    );

    // Obtener datos de la familia si es cuenta familiar
    let familyData = null;
    if (family_id) {
      const [families] = await pool.query(
        'SELECT name FROM families WHERE id = ?',
        [family_id]
      );

      if (families.length > 0) {
        familyData = {
          id: family_id,
          name: families[0].name
        };
      }
    }

    res.status(201).json({
      success: true,
      message: 'Cuenta creada con éxito',
      account: {
        id: result.insertId,
        user_id: userId,
        family_id: family_id || null,
        family: familyData,
        name,
        bank_name: bank_name || null,
        account_type,
        currency,
        created_at: new Date(),
        type: family_id ? 'family' : 'personal'
      }
    });
  } catch (error) {
    console.error('Error al crear cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener detalles de una cuenta
exports.getAccountById = async (req, res) => {
  const { accountId } = req.params;
  const userId = req.user.id;

  try {
    // Obtener detalles de la cuenta
    const [accounts] = await pool.query(
      `SELECT a.*, f.name as family_name 
       FROM accounts a
       LEFT JOIN families f ON a.family_id = f.id
       WHERE a.id = ?`,
      [accountId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    const account = accounts[0];

    // Verificar que el usuario sea propietario o miembro de la familia
    if (account.user_id !== userId && account.family_id) {
      // Verificar si el usuario pertenece a la familia
      const [memberCheck] = await pool.query(
        'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
        [account.family_id, userId]
      );

      if (memberCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta cuenta'
        });
      }
    } else if (account.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta cuenta'
      });
    }

    // Obtener el saldo actual
    const [balanceResult] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
       FROM transactions
       WHERE account_id = ?`,
      [accountId]
    );

    const balance = parseFloat(balanceResult[0].balance) || 0;

    // Obtener transacciones recientes
    const [recentTransactions] = await pool.query(
      `SELECT t.id, t.amount, t.type, c.name as category, t.description, t.transaction_date
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.account_id = ?
       ORDER BY t.transaction_date DESC
       LIMIT 5`,
      [accountId]
    );

    res.json({
      success: true,
      account: {
        ...account,
        balance,
        type: account.family_id ? 'family' : 'personal',
        recent_transactions: recentTransactions
      }
    });
  } catch (error) {
    console.error('Error al obtener detalles de cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar una cuenta
exports.updateAccount = async (req, res) => {
  const { accountId } = req.params;
  const { name, bank_name, account_type, currency } = req.body;
  const userId = req.user.id;

  if (!name && !bank_name && !account_type && !currency) {
    return res.status(400).json({
      success: false,
      message: 'Debe proporcionar al menos un campo para actualizar'
    });
  }

  // Validar que el tipo de cuenta sea válido si se proporciona
  if (account_type) {
    const validTypes = ['ahorro', 'corriente', 'inversión'];
    if (!validTypes.includes(account_type)) {
      return res.status(400).json({
        success: false,
        message: `El tipo de cuenta debe ser uno de: ${validTypes.join(', ')}`
      });
    }
  }

  try {
    // Verificar que la cuenta exista y pertenezca al usuario
    const [accounts] = await pool.query(
      `SELECT a.*, f.name as family_name 
       FROM accounts a
       LEFT JOIN families f ON a.family_id = f.id
       WHERE a.id = ?`,
      [accountId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    const account = accounts[0];

    // Verificar permiso para actualizar
    if (account.user_id !== userId) {
      // Si es cuenta familiar, verificar si el usuario es propietario de la familia
      if (account.family_id) {
        const [ownerCheck] = await pool.query(
          'SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND role = ?',
          [account.family_id, userId, 'owner']
        );

        if (ownerCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Solo el propietario de la cuenta o de la familia puede modificarla'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar esta cuenta'
        });
      }
    }

    // Construir la consulta de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];

    if (name) {
      updateFields.push('name = ?');
      queryParams.push(name);
    }

    if (bank_name !== undefined) {
      updateFields.push('bank_name = ?');
      queryParams.push(bank_name);
    }

    if (account_type) {
      updateFields.push('account_type = ?');
      queryParams.push(account_type);
    }

    if (currency) {
      updateFields.push('currency = ?');
      queryParams.push(currency);
    }

    // Añadir el ID de la cuenta al final de los parámetros
    queryParams.push(accountId);

    // Ejecutar la actualización
    await pool.query(
      `UPDATE accounts SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );

    // Obtener la cuenta actualizada
    const [updatedAccounts] = await pool.query(
      `SELECT a.*, f.name as family_name 
       FROM accounts a
       LEFT JOIN families f ON a.family_id = f.id
       WHERE a.id = ?`,
      [accountId]
    );

    res.json({
      success: true,
      message: 'Cuenta actualizada con éxito',
      account: {
        ...updatedAccounts[0],
        type: updatedAccounts[0].family_id ? 'family' : 'personal'
      }
    });
  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar una cuenta
exports.deleteAccount = async (req, res) => {
  const { accountId } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que la cuenta exista
    const [accounts] = await pool.query(
      'SELECT * FROM accounts WHERE id = ?',
      [accountId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    const account = accounts[0];

    // Verificar permiso para eliminar
    if (account.user_id !== userId) {
      // Si es cuenta familiar, verificar si el usuario es propietario de la familia
      if (account.family_id) {
        const [ownerCheck] = await pool.query(
          'SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND role = ?',
          [account.family_id, userId, 'owner']
        );

        if (ownerCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Solo el propietario de la cuenta o de la familia puede eliminarla'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar esta cuenta'
        });
      }
    }

    // Eliminar transacciones relacionadas
    await pool.query(
      'DELETE FROM transactions WHERE account_id = ?',
      [accountId]
    );

    // Eliminar la cuenta
    await pool.query(
      'DELETE FROM accounts WHERE id = ?',
      [accountId]
    );

    res.json({
      success: true,
      message: 'Cuenta eliminada con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Listar cuentas de un usuario específico
exports.getUserAccounts = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;

  try {
    // Si el usuario solicita sus propias cuentas, mostrar todo
    if (parseInt(userId) === parseInt(requesterId)) {
      return await exports.getAccounts(req, res);
    }

    // De lo contrario, verificar si ambos usuarios pertenecen a la misma familia
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
        message: 'No tienes permiso para ver las cuentas de este usuario'
      });
    }

    // Obtener las cuentas familiares compartidas
    const familyIds = commonFamilies.map(f => f.family_id);
    const placeholders = familyIds.map(() => '?').join(',');

    const [accounts] = await pool.query(
      `SELECT a.*, f.name as family_name
       FROM accounts a
       JOIN families f ON a.family_id = f.id
       WHERE a.user_id = ? AND a.family_id IN (${placeholders})`,
      [userId, ...familyIds]
    );

    res.json({
      success: true,
      accounts: accounts.map(acc => ({
        ...acc,
        type: 'family'
      }))
    });
  } catch (error) {
    console.error('Error al obtener cuentas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
