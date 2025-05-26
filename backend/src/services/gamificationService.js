const pool = require('../models/db');

/**
 * Servicio para manejar la lógica de gamificación en la aplicación
 */
class GamificationService {
  
  /**
   * Evalúa el progreso del usuario en todos los logros disponibles
   * @param {number} userId - ID del usuario
   */
  static async evaluateUserAchievements(userId) {
    try {
      // Obtener todos los logros disponibles
      const [achievements] = await pool.query('SELECT * FROM achievements');
      
      // Obtener los logros actuales del usuario
      const [userAchievements] = await pool.query(
        'SELECT * FROM user_achievements WHERE user_id = ?',
        [userId]
      );
      
      // Crear mapa para rápido acceso
      const userAchievementsMap = new Map();
      userAchievements.forEach(ua => {
        userAchievementsMap.set(ua.achievement_id, ua);
      });
      
      // Obtener datos financieros del usuario para evaluar criterios
      const financialData = await this.getUserFinancialData(userId);
      
      // Evaluar cada logro
      for (const achievement of achievements) {
        await this.evaluateAchievement(userId, achievement, userAchievementsMap.get(achievement.id), financialData);
      }
      
      return true;
    } catch (error) {
      console.error('Error evaluando logros del usuario:', error);
      return false;
    }
  }
  
  /**
   * Evalúa el progreso del usuario en todos los retos en los que está participando
   * @param {number} userId - ID del usuario
   */
  static async evaluateUserChallenges(userId) {
    try {
      // Obtener todos los retos en los que participa el usuario
      const [userChallenges] = await pool.query(
        `SELECT uc.*, c.criteria, c.name, c.description 
         FROM user_challenges uc
         JOIN challenges c ON uc.challenge_id = c.id
         WHERE uc.user_id = ? AND c.active = TRUE`,
        [userId]
      );
      
      // Obtener datos financieros del usuario para evaluar criterios
      const financialData = await this.getUserFinancialData(userId);
      
      // Evaluar cada reto
      for (const userChallenge of userChallenges) {
        await this.evaluateChallenge(userId, userChallenge, financialData);
      }
      
      return true;
    } catch (error) {
      console.error('Error evaluando retos del usuario:', error);
      return false;
    }
  }
  
