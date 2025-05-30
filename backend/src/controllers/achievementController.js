const pool = require('../models/db');

// Listar todos los logros disponibles
exports.getAchievements = async (req, res) => {
  try {
    const [achievements] = await pool.query('SELECT * FROM achievements ORDER BY id');

    res.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('Error al obtener logros:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener detalles de un logro específico
exports.getAchievementById = async (req, res) => {
  const { id } = req.params;

  try {
    const [achievements] = await pool.query(
      'SELECT * FROM achievements WHERE id = ?',
      [id]
    );

    if (achievements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Logro no encontrado'
      });
    }

    res.json({
      success: true,
      achievement: achievements[0]
    });
  } catch (error) {
    console.error('Error al obtener logro:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Crear un nuevo logro (solo para administradores)
exports.createAchievement = async (req, res) => {
  const { name, description, criteria, badge_image } = req.body;

  // Verificar si el usuario es administrador
  if (!req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para crear logros'
    });
  }

  // Validar campos requeridos
  if (!name || !description || !criteria) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos: name, description, criteria'
    });
  }

  try {
    // Verificar si ya existe un logro con este nombre
    const [existingAchievement] = await pool.query(
      'SELECT id FROM achievements WHERE name = ?',
      [name]
    );

    if (existingAchievement.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un logro con este nombre'
      });
    }

    // Asegurarse de que el criterio es un objeto JSON válido
    let criteriaObj;
    try {
      criteriaObj = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'El criterio debe ser un objeto JSON válido'
      });
    }

    // Crear el logro
    const [result] = await pool.query(
      `INSERT INTO achievements (
        name, description, criteria, badge_image
      ) VALUES (?, ?, ?, ?)`,
      [
        name,
        description,
        JSON.stringify(criteriaObj),
        badge_image || null
      ]
    );

    // Obtener detalles del logro creado
    const [newAchievement] = await pool.query(
      'SELECT * FROM achievements WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Logro creado con éxito',
      achievement: newAchievement[0]
    });
  } catch (error) {
    console.error('Error al crear logro:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar un logro (solo para administradores)
exports.updateAchievement = async (req, res) => {
  const { id } = req.params;
  const { name, description, criteria, badge_image } = req.body;

  // Verificar si el usuario es administrador
  if (!req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para actualizar logros'
    });
  }

  try {
    // Verificar que el logro exista
    const [achievementCheck] = await pool.query(
      'SELECT * FROM achievements WHERE id = ?',
      [id]
    );

    if (achievementCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Logro no encontrado'
      });
    }

    // Construir consulta de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];

    if (name !== undefined) {
      // Verificar que no exista otro logro con el mismo nombre
      if (name !== achievementCheck[0].name) {
        const [nameCheck] = await pool.query(
          'SELECT id FROM achievements WHERE name = ? AND id != ?',
          [name, id]
        );

        if (nameCheck.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro logro con este nombre'
          });
        }
      }

      updateFields.push('name = ?');
      queryParams.push(name);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      queryParams.push(description);
    }

    if (criteria !== undefined) {
      // Asegurarse de que el criterio es un objeto JSON válido
      let criteriaObj;
      try {
        criteriaObj = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'El criterio debe ser un objeto JSON válido'
        });
      }

      updateFields.push('criteria = ?');
      queryParams.push(JSON.stringify(criteriaObj));
    }

    if (badge_image !== undefined) {
      updateFields.push('badge_image = ?');
      queryParams.push(badge_image === null ? null : badge_image);
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
      `UPDATE achievements SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );

    // Obtener el logro actualizado
    const [updatedAchievement] = await pool.query(
      'SELECT * FROM achievements WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Logro actualizado con éxito',
      achievement: updatedAchievement[0]
    });
  } catch (error) {
    console.error('Error al actualizar logro:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar un logro (solo para administradores)
exports.deleteAchievement = async (req, res) => {
  const { id } = req.params;

  // Verificar si el usuario es administrador
  if (!req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para eliminar logros'
    });
  }

  try {
    // Verificar que el logro exista
    const [achievementCheck] = await pool.query(
      'SELECT * FROM achievements WHERE id = ?',
      [id]
    );

    if (achievementCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Logro no encontrado'
      });
    }

    // Eliminar primero las asignaciones de este logro a usuarios
    await pool.query('DELETE FROM user_achievements WHERE achievement_id = ?', [id]);

    // Eliminar el logro
    await pool.query('DELETE FROM achievements WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Logro eliminado con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar logro:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener logros de un usuario específico
exports.getUserAchievements = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;

  try {
    // Verificar permisos - solo el propio usuario puede ver sus logros
    if (parseInt(userId) !== requesterId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver los logros de este usuario'
      });
    }

    // Obtener todos los logros
    const [allAchievements] = await pool.query('SELECT * FROM achievements');

    // Obtener los logros obtenidos por el usuario
    const [userAchievements] = await pool.query(
      `SELECT ua.*, a.name, a.description
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?`,
      [userId]
    );

    // Crear un mapa para facilitar la búsqueda
    const userAchievementsMap = new Map();
    userAchievements.forEach(ua => {
      userAchievementsMap.set(ua.achievement_id, ua);
    });

    // Combinar los datos
    const achievements = allAchievements.map(achievement => {
      const userAchievement = userAchievementsMap.get(achievement.id);
      return {
        ...achievement,
        achieved: !!userAchievement,
        achieved_at: userAchievement ? userAchievement.achieved_at : null,
        progress: userAchievement ? userAchievement.progress : null
      };
    });

    // Calcular estadísticas
    const totalAchievements = allAchievements.length;
    const earnedAchievements = userAchievements.length;
    const completionPercentage = totalAchievements > 0 ? Math.round((earnedAchievements / totalAchievements) * 100) : 0;

    res.json({
      success: true,
      achievements,
      stats: {
        total: totalAchievements,
        earned: earnedAchievements,
        completion_percentage: completionPercentage
      }
    });
  } catch (error) {
    console.error('Error al obtener logros del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Marcar un logro como conseguido o actualizar progreso
exports.updateUserAchievement = async (req, res) => {
  const { userId, achievementId } = req.params;
  const { progress, complete } = req.body;
  const requesterId = req.user.id;

  // Verificar permisos - solo administradores o el propio usuario
  if (parseInt(userId) !== requesterId && !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para actualizar logros de otro usuario'
    });
  }

  try {
    // Verificar que el logro exista
    const [achievementCheck] = await pool.query(
      'SELECT * FROM achievements WHERE id = ?',
      [achievementId]
    );

    if (achievementCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Logro no encontrado'
      });
    }

    // Verificar si el usuario ya tiene este logro
    const [existingAchievement] = await pool.query(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );

    // Preparar el objeto de progreso
    let progressObj = { complete: false };

    if (progress) {
      try {
        const newProgress = typeof progress === 'string' ? JSON.parse(progress) : progress;
        progressObj = { ...progressObj, ...newProgress };
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'El progreso debe ser un objeto JSON válido'
        });
      }
    }

    if (complete === true) {
      progressObj.complete = true;
    }

    if (existingAchievement.length === 0) {
      // Si no existe, crear nuevo registro
      await pool.query(
        `INSERT INTO user_achievements (user_id, achievement_id, progress)
         VALUES (?, ?, ?)`,
        [userId, achievementId, JSON.stringify(progressObj)]
      );
    } else {
      // Si ya existe, actualizar el registro
      await pool.query(
        `UPDATE user_achievements 
         SET progress = ?
         WHERE user_id = ? AND achievement_id = ?`,
        [JSON.stringify(progressObj), userId, achievementId]
      );
    }

    // Obtener el registro actualizado
    const [updatedAchievement] = await pool.query(
      `SELECT ua.*, a.name, a.description
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ? AND ua.achievement_id = ?`,
      [userId, achievementId]
    );

    res.json({
      success: true,
      message: 'Progreso de logro actualizado con éxito',
      achievement: updatedAchievement[0]
    });
  } catch (error) {
    console.error('Error al actualizar progreso del logro:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
