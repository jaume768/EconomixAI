const pool = require('../models/db');

// Listar todos los retos (globales)
exports.getChallenges = async (req, res) => {
  const { active_only } = req.query;
  
  try {
    let query = 'SELECT * FROM challenges';
    
    // Si se solicita filtrar solo los activos
    if (active_only === 'true') {
      query += " WHERE status = 'active'";
    }
    
    const [challenges] = await pool.query(query);
    
    res.json({
      success: true,
      challenges
    });
  } catch (error) {
    console.error('Error al obtener retos:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Crear un nuevo reto (solo para administradores)
exports.createChallenge = async (req, res) => {
  const { name, description, target_value, current_value, start_date, end_date, status, user_id } = req.body;
  
  // Verificar si el usuario es administrador
  if (!req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para crear retos'
    });
  }
  
  // Validar campos requeridos
  if (!name || !description || !target_value || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos: name, description, target_value, start_date, end_date'
    });
  }
  
  try {
    // Verificar si ya existe un reto con este nombre para el mismo usuario
    const [existingChallenge] = await pool.query(
      'SELECT id FROM challenges WHERE name = ? AND user_id = ?',
      [name, user_id || req.user.id]
    );
    
    if (existingChallenge.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un reto con este nombre para este usuario'
      });
    }
    
    // Crear el reto
    const [result] = await pool.query(
      `INSERT INTO challenges (
        user_id, name, description, target_value, current_value, start_date, end_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || req.user.id,
        name,
        description,
        target_value,
        current_value || 0,
        start_date,
        end_date,
        status || 'active'
      ]
    );
    
    // Obtener detalles del reto creado
    const [newChallenge] = await pool.query(
      'SELECT * FROM challenges WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Reto creado con éxito',
      challenge: newChallenge[0]
    });
  } catch (error) {
    console.error('Error al crear reto:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener detalles de un reto
exports.getChallengeById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [challenges] = await pool.query(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );
    
    if (challenges.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reto no encontrado'
      });
    }
    
    res.json({
      success: true,
      challenge: challenges[0]
    });
  } catch (error) {
    console.error('Error al obtener reto:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar un reto (solo para administradores)
exports.updateChallenge = async (req, res) => {
  const { id } = req.params;
  const { name, description, target_value, current_value, start_date, end_date, status } = req.body;
  
  // Verificar si el usuario es administrador
  if (!req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para actualizar retos'
    });
  }
  
  try {
    // Verificar que el reto exista
    const [challengeCheck] = await pool.query(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );
    
    if (challengeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reto no encontrado'
      });
    }
    
    // Construir consulta de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];
    
    if (name !== undefined) {
      // Verificar que no exista otro reto con el mismo nombre
      if (name !== challengeCheck[0].name) {
        const [nameCheck] = await pool.query(
          'SELECT id FROM challenges WHERE name = ? AND id != ?',
          [name, id]
        );
        
        if (nameCheck.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro reto con este nombre'
          });
        }
      }
      
      updateFields.push('name = ?');
      queryParams.push(name);
    }
    
    if (description) {
      updateFields.push('description = ?');
      queryParams.push(description);
    }
    
    if (target_value !== undefined) {
      updateFields.push('target_value = ?');
      queryParams.push(target_value);
    }
    
    if (current_value !== undefined) {
      updateFields.push('current_value = ?');
      queryParams.push(current_value);
    }
    
    if (start_date) {
      updateFields.push('start_date = ?');
      queryParams.push(start_date);
    }
    
    if (end_date) {
      updateFields.push('end_date = ?');
      queryParams.push(end_date);
    }
    
    if (status) {
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
      `UPDATE challenges SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );
    
    // Obtener el reto actualizado
    const [updatedChallenge] = await pool.query(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Reto actualizado con éxito',
      challenge: updatedChallenge[0]
    });
  } catch (error) {
    console.error('Error al actualizar reto:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar un reto (solo para administradores)
exports.deleteChallenge = async (req, res) => {
  const { id } = req.params;
  
  // Verificar si el usuario es administrador
  if (!req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para eliminar retos'
    });
  }
  
  try {
    // Verificar que el reto exista
    const [challengeCheck] = await pool.query(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );
    
    if (challengeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reto no encontrado'
      });
    }
    
    // Eliminar primero las inscripciones de usuarios a este reto
    await pool.query('DELETE FROM user_challenges WHERE challenge_id = ?', [id]);
    
    // Eliminar el reto
    await pool.query('DELETE FROM challenges WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Reto eliminado con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar reto:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener retos de un usuario específico
exports.getUserChallenges = async (req, res) => {
  const { userId } = req.params;
  const { active_only } = req.query;
  
  try {
    // Verificar acceso (solo el propio usuario o administradores)
    if (req.user.id !== parseInt(userId) && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver los retos de este usuario'
      });
    }
    
    // Consultar retos del usuario
    let query = `
      SELECT * FROM challenges
      WHERE user_id = ?
    `;
    
    // Filtrar por estado si se solicita
    if (active_only === 'true') {
      query += " AND status = 'active'";
    }
    
    // Ordenar por fecha de inicio descendente
    query += ' ORDER BY start_date DESC';
    
    const [userChallenges] = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      challenges: userChallenges
    });
  } catch (error) {
    console.error('Error al obtener retos del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Inscribir a un usuario en un reto
exports.joinChallenge = async (req, res) => {
  const { userId } = req.params;
  const { challenge_id } = req.body;
  const requesterId = req.user.id;
  
  // Validar que solo el propio usuario pueda inscribirse en un reto
  if (parseInt(userId) !== requesterId) {
    return res.status(403).json({
      success: false,
      message: 'No puedes inscribir a otro usuario en un reto'
    });
  }
  
  // Validar campos requeridos
  if (!challenge_id) {
    return res.status(400).json({
      success: false,
      message: 'Falta el ID del reto'
    });
  }
  
  try {
    // Verificar que el reto exista y esté activo
    const [challengeCheck] = await pool.query(
      'SELECT * FROM challenges WHERE id = ? AND status = "active"',
      [challenge_id]
    );
    
    if (challengeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reto no encontrado o no está activo'
      });
    }
    
    // Verificar que el usuario no esté ya inscrito en este reto
    const [existingEnrollment] = await pool.query(
      'SELECT * FROM user_challenges WHERE user_id = ? AND challenge_id = ?',
      [userId, challenge_id]
    );
    
    if (existingEnrollment.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya estás inscrito en este reto'
      });
    }
    
    // Inscribir al usuario en el reto
    const today = new Date().toISOString().split('T')[0];
    const [result] = await pool.query(
      `INSERT INTO user_challenges (
        user_id, challenge_id, start_date, status, progress
      ) VALUES (?, ?, ?, 'active', '{"current": 0, "target": 100}')`,
      [userId, challenge_id, today]
    );
    
    // Obtener detalles de la inscripción
    const [newEnrollment] = await pool.query(
      `SELECT uc.*, c.name, c.description
       FROM user_challenges uc
       JOIN challenges c ON uc.challenge_id = c.id
       WHERE uc.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Te has inscrito en el reto con éxito',
      challenge: newEnrollment[0]
    });
  } catch (error) {
    console.error('Error al inscribirse en reto:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar progreso en un reto
exports.updateUserChallenge = async (req, res) => {
  const { userId, challengeId } = req.params;
  const { progress, status } = req.body;
  const requesterId = req.user.id;
  
  // Validar que solo el propio usuario pueda actualizar su progreso
  if (parseInt(userId) !== requesterId && !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para actualizar el progreso de otro usuario'
    });
  }
  
  try {
    // Verificar que la inscripción exista
    const [enrollmentCheck] = await pool.query(
      'SELECT * FROM user_challenges WHERE user_id = ? AND id = ?',
      [userId, challengeId]
    );
    
    if (enrollmentCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }
    
    // Construir consulta de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];
    
    if (progress !== undefined) {
      // Asegurarse de que el progreso es un objeto JSON válido
      let progressObj;
      try {
        progressObj = typeof progress === 'string' ? JSON.parse(progress) : progress;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'El progreso debe ser un objeto JSON válido'
        });
      }
      
      updateFields.push('progress = ?');
      queryParams.push(JSON.stringify(progressObj));
      
      // Si el progreso indica que se ha completado el reto, actualizar el estado
      if (progressObj.current >= progressObj.target) {
        updateFields.push('status = ?');
        queryParams.push('completed');
        updateFields.push('end_date = ?');
        queryParams.push(new Date().toISOString().split('T')[0]);
      }
    }
    
    if (status !== undefined) {
      if (!['pending', 'active', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Debe ser: pending, active, completed o failed'
        });
      }
      
      updateFields.push('status = ?');
      queryParams.push(status);
      
      // Si se marca como completado o fallido, registrar la fecha de finalización
      if (['completed', 'failed'].includes(status)) {
        updateFields.push('end_date = ?');
        queryParams.push(new Date().toISOString().split('T')[0]);
      }
    }
    
    // Si no hay nada que actualizar
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }
    
    // Ejecutar la actualización
    queryParams.push(challengeId);
    await pool.query(
      `UPDATE user_challenges SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );
    
    // Obtener la inscripción actualizada
    const [updatedEnrollment] = await pool.query(
      `SELECT uc.*, c.name, c.description
       FROM user_challenges uc
       JOIN challenges c ON uc.challenge_id = c.id
       WHERE uc.id = ?`,
      [challengeId]
    );
    
    // Si el reto se completó, verificar si corresponde otorgar algún logro
    if ((status === 'completed' || (progress !== undefined && JSON.parse(typeof progress === 'string' ? progress : JSON.stringify(progress)).current >= JSON.parse(typeof progress === 'string' ? progress : JSON.stringify(progress)).target))) {
      await checkChallengeAchievements(userId);
    }
    
    res.json({
      success: true,
      message: 'Progreso actualizado con éxito',
      challenge: updatedEnrollment[0]
    });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Abandonar un reto