  /**
   * Evalúa un logro específico para un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} achievement - Datos del logro
   * @param {Object} userAchievement - Datos del progreso actual del usuario en este logro
   * @param {Object} financialData - Datos financieros del usuario
   */
  static async evaluateAchievement(userId, achievement, userAchievement, financialData) {
    try {
      // Si el usuario ya completó el logro, no hay nada que evaluar
      if (userAchievement && userAchievement.progress && JSON.parse(userAchievement.progress).complete === true) {
        return;
      }
      
      // Obtener criterios del logro
      const criteria = typeof achievement.criteria === 'string' 
        ? JSON.parse(achievement.criteria) 
        : achievement.criteria;
      
      // Inicializar o actualizar progreso
      let progress = userAchievement && userAchievement.progress 
        ? JSON.parse(userAchievement.progress) 
        : { complete: false };
      
      // Evaluar según el tipo de logro
      let isComplete = false;
      
      switch (criteria.type) {
        case 'transaction_count':
          // Ejemplo: Realizar X transacciones
          const count = financialData.transactions.length;
          progress.current = count;
          progress.target = criteria.target;
          isComplete = count >= criteria.target;
          break;
          
        case 'savings_amount':
          // Ejemplo: Ahorrar X cantidad
          const savings = financialData.accounts
            .filter(a => a.account_type === 'ahorro')
            .reduce((sum, account) => sum + account.balance, 0);
          progress.current = savings;
          progress.target = criteria.target;
          isComplete = savings >= criteria.target;
          break;
          
        case 'debt_reduction':
          // Ejemplo: Reducir deudas en X%
          const currentDebt = financialData.debts.reduce((sum, debt) => sum + debt.current_balance, 0);
          const originalDebt = financialData.debts.reduce((sum, debt) => sum + debt.original_amount, 0);
          const reductionPercent = originalDebt > 0 
            ? Math.round(((originalDebt - currentDebt) / originalDebt) * 100) 
            : 0;
          progress.current = reductionPercent;
          progress.target = criteria.target;
          isComplete = reductionPercent >= criteria.target;
          break;
          
        case 'goal_completion':
          // Ejemplo: Completar X metas
          const completedGoals = financialData.goals.filter(g => g.completed).length;
          progress.current = completedGoals;
          progress.target = criteria.target;
          isComplete = completedGoals >= criteria.target;
          break;
          
        case 'expense_reduction':
          // Ejemplo: Reducir gastos en X% comparado con el mes anterior
          if (financialData.monthlySummaries.length >= 2) {
            const currentMonth = financialData.monthlySummaries[0];
            const previousMonth = financialData.monthlySummaries[1];
            
            if (previousMonth.totalExpenses > 0) {
              const reduction = Math.round(((previousMonth.totalExpenses - currentMonth.totalExpenses) / previousMonth.totalExpenses) * 100);
              progress.current = reduction > 0 ? reduction : 0;
              progress.target = criteria.target;
              isComplete = reduction >= criteria.target;
            }
          }
          break;
          
        // Puedes añadir más tipos de logros según necesidades
      }
      
      // Actualizar progreso en la base de datos
      progress.complete = isComplete;
      
      if (userAchievement) {
        // Actualizar registro existente
        await pool.query(
          `UPDATE user_achievements 
           SET progress = ?, achieved_at = ? 
           WHERE user_id = ? AND achievement_id = ?`,
          [
            JSON.stringify(progress), 
            isComplete ? new Date() : null,
            userId, 
            achievement.id
          ]
        );
      } else {
        // Crear nuevo registro
        await pool.query(
          `INSERT INTO user_achievements (user_id, achievement_id, progress, achieved_at)
           VALUES (?, ?, ?, ?)`,
          [
            userId, 
            achievement.id, 
            JSON.stringify(progress),
            isComplete ? new Date() : null
          ]
        );
      }
      
      // Si se completó, notificar al usuario (pendiente de implementar)
      if (isComplete && (!userAchievement || !JSON.parse(userAchievement.progress).complete)) {
        await this.notifyAchievementCompletion(userId, achievement);
      }
      
    } catch (error) {
      console.error(`Error evaluando logro ${achievement.id} para usuario ${userId}:`, error);
    }
  }
  
  /**
   * Evalúa el progreso de un usuario en un reto específico
   * @param {number} userId - ID del usuario
   * @param {Object} userChallenge - Datos del reto y progreso actual
   * @param {Object} financialData - Datos financieros del usuario
   */
  static async evaluateChallenge(userId, userChallenge, financialData) {
    try {
      // Si el usuario ya completó el reto, no hay nada que evaluar
      if (userChallenge.progress && JSON.parse(userChallenge.progress).complete === true) {
        return;
      }
      
      // Obtener criterios del reto
      const criteria = typeof userChallenge.criteria === 'string' 
        ? JSON.parse(userChallenge.criteria) 
        : userChallenge.criteria;
      
      // Inicializar o actualizar progreso
      let progress = userChallenge.progress 
        ? JSON.parse(userChallenge.progress) 
        : { complete: false };
      
      // Evaluar según el tipo de reto (similar a los logros pero con fechas límite)
      let isComplete = false;
      
      // Verificar si el reto ha expirado
      const now = new Date();
      const endDate = new Date(userChallenge.end_date);
      
      if (now > endDate) {
        progress.expired = true;
      }
      
      // Solo evaluar si no ha expirado
      if (!progress.expired) {
        switch (criteria.type) {
          case 'save_amount':
            // Ejemplo: Ahorrar X cantidad en el periodo del reto
            const savings = financialData.transactions
              .filter(t => t.type === 'ingreso' && t.category_id === criteria.category_id)
              .reduce((sum, t) => sum + t.amount, 0);
            
            progress.current = savings;
            progress.target = criteria.target;
            isComplete = savings >= criteria.target;
            break;
            
          case 'reduce_expenses':
            // Ejemplo: Reducir gastos en categoría específica
            const expenses = financialData.transactions
              .filter(t => t.type === 'gasto' && t.category_id === criteria.category_id)
              .reduce((sum, t) => sum + t.amount, 0);
            
            progress.current = expenses;
            progress.target = criteria.target;
            isComplete = expenses <= criteria.target;
            break;
            
          // Añadir más tipos según necesidades
        }
      }
      
      // Actualizar progreso en la base de datos
      progress.complete = isComplete;
      
      await pool.query(
        `UPDATE user_challenges 
         SET progress = ?, completed_at = ? 
         WHERE user_id = ? AND challenge_id = ?`,
        [
          JSON.stringify(progress), 
          isComplete ? new Date() : null,
          userId, 
          userChallenge.challenge_id
        ]
      );
      
      // Si se completó, notificar al usuario (pendiente de implementar)
      if (isComplete && (!userChallenge.progress || !JSON.parse(userChallenge.progress).complete)) {
        await this.notifyChallengeCompletion(userId, userChallenge);
      }
      
    } catch (error) {
      console.error(`Error evaluando reto ${userChallenge.challenge_id} para usuario ${userId}:`, error);
    }
  }
  
