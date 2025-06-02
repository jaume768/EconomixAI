import api from './api';

/**
 * Obtiene un enlace de autorización para conectar con Tink
 * @returns {Promise<Object>} Datos con la URL de autorización
 */
export const getAuthorizationLink = async () => {
  try {
    const response = await api.get('/tink/authorize');
    return response.data;
  } catch (error) {
    console.error('Error al obtener enlace de autorización de Tink:', error);
    throw error;
  }
};

/**
 * Obtiene todas las conexiones bancarias del usuario
 * @returns {Promise<Object>} Lista de conexiones
 */
export const getConnections = async () => {
  try {
    const response = await api.get('/tink/connections');
    return response.data;
  } catch (error) {
    console.error('Error al obtener conexiones bancarias:', error);
    throw error;
  }
};

/**
 * Elimina una conexión bancaria
 * @param {string} connectionId ID de la conexión a eliminar
 * @returns {Promise<Object>} Respuesta de la operación
 */
export const deleteConnection = async (connectionId) => {
  try {
    const response = await api.delete(`/tink/connections/${connectionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar conexión con ID ${connectionId}:`, error);
    throw error;
  }
};

/**
 * Sincroniza manualmente las cuentas de una conexión
 * @param {string} connectionId ID de la conexión a sincronizar
 * @returns {Promise<Object>} Estado de la sincronización
 */
export const syncConnection = async (connectionId) => {
  try {
    const response = await api.post(`/tink/connections/${connectionId}/sync`);
    return response.data;
  } catch (error) {
    console.error(`Error al sincronizar conexión con ID ${connectionId}:`, error);
    throw error;
  }
};
