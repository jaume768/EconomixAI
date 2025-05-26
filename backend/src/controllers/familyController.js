const pool = require('../models/db');

// Crear un grupo familiar
exports.createFamily = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id; // Obtenido del middleware de autenticación

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'El nombre de la familia es requerido'
    });
  }

  // Iniciar transacción para garantizar consistencia
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Crear la familia
    const [familyResult] = await connection.query(
      'INSERT INTO families (name, created_by) VALUES (?, ?)',
      [name, userId]
    );

    const familyId = familyResult.insertId;

    // 2. Añadir al creador como miembro con rol 'owner'
    await connection.query(
      'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
      [familyId, userId, 'owner']
    );

    // 3. Verificar si el usuario tiene el plan familiar activo
    const [userPlans] = await connection.query(
      'SELECT up.* FROM user_plans up JOIN plans p ON up.plan_id = p.id WHERE up.user_id = ? AND p.name = ?',
      [userId, 'familiar']
    );

    // Si no tiene el plan familiar, se lo asignamos
    if (userPlans.length === 0) {
      const [planRows] = await connection.query('SELECT id FROM plans WHERE name = ?', ['familiar']);

      if (planRows.length > 0) {
        await connection.query(
          'INSERT INTO user_plans (user_id, plan_id) VALUES (?, ?)',
          [userId, planRows[0].id]
        );
      }
    }

    // Confirmar transacción
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Grupo familiar creado con éxito',
      family: {
        id: familyId,
        name,
        created_by: userId,
        created_at: new Date()
      }
    });
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error('Error al crear grupo familiar:', error);

    res.status(500).json({
      success: false,
      message: `Error en el servidor: ${error.message}`
    });
  } finally {
    // Liberar la conexión
    connection.release();
  }
};

// Obtener detalles de una familia
exports.getFamilyById = async (req, res) => {
  const { familyId } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que el usuario sea miembro de la familia
    const [memberCheck] = await pool.query(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (memberCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta familia'
      });
    }

    // Obtener datos de la familia
    const [families] = await pool.query(
      `SELECT f.*, u.username as creator_username, u.first_name as creator_first_name, u.last_name as creator_last_name 
       FROM families f
       JOIN users u ON f.created_by = u.id
       WHERE f.id = ?`,
      [familyId]
    );

    if (families.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Familia no encontrada'
      });
    }

    // Obtener cantidad de miembros
    const [memberCount] = await pool.query(
      'SELECT COUNT(*) as total FROM family_members WHERE family_id = ?',
      [familyId]
    );

    // Obtener cuentas asociadas a la familia
    const [accounts] = await pool.query(
      `SELECT a.id, a.name, a.bank_name, a.account_type, a.currency, 
              u.username as owner_username, u.first_name as owner_first_name
       FROM accounts a
       JOIN users u ON a.user_id = u.id
       WHERE a.family_id = ?`,
      [familyId]
    );

    const family = {
      ...families[0],
      member_count: memberCount[0].total,
      accounts
    };

    res.json({
      success: true,
      family
    });
  } catch (error) {
    console.error('Error al obtener detalles de familia:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar datos de una familia
exports.updateFamily = async (req, res) => {
  const { familyId } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'El nombre de la familia es requerido'
    });
  }

  try {
    // Verificar que el usuario sea propietario de la familia
    const [ownerCheck] = await pool.query(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND role = ?',
      [familyId, userId, 'owner']
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede actualizar la familia'
      });
    }

    // Actualizar nombre de la familia
    await pool.query(
      'UPDATE families SET name = ? WHERE id = ?',
      [name, familyId]
    );

    res.json({
      success: true,
      message: 'Familia actualizada con éxito',
      family: {
        id: parseInt(familyId),
        name
      }
    });
  } catch (error) {
    console.error('Error al actualizar familia:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar una familia
exports.deleteFamily = async (req, res) => {
  const { familyId } = req.params;
  const userId = req.user.id;

  // Iniciar transacción
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar que el usuario sea propietario de la familia
    const [ownerCheck] = await pool.query(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND role = ?',
      [familyId, userId, 'owner']
    );

    if (ownerCheck.length === 0) {
      await connection.release();
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede eliminar la familia'
      });
    }

    // Actualizar las cuentas asociadas a la familia para quitar la referencia
    await connection.query(
      'UPDATE accounts SET family_id = NULL WHERE family_id = ?',
      [familyId]
    );

    // Eliminar todos los miembros de la familia (se hará automáticamente por la restricción ON DELETE CASCADE)

    // Eliminar la familia
    await connection.query(
      'DELETE FROM families WHERE id = ?',
      [familyId]
    );

    // Confirmar transacción
    await connection.commit();

    res.json({
      success: true,
      message: 'Familia eliminada con éxito'
    });
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error('Error al eliminar familia:', error);

    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  } finally {
    // Liberar la conexión
    connection.release();
  }
};