  /**
   * Obtiene datos financieros del usuario para evaluar criterios
   * @param {number} userId - ID del usuario
   * @returns {Object} Datos financieros del usuario
   */
  static async getUserFinancialData(userId) {
    try {
      // Obtener cuentas
      const [accounts] = await pool.query(
        'SELECT * FROM accounts WHERE user_id = ?',
        [userId]
      );
      
      // Obtener transacciones (últimos 90 días)
      const [transactions] = await pool.query(
        `SELECT * FROM transactions 
         WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
         ORDER BY date DESC`,
        [userId]
      );
      
      // Obtener deudas
      const [debts] = await pool.query(
        'SELECT * FROM debts WHERE user_id = ?',
        [userId]
      );
      
      // Obtener metas
      const [goals] = await pool.query(
        'SELECT * FROM goals WHERE user_id = ?',
        [userId]
      );
      
      // Obtener resúmenes mensuales (últimos 3 meses)
      const monthlySummaries = [];
      
      // Calcular resumen para los últimos 3 meses
      for (let i = 0; i < 3; i++) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        
        const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
        const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        const monthTransactions = transactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate >= firstDay && txDate <= lastDay;
        });
        
        const totalIncome = monthTransactions
          .filter(t => t.type === 'ingreso')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const totalExpenses = monthTransactions
          .filter(t => t.type === 'gasto')
          .reduce((sum, t) => sum + t.amount, 0);
        
        monthlySummaries.push({
          month: month.toISOString().substring(0, 7),
          totalIncome,
          totalExpenses,
          transactions: monthTransactions
        });
      }
      
      return {
        accounts,
        transactions,
        debts,
        goals,
        monthlySummaries
      };
      
    } catch (error) {
      console.error('Error obteniendo datos financieros:', error);
      return {
        accounts: [],
        transactions: [],
        debts: [],
        goals: [],
        monthlySummaries: []
      };
    }
  }
  
  /**
   * Notifica al usuario sobre la consecución de un logro
   * @param {number} userId - ID del usuario
   * @param {Object} achievement - Datos del logro
   */
  static async notifyAchievementCompletion(userId, achievement) {
    try {
      // Guardar notificación en la base de datos
      await pool.query(
        `INSERT INTO notifications (user_id, type, content, created_at, read)
         VALUES (?, ?, ?, NOW(), 0)`,
        [
          userId,
          'achievement',
          JSON.stringify({
            achievement_id: achievement.id,
            name: achievement.name,
            message: `¡Felicidades! Has desbloqueado el logro "${achievement.name}"`
          })
        ]
      );
      
      // Aquí se podría añadir lógica para notificaciones push, email, etc.
      
    } catch (error) {
      console.error('Error enviando notificación de logro:', error);
    }
  }
  
  /**
   * Notifica al usuario sobre la consecución de un reto
   * @param {number} userId - ID del usuario
   * @param {Object} challenge - Datos del reto
   */
  static async notifyChallengeCompletion(userId, challenge) {
    try {
      // Guardar notificación en la base de datos
      await pool.query(
        `INSERT INTO notifications (user_id, type, content, created_at, read)
         VALUES (?, ?, ?, NOW(), 0)`,
        [
          userId,
          'challenge',
          JSON.stringify({
            challenge_id: challenge.challenge_id,
            name: challenge.name,
            message: `¡Felicidades! Has completado el reto "${challenge.name}"`
          })
        ]
      );
      
      // Aquí se podría añadir lógica para notificaciones push, email, etc.
      
    } catch (error) {
      console.error('Error enviando notificación de reto:', error);
    }
  }
}

module.exports = GamificationService;
