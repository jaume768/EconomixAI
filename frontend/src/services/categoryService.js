import api from './api';

/**
 * Obtiene todas las categorías disponibles
 * @returns {Promise} Respuesta de la API con las categorías
 */
export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
};

/**
 * Obtiene una categoría específica por su ID
 * @param {string} id ID de la categoría
 * @returns {Promise} Respuesta de la API con los detalles de la categoría
 */
export const getCategoryById = async (id) => {
  try {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener categoría con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene todas las categorías disponibles como un árbol jerárquico
 * @returns {Promise} Respuesta de la API con las categorías organizadas jerárquicamente
 */
export const getCategoriesHierarchy = async () => {
  try {
    const response = await api.get('/categories/hierarchy');
    return response.data;
  } catch (error) {
    console.error('Error al obtener jerarquía de categorías:', error);
    throw error;
  }
};
