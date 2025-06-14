import api from './api';

/**
 * Obtiene todas las cuentas del usuario (personales y familiares)
 * @returns {Promise} Respuesta de la API con las cuentas
 */
export const getAccounts = async () => {
  try {
    const response = await api.get('/accounts');
    return response.data;
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    throw error;
  }
};

/**
 * Obtiene una cuenta específica por su ID
 * @param {string} id ID de la cuenta
 * @returns {Promise} Respuesta de la API con los detalles de la cuenta
 */
export const getAccountById = async (id) => {
  try {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener cuenta con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva cuenta
 * @param {Object} accountData Datos de la cuenta a crear
 * @returns {Promise} Respuesta de la API con la cuenta creada
 */
export const createAccount = async (accountData) => {
  try {
    const response = await api.post('/accounts', accountData);
    return response.data;
  } catch (error) {
    console.error('Error al crear cuenta:', error);
    throw error;
  }
};

/**
 * Actualiza una cuenta existente
 * @param {string} id ID de la cuenta a actualizar
 * @param {Object} accountData Nuevos datos de la cuenta
 * @returns {Promise} Respuesta de la API con la cuenta actualizada y un campo success
 */
export const updateAccount = async (id, accountData) => {
  try {
    const response = await api.put(`/accounts/${id}`, accountData);
    return {
      success: true,
      account: response.data.account || response.data,
      message: 'Cuenta actualizada correctamente'
    };
  } catch (error) {
    console.error(`Error al actualizar cuenta con ID ${id}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al actualizar la cuenta',
      error
    };
  }
};



/**
 * Elimina una cuenta
 * @param {string} id ID de la cuenta a eliminar
 * @returns {Promise} Respuesta de la API confirmando la eliminación
 */
export const deleteAccount = async (id) => {
  try {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar cuenta con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene un resumen analítico de las cuentas del usuario
 * @returns {Promise} Respuesta de la API con análisis de las cuentas
 */
export const getAccountsAnalysis = async () => {
  try {
    const response = await api.get('/accounts/analysis');
    return response.data;
  } catch (error) {
    console.error('Error al obtener análisis de cuentas:', error);
    throw error;
  }
};

/**
 * Obtiene las transacciones recientes de una cuenta específica
 * @param {string} accountId ID de la cuenta
 * @param {number} limit Número máximo de transacciones a obtener
 * @returns {Promise} Respuesta de la API con las transacciones recientes
 */
export const getAccountTransactions = async (accountId, limit = 8) => {
  try {
    // Primero intentamos con el endpoint específico de la cuenta
    const response = await api.get(`/accounts/${accountId}/transactions`, {
      params: { limit }
    });
    
    return {
      success: true,
      transactions: response.data.transactions || []
    };
  } catch (error) {
    console.error(`Error al obtener transacciones de la cuenta ${accountId}:`, error);
    
    // Si hay error, podemos intentar con una alternativa
    try {
      const fallbackResponse = await api.get(`/transactions?account_id=${accountId}&limit=${limit}`);
      return {
        success: true,
        transactions: fallbackResponse.data.transactions || []
      };
    } catch (fallbackError) {
      return {
        success: false,
        message: error.message || 'Error al cargar transacciones',
        transactions: []
      };
    }
  }
};
