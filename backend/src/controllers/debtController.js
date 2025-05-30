const pool = require('../models/db');

// Listar todas las deudas del usuario
exports.getDebts = async (req, res) => {
  const userId = req.user.id;
  const {
    status,
    sort_by = 'current_balance',
    sort_order = 'DESC'
  } = req.query;

  try {
    // Construir consulta base
    let query = `
      SELECT * FROM debts
      WHERE user_id = ?
    `;

    const params = [userId];

    // Agregar filtro por estado si se proporciona
    if (status && ['active', 'paid_off', 'defaulted'].includes(status)) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Validar y agregar ordenamiento
    const validSortFields = ['creditor', 'current_balance', 'interest_rate', 'start_date', 'end_date', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    const sortField = validSortFields.includes(sort_by) ? sort_by : 'current_balance';
    const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Ejecutar consulta
    const [debts] = await pool.query(query, params);

    // Obtener totales
    const [totals] = await pool.query(
      `SELECT 
        SUM(original_amount) as total_original,
        SUM(current_balance) as total_current,
        SUM(CASE WHEN status = 'active' THEN current_balance ELSE 0 END) as total_active
       FROM debts
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      debts,
      summary: {
        total_original: parseFloat(totals[0].total_original || 0),
        total_current: parseFloat(totals[0].total_current || 0),
        total_active: parseFloat(totals[0].total_active || 0)
      }
    });
  } catch (error) {
    console.error('Error al obtener deudas:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Crear una nueva deuda
exports.createDebt = async (req, res) => {
  const userId = req.user.id;
  const {
    creditor,
    original_amount,
    current_balance,
    interest_rate,
    installment_amount,
    installment_period,
    start_date,
    end_date,
    status
  } = req.body;

  // Validar campos requeridos
  if (!creditor || !original_amount || !current_balance || interest_rate === undefined || !start_date) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos: creditor, original_amount, current_balance, interest_rate, start_date'
    });
  }

  try {
    // Crear la deuda
    const [result] = await pool.query(
      `INSERT INTO debts (
        user_id, creditor, original_amount, current_balance, 
        interest_rate, installment_amount, installment_period, 
        start_date, end_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        creditor,
        original_amount,
        current_balance,
        interest_rate,
        installment_amount || null,
        installment_period || 'monthly',
        start_date,
        end_date || null,
        status || 'active'
      ]
    );

    // Obtener detalles de la deuda creada
    const [newDebt] = await pool.query(
      'SELECT * FROM debts WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Deuda registrada con éxito',
      debt: newDebt[0]
    });
  } catch (error) {
    console.error('Error al crear deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener detalles de una deuda específica
exports.getDebtById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Obtener detalles de la deuda
    const [debts] = await pool.query(
      'SELECT * FROM debts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (debts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada o no tienes permiso para verla'
      });
    }

    // Obtener pagos recurrentes asociados a esta deuda
    const [payments] = await pool.query(
      `SELECT id, name, amount, frequency, next_date
       FROM recurring_transactions
       WHERE debt_id = ? AND kind = 'debt_payment'`,
      [id]
    );

    res.json({
      success: true,
      debt: debts[0],
      payments
    });
  } catch (error) {
    console.error('Error al obtener deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar una deuda
exports.updateDebt = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    creditor,
    original_amount,
    current_balance,
    interest_rate,
    installment_amount,
    installment_period,
    start_date,
    end_date,
    status
  } = req.body;

  try {
    // Verificar que la deuda exista y pertenezca al usuario
    const [debtCheck] = await pool.query(
      'SELECT * FROM debts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (debtCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada o no tienes permiso para modificarla'
      });
    }

    // Construir consulta de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];

    if (creditor !== undefined) {
      updateFields.push('creditor = ?');
      queryParams.push(creditor);
    }

    if (original_amount !== undefined) {
      updateFields.push('original_amount = ?');
      queryParams.push(original_amount);
    }

    if (current_balance !== undefined) {
      updateFields.push('current_balance = ?');
      queryParams.push(current_balance);
    }

    if (interest_rate !== undefined) {
      updateFields.push('interest_rate = ?');
      queryParams.push(interest_rate);
    }

    if (installment_amount !== undefined) {
      updateFields.push('installment_amount = ?');
      queryParams.push(installment_amount === null ? null : installment_amount);
    }

    if (installment_period !== undefined) {
      updateFields.push('installment_period = ?');
      queryParams.push(installment_period);
    }

    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      queryParams.push(start_date);
    }

    if (end_date !== undefined) {
      updateFields.push('end_date = ?');
      queryParams.push(end_date === null ? null : end_date);
    }

    if (status !== undefined) {
      if (!['active', 'paid_off', 'defaulted'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Debe ser "active", "paid_off" o "defaulted"'
        });
      }
      updateFields.push('status = ?');
      queryParams.push(status);
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
      `UPDATE debts SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );

    // Obtener la deuda actualizada
    const [updatedDebt] = await pool.query(
      'SELECT * FROM debts WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Deuda actualizada con éxito',
      debt: updatedDebt[0]
    });
  } catch (error) {
    console.error('Error al actualizar deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar una deuda
exports.deleteDebt = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que la deuda exista y pertenezca al usuario
    const [debtCheck] = await pool.query(
      'SELECT * FROM debts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (debtCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada o no tienes permiso para eliminarla'
      });
    }

    // Eliminar pagos recurrentes asociados a esta deuda
    await pool.query(
      `DELETE FROM recurring_transactions 
       WHERE debt_id = ? AND kind = 'debt_payment'`,
      [id]
    );

    // Eliminar la deuda
    await pool.query('DELETE FROM debts WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Deuda eliminada con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener deudas de un usuario específico
exports.getUserDebts = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;

  try {
    // Verificar permisos - solo el propio usuario puede ver sus deudas
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
          message: 'No tienes permiso para ver las deudas de este usuario'
        });
      }
    }

    // Obtener deudas del usuario
    const [debts] = await pool.query(
      'SELECT * FROM debts WHERE user_id = ? ORDER BY current_balance DESC',
      [userId]
    );

    // Obtener totales
    const [totals] = await pool.query(
      `SELECT 
        SUM(original_amount) as total_original,
        SUM(current_balance) as total_current,
        SUM(CASE WHEN status = 'active' THEN current_balance ELSE 0 END) as total_active
       FROM debts
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      debts,
      summary: {
        total_original: parseFloat(totals[0].total_original || 0),
        total_current: parseFloat(totals[0].total_current || 0),
        total_active: parseFloat(totals[0].total_active || 0)
      }
    });
  } catch (error) {
    console.error('Error al obtener deudas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
