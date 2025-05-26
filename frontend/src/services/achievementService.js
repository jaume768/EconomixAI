import api from './api';

export const getAchievements = async () => {
  try {
    const response = await api.get('/achievements');
    return response.data;
  } catch (error) {
    console.error('Error al obtener logros:', error);
    throw error;
  }
};

export const getAchievementById = async (achievementId) => {
  try {
    const response = await api.get(`/achievements/${achievementId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener logro con ID ${achievementId}:`, error);
    throw error;
  }
};

export const getUserAchievements = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/achievements`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener logros del usuario:', error);
    throw error;
  }
};

export const updateUserAchievement = async (userId, achievementId, progressData) => {
  try {
    const response = await api.put(`/users/${userId}/achievements/${achievementId}`, progressData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar progreso en el logro con ID ${achievementId}:`, error);
    throw error;
  }
};
