import api from './api';

export const getChallenges = async (active = true) => {
  try {
    const response = await api.get('/challenges', {
      params: { active }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener retos:', error);
    throw error;
  }
};

export const getChallengeById = async (challengeId) => {
  try {
    const response = await api.get(`/challenges/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener reto con ID ${challengeId}:`, error);
    throw error;
  }
};

export const getUserChallenges = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/challenges`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener retos del usuario:', error);
    throw error;
  }
};

export const joinChallenge = async (userId, challengeId) => {
  try {
    const response = await api.post(`/users/${userId}/challenges`, { challenge_id: challengeId });
    return response.data;
  } catch (error) {
    console.error(`Error al unirse al reto con ID ${challengeId}:`, error);
    throw error;
  }
};

export const updateUserChallenge = async (userId, challengeId, progressData) => {
  try {
    const response = await api.put(`/users/${userId}/challenges/${challengeId}`, progressData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar progreso en el reto con ID ${challengeId}:`, error);
    throw error;
  }
};

export const leaveChallenge = async (userId, challengeId) => {
  try {
    const response = await api.delete(`/users/${userId}/challenges/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al abandonar el reto con ID ${challengeId}:`, error);
    throw error;
  }
};
