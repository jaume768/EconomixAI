import api from './api';

export const getUserDebts = async (filters = {}) => {
  try {
    const response = await api.get('/debts', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error al obtener deudas:', error);
    throw error;
  }
};

export const getDebtById = async (id) => {
  try {
    const response = await api.get(`/debts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener deuda con ID ${id}:`, error);
    throw error;
  }
};

export const createDebt = async (debtData) => {
  try {
    const response = await api.post('/debts', debtData);
    return response.data;
  } catch (error) {
    console.error('Error al crear deuda:', error);
    throw error;
  }
};

export const updateDebt = async (id, debtData) => {
  try {
    const response = await api.put(`/debts/${id}`, debtData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar deuda con ID ${id}:`, error);
    throw error;
  }
};

export const deleteDebt = async (id) => {
  try {
    const response = await api.delete(`/debts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar deuda con ID ${id}:`, error);
    throw error;
  }
};

export const getDebtSummary = async () => {
  try {
    const response = await api.get('/debts', {
      params: { summary_only: true }
    });
    return response.data.summary;
  } catch (error) {
    console.error('Error al obtener resumen de deudas:', error);
    throw error;
  }
};
