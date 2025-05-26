import api from './api';

export const getTransactions = async (filters = {}) => {
  try {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    throw error;
  }
};

export const getTransactionById = async (id) => {
  try {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener transacción con ID ${id}:`, error);
    throw error;
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  } catch (error) {
    console.error('Error al crear transacción:', error);
    throw error;
  }
};

export const updateTransaction = async (id, transactionData) => {
  try {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar transacción con ID ${id}:`, error);
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar transacción con ID ${id}:`, error);
    throw error;
  }
};

export const getRecentTransactions = async (userId, limit = 5) => {
  try {
    const response = await api.get(`/users/${userId}/transactions/recent`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener transacciones recientes:', error);
    throw error;
  }
};

export const getTransactionSummary = async (userId, period = 'month') => {
  try {
    const response = await api.get(`/users/${userId}/transactions/summary`, {
      params: { period }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener resumen de transacciones:', error);
    throw error;
  }
};
