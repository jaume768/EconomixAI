import React from 'react';
import { FaCreditCard } from 'react-icons/fa';

const DebtTracker = ({ debtSummary }) => {
  // Format currency for display
  const formatCurrency = amount =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  // Debt data
  const totalDebt = debtSummary.total_active || 0;
  const debts = debtSummary.debts || [];
  const hasData = debts.length > 0;

  // Calculate recommended maximum debt (a common financial rule is 36% of annual income)
  // This is just an example, could be based on user's financial profile
  const annualIncome = debtSummary.annual_income || totalDebt * 3; // Fallback if no income data
  const recommendedMaxDebt = annualIncome * 0.36;
  
  // Calculate debt ratio and determine health status
  const debtRatio = totalDebt / recommendedMaxDebt;
  let debtStatus = 'healthy';
  
  if (debtRatio > 1) {
    debtStatus = 'danger';
  } else if (debtRatio > 0.7) {
    debtStatus = 'warning';
  }

  return (
    <div className="dashboard-debt-tracker-card">
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">
          <FaCreditCard className="dashboard-card-icon" style={{ marginRight: '10px' }} /> Monitor de Deuda
        </h3>
      </div>
      
      <div className="dashboard-debt-content">
        {hasData || totalDebt > 0 ? (
          <>
            <div className="dashboard-debt-summary">
              <div className="dashboard-debt-total">
                <span className="dashboard-debt-label">Deuda Total</span>
                <span className="dashboard-debt-amount">{formatCurrency(totalDebt)}</span>
              </div>
              
              <div className="dashboard-debt-meter-container">
                <div className="dashboard-debt-meter-labels">
                  <span>0</span>
                  <span>Recomendado</span>
                  <span>Alto</span>
                </div>
                <div className="dashboard-debt-meter">
                  <div className="dashboard-debt-meter-zones">
                    <div className="dashboard-debt-zone healthy"></div>
                    <div className="dashboard-debt-zone warning"></div>
                    <div className="dashboard-debt-zone danger"></div>
                  </div>
                  <div 
                    className="dashboard-debt-indicator"
                    style={{ 
                      left: `${Math.min(debtRatio * 70, 100)}%`,
                      backgroundColor: 
                        debtStatus === 'danger' ? 'var(--color-danger)' : 
                        debtStatus === 'warning' ? 'var(--color-warning)' : 
                        'var(--color-success)'
                    }}
                  ></div>
                </div>
                <div className="dashboard-debt-meter-max">
                  {formatCurrency(recommendedMaxDebt)}
                </div>
              </div>
              
              <div className="dashboard-debt-status">
                <span className={`dashboard-debt-status-indicator ${debtStatus}`}>⬤</span>
                <span className="dashboard-debt-status-text">
                  {debtStatus === 'healthy' 
                    ? 'Nivel de deuda saludable' 
                    : debtStatus === 'warning'
                      ? 'Nivel de deuda moderado'
                      : 'Nivel de deuda elevado'}
                </span>
              </div>
            </div>
            
            {debts.length > 0 && (
              <div className="dashboard-debt-list">
                <h4 className="dashboard-debt-list-title">Deudas Activas</h4>
                {debts.map((debt, index) => {
                  // Calculate progress percentage
                  const progress = debt.original_amount 
                    ? ((debt.original_amount - debt.current_amount) / debt.original_amount) * 100
                    : 0;
                  
                  return (
                    <div key={index} className="dashboard-debt-item">
                      <div className="dashboard-debt-item-header">
                        <span className="dashboard-debt-name">{debt.name}</span>
                        <span className="dashboard-debt-item-amount">
                          {formatCurrency(debt.current_amount)}
                        </span>
                      </div>
                      
                      <div className="dashboard-debt-progress-container">
                        <div className="dashboard-debt-progress-bar">
                          <div 
                            className="dashboard-debt-progress" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="dashboard-debt-progress-text">
                          {progress.toFixed(0)}% pagado
                        </span>
                      </div>
                      
                      {debt.monthly_payment && (
                        <div className="dashboard-debt-payment">
                          <span className="dashboard-debt-payment-label">Pago mensual:</span>
                          <span className="dashboard-debt-payment-amount">
                            {formatCurrency(debt.monthly_payment)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="dashboard-chart-empty">
            <p>No tienes deudas activas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtTracker;
