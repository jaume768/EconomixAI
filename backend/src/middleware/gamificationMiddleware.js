const GamificationService = require('../services/gamificationService');

/**
 * Middleware para evaluar automáticamente logros y retos después de ciertas acciones
 */
exports.evaluateGamification = async (req, res, next) => {
  // Solo proceder si hay una respuesta exitosa y un usuario autenticado
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user && req.user.id) {
      try {
        // Evaluar logros y retos del usuario de forma asíncrona
        // Usamos Promise.all para ejecutar ambas evaluaciones en paralelo
        Promise.all([
          GamificationService.evaluateUserAchievements(req.user.id),
          GamificationService.evaluateUserChallenges(req.user.id)
        ]).catch(error => {
          console.error('Error en evaluación de gamificación:', error);
        });
      } catch (error) {
        console.error('Error iniciando evaluación de gamificación:', error);
      }
    }
  });
  
  next();
};

/**
 * Middleware específico para evaluar logros después de una transacción
 */
exports.evaluateAfterTransaction = async (req, res, next) => {
  // Guardar respuesta original
  const originalJson = res.json;
  
  // Sobreescribir método json para capturar la respuesta
  res.json = function(data) {
    // Restaurar método original
    res.json = originalJson;
    
    // Solo proceder con evaluación si la transacción fue exitosa
    if (data.success && req.user && req.user.id) {
      try {
        // Evaluar logros y retos del usuario de forma asíncrona
        Promise.all([
          GamificationService.evaluateUserAchievements(req.user.id),
          GamificationService.evaluateUserChallenges(req.user.id)
        ]).catch(error => {
          console.error('Error en evaluación de gamificación post-transacción:', error);
        });
      } catch (error) {
        console.error('Error iniciando evaluación de gamificación post-transacción:', error);
      }
    }
    
    // Continuar con la respuesta original
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Middleware específico para evaluar logros después de cambios en metas
 */
exports.evaluateAfterGoalUpdate = async (req, res, next) => {
  // Guardar respuesta original
  const originalJson = res.json;
  
  // Sobreescribir método json para capturar la respuesta
  res.json = function(data) {
    // Restaurar método original
    res.json = originalJson;
    
    // Solo proceder con evaluación si la actualización de meta fue exitosa
    if (data.success && req.user && req.user.id) {
      try {
        // Evaluar específicamente logros relacionados con metas
        GamificationService.evaluateUserAchievements(req.user.id)
          .catch(error => {
            console.error('Error en evaluación de logros post-meta:', error);
          });
      } catch (error) {
        console.error('Error iniciando evaluación de logros post-meta:', error);
      }
    }
    
    // Continuar con la respuesta original
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Middleware específico para evaluar logros después de cambios en deudas
 */
exports.evaluateAfterDebtUpdate = async (req, res, next) => {
  // Guardar respuesta original
  const originalJson = res.json;
  
  // Sobreescribir método json para capturar la respuesta
  res.json = function(data) {
    // Restaurar método original
    res.json = originalJson;
    
    // Solo proceder con evaluación si la actualización de deuda fue exitosa
    if (data.success && req.user && req.user.id) {
      try {
        // Evaluar específicamente logros relacionados con deudas
        GamificationService.evaluateUserAchievements(req.user.id)
          .catch(error => {
            console.error('Error en evaluación de logros post-deuda:', error);
          });
      } catch (error) {
        console.error('Error iniciando evaluación de logros post-deuda:', error);
      }
    }
    
    // Continuar con la respuesta original
    return originalJson.call(this, data);
  };
  
  next();
};
