const pool = require('../models/db');

// Listar todas las categorías
exports.getCategories = async (req, res) => {
  try {
    // Obtener todas las categorías
    const [categories] = await pool.query(
      `SELECT c.id, c.name, c.parent_id, c.created_at, c.updated_at,
              p.name as parent_name
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       ORDER BY c.parent_id IS NULL DESC, c.parent_id, c.name`
    );
    
    // Organizar categorías en estructura jerárquica
    const categoryMap = {};
    const rootCategories = [];
    
    // Primer paso: mapear todas las categorías por ID
    categories.forEach(category => {
      categoryMap[category.id] = {
        id: category.id,
        name: category.name,
        parent_id: category.parent_id,
        parent_name: category.parent_name,
        created_at: category.created_at,
        updated_at: category.updated_at,
        children: []
      };
    });
    
    // Segundo paso: construir la jerarquía
    categories.forEach(category => {
      if (category.parent_id) {
        // Es una subcategoría, agregarla como hijo de su padre
        if (categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].children.push(categoryMap[category.id]);
        }
      } else {
        // Es una categoría raíz
        rootCategories.push(categoryMap[category.id]);
      }
    });
    
    res.json({
      success: true,
      categories: req.query.flat === 'true' ? categories : rootCategories
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Crear nueva categoría
exports.createCategory = async (req, res) => {
  const { name, parent_id } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'El nombre de la categoría es requerido'
    });
  }
  
  try {
    // Si se especificó un parent_id, verificar que exista
    if (parent_id) {
      const [parentCheck] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [parent_id]
      );
      
      if (parentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'La categoría padre no existe'
        });
      }
    }
    
    // Verificar que no exista una categoría con el mismo nombre
    const [nameCheck] = await pool.query(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );
    
    if (nameCheck.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con este nombre'
      });
    }
    
    // Crear la categoría
    const [result] = await pool.query(
      'INSERT INTO categories (name, parent_id) VALUES (?, ?)',
      [name, parent_id || null]
    );
    
    // Si es una subcategoría, obtener el nombre del padre
    let parentName = null;
    if (parent_id) {
      const [parent] = await pool.query(
        'SELECT name FROM categories WHERE id = ?',
        [parent_id]
      );
      
      if (parent.length > 0) {
        parentName = parent[0].name;
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Categoría creada con éxito',
      category: {
        id: result.insertId,
        name,
        parent_id: parent_id || null,
        parent_name: parentName,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con este nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Obtener detalle de una categoría
exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Obtener la categoría
    const [categories] = await pool.query(
      `SELECT c.id, c.name, c.parent_id, c.created_at, c.updated_at,
              p.name as parent_name
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Obtener subcategorías
    const [children] = await pool.query(
      `SELECT id, name, parent_id, created_at, updated_at
       FROM categories
       WHERE parent_id = ?`,
      [id]
    );
    
    // Obtener transacciones recientes que usan esta categoría
    const [transactions] = await pool.query(
      `SELECT t.id, t.amount, t.type, t.description, t.transaction_date, a.name as account_name
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.category_id = ?
       ORDER BY t.transaction_date DESC
       LIMIT 5`,
      [id]
    );
    
    const category = {
      ...categories[0],
      children,
      usage: {
        transaction_count: transactions.length,
        recent_transactions: transactions
      }
    };
    
    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Actualizar una categoría
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, parent_id } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'El nombre de la categoría es requerido'
    });
  }
  
  try {
    // Verificar que la categoría exista
    const [categoryCheck] = await pool.query(
      'SELECT id, parent_id FROM categories WHERE id = ?',
      [id]
    );
    
    if (categoryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Evitar ciclos en la jerarquía (una categoría no puede ser su propio ancestro)
    if (parent_id) {
      // Verificar que el nuevo padre exista
      const [parentCheck] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [parent_id]
      );
      
      if (parentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'La categoría padre no existe'
        });
      }
      
      // Evitar que una categoría sea su propio padre
      if (parseInt(parent_id) === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Una categoría no puede ser su propio padre'
        });
      }
      
      // Verificar que el nuevo padre no sea un descendiente de esta categoría
      let currentId = parent_id;
      while (currentId) {
        const [ancestor] = await pool.query(
          'SELECT parent_id FROM categories WHERE id = ?',
          [currentId]
        );
        
        if (ancestor.length === 0 || !ancestor[0].parent_id) {
          break;
        }
        
        if (parseInt(ancestor[0].parent_id) === parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'No se puede crear un ciclo en la jerarquía de categorías'
          });
        }
        
        currentId = ancestor[0].parent_id;
      }
    }
    
    // Actualizar la categoría
    await pool.query(
      'UPDATE categories SET name = ?, parent_id = ? WHERE id = ?',
      [name, parent_id || null, id]
    );
    
    // Obtener la categoría actualizada
    const [updatedCategory] = await pool.query(
      `SELECT c.id, c.name, c.parent_id, c.created_at, c.updated_at,
              p.name as parent_name
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Categoría actualizada con éxito',
      category: updatedCategory[0]
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con este nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Eliminar una categoría
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar que la categoría exista
    const [categoryCheck] = await pool.query(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );
    
    if (categoryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Verificar si hay subcategorías
    const [childrenCheck] = await pool.query(
      'SELECT id FROM categories WHERE parent_id = ?',
      [id]
    );
    
    if (childrenCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una categoría con subcategorías. Elimina primero las subcategorías o asígnalas a otra categoría.'
      });
    }
    
    // Verificar si hay transacciones que usan esta categoría
    const [transactionsCheck] = await pool.query(
      'SELECT id FROM transactions WHERE category_id = ?',
      [id]
    );
    
    if (transactionsCheck.length > 0) {
      // Opción 1: Rechazar la eliminación
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${transactionsCheck.length} transacciones asociadas.`
      });
      
      // Opción 2: Establecer la categoría a NULL en las transacciones
      /*
      await pool.query(
        'UPDATE transactions SET category_id = NULL WHERE category_id = ?',
        [id]
      );
      */
    }
    
    // Eliminar la categoría
    await pool.query(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Categoría eliminada con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
