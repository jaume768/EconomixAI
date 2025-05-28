const pool = require('../models/db');

// Listar todas las metas de un usuario
exports.getUserGoals = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;
  
  try {
    // Verificar permisos - solo el propio usuario puede ver sus metas
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
          message: 'No tienes permiso para ver las metas de este usuario'
        });
      }
    }
    
    // Obtener metas del usuario
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY target_date ASC',
      [userId]
    );
    
    // Calcular porcentaje de progreso para cada meta
    // Para esto, necesitamos saber cuánto ha ahorrado el usuario
    const goalsWithProgress = await Promise.all(goals.map(async (goal) => {
      let progress = 0;
      
      if (goal.goal_type === 'ahorro') {
        // Para metas de ahorro, calculamos basado en el saldo actual de sus cuentas
        const [accountsTotal] = await pool.query(
          `SELECT SUM(
             (SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) 
              FROM transactions 
              WHERE account_id = a.id)
           ) as total_balance
           FROM accounts a
           WHERE a.user_id = ?`,
          [userId]
        );
        
        const totalBalance = parseFloat(accountsTotal[0].total_balance || 0);
        progress = Math.min(100, Math.round((totalBalance / goal.target_amount) * 100));
      } else {
        // Para otros tipos de metas, simplemente mostramos un progreso estimado basado en tiempo
        const today = new Date();
        const startDate = new Date(goal.created_at);
        const targetDate = new Date(goal.target_date);
        
        if (today >= targetDate) {
          progress = 100;
        } else {
          const totalDays = (targetDate - startDate) / (1000 * 60 * 60 * 24);
          const daysElapsed = (today - startDate) / (1000 * 60 * 60 * 24);
          progress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
        }
      }
      
      return {
        ...goal,
        progress
      };
    }));
    
    res.json({
      success: true,
      goals: goalsWithProgress
    });
  } catch (error) {
    console.error('Error al obtener metas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Crear una nueva meta
exports.createUserGoal = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;
  const {
    name,
    goal_type,
    target_amount,
    current_amount,
    target_date,
    description
  } = req.body;
  
  // Validar que solo el propio usuario pueda crear sus metas
  if (parseInt(userId) !== requesterId) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para crear metas para otro usuario'
    });
  }
  
  // Validar campos requeridos
  if (!name || !goal_type || !target_amount || !target_date) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos: name, goal_type, target_amount, target_date'
    });
  }
  
  try {
    // Validar que el tipo de meta sea válido
    if (!['ahorro', 'compra', 'viaje', 'jubilacion'].includes(goal_type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de meta inválido. Debe ser: ahorro, compra, viaje o jubilacion'
      });
    }
    
    // Crear la meta
    const [result] = await pool.query(
      `INSERT INTO goals (
        user_id, name, goal_type, target_amount, current_amount, target_date, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        goal_type,
        target_amount,
        current_amount || 0,
        target_date,
        description || null
      ]
    );
    
    // Obtener detalles de la meta creada
    const [newGoal] = await pool.query(
      'SELECT * FROM goals WHERE id = ?',
      [result.insertId]
    );
    
    // Determinar si hay que desbloquear algún logro
    await checkGoalAchievements(userId);
    
    res.status(201).json({
      success: true,
      message: 'Meta creada con éxito',
      goal: newGoal[0]
    });
  } catch (error) {
    console.error('Error al crear meta:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar una meta
exports.updateUserGoal = async (req, res) => {
  const { userId, id } = req.params;
  const requesterId = req.user.id;
  const {
    name,
    goal_type,
    target_amount,
    current_amount,
    target_date,
    description
  } = req.body;
  
  // Validar que solo el propio usuario pueda actualizar sus metas
  if (parseInt(userId) !== requesterId) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para actualizar metas de otro usuario'
    });
  }
  
  try {
    // Verificar que la meta exista y pertenezca al usuario
    const [goalCheck] = await pool.query(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (goalCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meta no encontrada o no pertenece a este usuario'
      });
    }

    // Construir consulta de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      queryParams.push(name);
    }

    if (goal_type !== undefined) {
      if (!['ahorro', 'compra', 'viaje', 'jubilacion'].includes(goal_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de meta inválido. Debe ser: ahorro, compra, viaje o jubilacion'
        });
      }
      updateFields.push('goal_type = ?');
      queryParams.push(goal_type);
    }

    if (target_amount !== undefined) {
      updateFields.push('target_amount = ?');
      queryParams.push(target_amount);
    }

    if (current_amount !== undefined) {
      updateFields.push('current_amount = ?');
      queryParams.push(current_amount);
    }

    if (target_date !== undefined) {
      updateFields.push('target_date = ?');
      queryParams.push(target_date);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      queryParams.push(description === null ? null : description);
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
      `UPDATE goals SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );
    
    // Obtener la meta actualizada
    const [updatedGoal] = await pool.query(
      'SELECT * FROM goals WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Meta actualizada con éxito',
      goal: updatedGoal[0]
    });
  } catch (error) {
    console.error('Error al actualizar meta:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar una meta
exports.deleteUserGoal = async (req, res) => {
  const { userId, id } = req.params;
  const requesterId = req.user.id;
  
  // Validar que solo el propio usuario pueda eliminar sus metas
  if (parseInt(userId) !== requesterId) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para eliminar metas de otro usuario'
    });
  }
  
  try {
    // Verificar que la meta exista y pertenezca al usuario
    const [goalCheck] = await pool.query(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (goalCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meta no encontrada o no pertenece a este usuario'
      });
    }
    
    // Eliminar la meta
    await pool.query('DELETE FROM goals WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Meta eliminada con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar meta:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Función auxiliar para verificar logros relacionados con metas
async function checkGoalAchievements(userId) {
  try {
    // Contar número de metas
    const [goalCount] = await pool.query(
      'SELECT COUNT(*) as count FROM goals WHERE user_id = ?',
      [userId]
    );
    
    const count = goalCount[0].count;
    
    // Verificar logro "Primera Meta"
    if (count === 1) {
      // Buscar si existe el logro "Primera Meta"
      const [firstGoalAchievement] = await pool.query(
        "SELECT id FROM achievements WHERE name = 'Primera Meta'"
      );
      
      if (firstGoalAchievement.length > 0) {
        const achievementId = firstGoalAchievement[0].id;
        
        // Verificar si el usuario ya tiene este logro
        const [existingAchievement] = await pool.query(
          'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
          [userId, achievementId]
        );
        
        if (existingAchievement.length === 0) {
          // Asignar el logro al usuario
          await pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress)
             VALUES (?, ?, JSON_OBJECT('complete', true))`,
            [userId, achievementId]
          );
        }
      }
    }
    
    // Verificar logro "Planificador Maestro" (5 o más metas)
    if (count >= 5) {
      // Buscar si existe el logro "Planificador Maestro"
      const [masterPlannerAchievement] = await pool.query(
        "SELECT id FROM achievements WHERE name = 'Planificador Maestro'"
      );
      
      if (masterPlannerAchievement.length > 0) {
        const achievementId = masterPlannerAchievement[0].id;
        
        // Verificar si el usuario ya tiene este logro
        const [existingAchievement] = await pool.query(
          'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
          [userId, achievementId]
        );
        
        if (existingAchievement.length === 0) {
          // Asignar el logro al usuario
          await pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress)
             VALUES (?, ?, JSON_OBJECT('complete', true, 'goal_count', ?))`,
            [userId, achievementId, count]
          );
        }
      }
    }
  } catch (error) {
    console.error('Error al verificar logros de metas:', error);
  }
}
