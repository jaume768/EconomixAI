import api from './api';

export const getUserGoals = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/goals`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener metas del usuario:', error);
    throw error;
  }
};

export const createGoal = async (userId, goalData) => {
  try {
    const response = await api.post(`/users/${userId}/goals`, goalData);
    return response.data;
  } catch (error) {
    console.error('Error al crear meta:', error);
    throw error;
  }
};

export const updateGoal = async (userId, goalId, goalData) => {
  try {
    const response = await api.put(`/users/${userId}/goals/${goalId}`, goalData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar meta con ID ${goalId}:`, error);
    throw error;
  }
};

export const deleteGoal = async (userId, goalId) => {
  try {
    const response = await api.delete(`/users/${userId}/goals/${goalId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar meta con ID ${goalId}:`, error);
    throw error;
  }
};
