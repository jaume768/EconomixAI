import React from 'react';
import { 
  FaSave, 
  FaBell, 
  FaReceipt, 
  FaExclamationTriangle 
} from 'react-icons/fa';

const KeyPerformanceIndicators = ({ financialSummary }) => {
  // Format currency for display
  const formatCurrency = amount =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  // Calculate KPI values based on financial summary
  const monthlySavings = (financialSummary.income || 0) + (financialSummary.expenses || 0);
  const subscriptions = financialSummary.recurring_expenses || 120; // Placeholder value
  const unusualExpense = financialSummary.unusual_expenses || 0;
  const savingsProgress = financialSummary.savings_goal_progress || 65; // Placeholder percentage

  // Determine status colors
  const getSavingsStatus = () => {
    if (monthlySavings <= 0) return 'danger';
    if (monthlySavings < financialSummary.income * 0.1) return 'warning';
    return 'success';
  };

  const getSubscriptionsStatus = () => {
    if (subscriptions > financialSummary.income * 0.2) return 'danger';
    if (subscriptions > financialSummary.income * 0.1) return 'warning';
    return 'success';
  };

  const getUnusualStatus = () => {
    if (unusualExpense > financialSummary.income * 0.1) return 'danger';
    if (unusualExpense > 0) return 'warning';
    return 'success';
  };

  const getSavingsProgressStatus = () => {
    if (savingsProgress < 33) return 'danger';
    if (savingsProgress < 66) return 'warning';
    return 'success';
  };

  return (
    <div className="dashboard-kpi-grid">
      <div className="dashboard-kpi-card">
        <div className={`dashboard-kpi-icon ${getSavingsStatus()}`}>
          <FaSave />
        </div>
        <div className="dashboard-kpi-content">
          <h4 className="dashboard-kpi-title">Ahorro Mensual</h4>
          <p className={`dashboard-kpi-value ${getSavingsStatus()}`}>
            {formatCurrency(monthlySavings)}
          </p>
        </div>
      </div>

      <div className="dashboard-kpi-card">
        <div className={`dashboard-kpi-icon ${getSubscriptionsStatus()}`}>
          <FaReceipt />
        </div>
        <div className="dashboard-kpi-content">
          <h4 className="dashboard-kpi-title">Suscripciones</h4>
          <p className={`dashboard-kpi-value ${getSubscriptionsStatus()}`}>
            {formatCurrency(subscriptions)}
          </p>
        </div>
      </div>

      <div className="dashboard-kpi-card">
        <div className={`dashboard-kpi-icon ${getUnusualStatus()}`}>
          <FaExclamationTriangle />
        </div>
        <div className="dashboard-kpi-content">
          <h4 className="dashboard-kpi-title">Gasto Inusual</h4>
          <p className={`dashboard-kpi-value ${getUnusualStatus()}`}>
            {unusualExpense > 0 ? formatCurrency(unusualExpense) : 'Ninguno'}
          </p>
        </div>
      </div>

      <div className="dashboard-kpi-card">
        <div className={`dashboard-kpi-icon ${getSavingsProgressStatus()}`}>
          <FaBell />
        </div>
        <div className="dashboard-kpi-content">
          <h4 className="dashboard-kpi-title">Progreso Metas</h4>
          <div className="dashboard-kpi-progress-container">
            <div className="dashboard-kpi-progress-bar">
              <div 
                className={`dashboard-kpi-progress ${getSavingsProgressStatus()}`} 
                style={{ width: `${savingsProgress}%` }}
              ></div>
            </div>
            <span className="dashboard-kpi-progress-text">
              {savingsProgress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyPerformanceIndicators;
