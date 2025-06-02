import React from 'react';
import { FaFlag, FaTrophy } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SavingsGoalProgress = ({ savingsGoals = [] }) => {
  // If no goals provided, use sample data for display
  const goals = savingsGoals.length > 0 ? savingsGoals : [
    {
      id: 1,
      name: 'Vacaciones',
      target: 1500,
      current: 850,
      end_date: '2023-12-15'
    },
    {
      id: 2,
      name: 'Nuevo ordenador',
      target: 1200,
      current: 750,
      end_date: '2023-11-30'
    },
    {
      id: 3,
      name: 'Fondo de emergencia',
      target: 5000,
      current: 2200,
      end_date: '2024-06-30'
    }
  ];

  // Format currency for display
  const formatCurrency = amount =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  
  // Format date
  const formatDate = dateString => {
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };
  
  // Sort goals by completion percentage (descending)
  const sortedGoals = [...goals].sort((a, b) => 
    (b.current / b.target) - (a.current / a.target)
  );

  return (
    <div className="dashboard-savings-goals-card">
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">
          <FaFlag className="dashboard-card-icon" style={{ marginRight: '10px' }} /> Metas de Ahorro
        </h3>
      </div>
      
      <div className="dashboard-savings-goals-content">
        {sortedGoals.length > 0 ? (
          <div className="dashboard-goals-list">
            {sortedGoals.map(goal => {
              // Calculate progress percentage
              const progressPercent = (goal.current / goal.target) * 100;
              
              // Determine progress status
              let progressStatus = 'in-progress';
              if (progressPercent >= 100) {
                progressStatus = 'completed';
              } else if (progressPercent < 25) {
                progressStatus = 'starting';
              }
              
              return (
                <div key={goal.id} className="dashboard-goal-item">
                  <div className="dashboard-goal-header">
                    <div className="dashboard-goal-name">
                      {progressPercent >= 100 && <FaTrophy className="dashboard-goal-trophy" />}
                      {goal.name}
                    </div>
                    <div className="dashboard-goal-date">
                      Meta: {formatDate(goal.end_date)}
                    </div>
                  </div>
                  
                  <div className="dashboard-goal-progress-container">
                    <div className="dashboard-goal-progress-bar">
                      <div 
                        className={`dashboard-goal-progress ${progressStatus}`} 
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      ></div>
                    </div>
                    <div className="dashboard-goal-progress-labels">
                      <span className="dashboard-goal-current">
                        {formatCurrency(goal.current)}
                      </span>
                      <span className="dashboard-goal-percent">
                        {progressPercent.toFixed(0)}%
                      </span>
                      <span className="dashboard-goal-target">
                        {formatCurrency(goal.target)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="dashboard-goal-remaining">
                    {progressPercent < 100 ? (
                      <span>
                        Te faltan {formatCurrency(goal.target - goal.current)} para completar esta meta
                      </span>
                    ) : (
                      <span className="dashboard-goal-completed-text">
                        ¡Meta completada!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dashboard-empty-state">
            <p>No tienes metas de ahorro configuradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsGoalProgress;