exports.leaveChallenge = async (req, res) => {
  const { userId, challengeId } = req.params;
  const requesterId = req.user.id;
  
  // Validar que solo el propio usuario pueda abandonar un reto
  if (parseInt(userId) !== requesterId) {
    return res.status(403).json({
      success: false,
      message: 'No puedes hacer que otro usuario abandone un reto'
    });
  }
  
  try {
    // Verificar que la inscripción exista
    const [enrollmentCheck] = await pool.query(
      'SELECT * FROM user_challenges WHERE user_id = ? AND id = ?',
      [userId, challengeId]
    );
    
    if (enrollmentCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }
    
    // Marcar como fallido en lugar de eliminar para mantener historial
    await pool.query(
      `UPDATE user_challenges 
       SET status = 'failed', end_date = ? 
       WHERE id = ?`,
      [new Date().toISOString().split('T')[0], challengeId]
    );
    
    res.json({
      success: true,
      message: 'Has abandonado el reto'
    });
  } catch (error) {
    console.error('Error al abandonar reto:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Función auxiliar para verificar logros relacionados con retos
async function checkChallengeAchievements(userId) {
  try {
    // Contar número de retos completados
    const [completedCount] = await pool.query(
      "SELECT COUNT(*) as count FROM user_challenges WHERE user_id = ? AND status = 'completed'",
      [userId]
    );
    
    const count = completedCount[0].count;
    
    // Verificar logro "Primer Reto Completado"
    if (count === 1) {
      // Buscar si existe el logro "Primer Reto Completado"
      const [firstChallengeAchievement] = await pool.query(
        "SELECT id FROM achievements WHERE name = 'Primer Reto Completado'"
      );
      
      if (firstChallengeAchievement.length > 0) {
        const achievementId = firstChallengeAchievement[0].id;
        
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
    
    // Verificar logro "Maestro de Retos" (5 o más retos completados)
    if (count >= 5) {
      // Buscar si existe el logro "Maestro de Retos"
      const [challengeMasterAchievement] = await pool.query(
        "SELECT id FROM achievements WHERE name = 'Maestro de Retos'"
      );
      
      if (challengeMasterAchievement.length > 0) {
        const achievementId = challengeMasterAchievement[0].id;
        
        // Verificar si el usuario ya tiene este logro
        const [existingAchievement] = await pool.query(
          'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
          [userId, achievementId]
        );
        
        if (existingAchievement.length === 0) {
          // Asignar el logro al usuario
          await pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress)
             VALUES (?, ?, JSON_OBJECT('complete', true, 'challenge_count', ?))`,
            [userId, achievementId, count]
          );
        }
      }
    }
  } catch (error) {
    console.error('Error al verificar logros de retos:', error);
  }
}