// Listar miembros de una familia
exports.getFamilyMembers = async (req, res) => {
  const { familyId } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que el usuario sea miembro de la familia
    const [memberCheck] = await pool.query(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (memberCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta familia'
      });
    }

    // Obtener miembros de la familia
    const [members] = await pool.query(
      `SELECT fm.role, fm.joined_at, 
              u.id, u.username, u.email, u.first_name, u.last_name
       FROM family_members fm
       JOIN users u ON fm.user_id = u.id
       WHERE fm.family_id = ?
       ORDER BY fm.role DESC, fm.joined_at ASC`,
      [familyId]
    );

    res.json({
      success: true,
      members
    });
  } catch (error) {
    console.error('Error al obtener miembros de familia:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Añadir miembro a una familia
exports.addFamilyMember = async (req, res) => {
  const { familyId } = req.params;
  const { userId: targetUserId, email } = req.body;
  const userId = req.user.id;

  if (!targetUserId && !email) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere el ID de usuario o el email del nuevo miembro'
    });
  }

  try {
    // Verificar que el usuario sea miembro de la familia con rol de propietario
    const [ownerCheck] = await pool.query(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND role = ?',
      [familyId, userId, 'owner']
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede añadir miembros'
      });
    }

    // Obtener el ID del usuario a añadir (por ID o email)
    let userToAddId = targetUserId;

    if (!userToAddId && email) {
      const [users] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      userToAddId = users[0].id;
    }

    // Verificar que el usuario no sea ya miembro de la familia
    const [existingMember] = await pool.query(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userToAddId]
    );

    if (existingMember.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es miembro de esta familia'
      });
    }

    // Añadir usuario a la familia
    await pool.query(
      'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
      [familyId, userToAddId, 'member']
    );

    // Obtener datos del usuario añadido
    const [users] = await pool.query(
      'SELECT id, username, email, first_name, last_name FROM users WHERE id = ?',
      [userToAddId]
    );

    res.status(201).json({
      success: true,
      message: 'Miembro añadido con éxito',
      member: {
        ...users[0],
        role: 'member',
        joined_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error al añadir miembro a familia:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar miembro de una familia
exports.removeFamilyMember = async (req, res) => {
  const { familyId, userId: memberIdToRemove } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que la familia exista
    const [familyCheck] = await pool.query(
      'SELECT * FROM families WHERE id = ?',
      [familyId]
    );

    if (familyCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Familia no encontrada'
      });
    }

    // Obtener el rol del usuario que hace la solicitud
    const [requesterRole] = await pool.query(
      'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (requesterRole.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta familia'
      });
    }

    // Obtener el rol del miembro a eliminar
    const [memberRole] = await pool.query(
      'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, memberIdToRemove]
    );

    if (memberRole.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no es miembro de esta familia'
      });
    }

    // Verificar permisos: solo el propietario puede eliminar a otros, o uno mismo puede eliminarse
    const isOwner = requesterRole[0].role === 'owner';
    const isSelfRemoval = parseInt(userId) === parseInt(memberIdToRemove);

    if (!isOwner && !isSelfRemoval) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este miembro'
      });
    }

    // No permitir que el propietario se elimine a sí mismo
    if (isSelfRemoval && memberRole[0].role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'El propietario no puede abandonar la familia. Transfiere la propiedad primero o elimina la familia.'
      });
    }

    // Eliminar al miembro
    await pool.query(
      'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, memberIdToRemove]
    );

    res.json({
      success: true,
      message: 'Miembro eliminado con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar miembro de familia:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
