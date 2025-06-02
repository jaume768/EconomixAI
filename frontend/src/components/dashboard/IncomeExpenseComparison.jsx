import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaChartBar } from 'react-icons/fa';

const IncomeExpenseComparison = ({ monthlyData }) => {
  // Use last 6 months for the comparison
  const lastSixMonths = monthlyData.slice(-6);
  const hasData = lastSixMonths.length > 0;

  // Format month names
  const getMonthLabel = (monthNum) => {
    const date = new Date(2023, monthNum - 1, 1);
    return format(date, 'MMM', { locale: es });
  };

  // Format currency
  const formatCurrency = amount =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  // Calculate the maximum value to properly scale the chart
  const maxValue = hasData 
    ? Math.max(
        ...lastSixMonths.map(item => Math.max(
          item.income || 0, 
          Math.abs(item.expense || 0)
        ))
      ) 
    : 1000;

  return (
    <div className="dashboard-card dashboard-income-expense-card">
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">
          <FaChartBar className="dashboard-card-icon" /> Ingresos vs Gastos
        </h3>
      </div>
      
      <div className="dashboard-income-expense-chart">
        {hasData ? (
          <>
            <div className="dashboard-bar-chart-container">
              {lastSixMonths.map((monthData, index) => {
                const income = monthData.income || 0;
                const expense = Math.abs(monthData.expense || 0);
                const incomeHeight = (income / maxValue) * 100;
                const expenseHeight = (expense / maxValue) * 100;
                
                return (
                  <div key={index} className="dashboard-bar-group">
                    <div className="dashboard-bar-pair">
                      <div className="dashboard-bar-wrapper income">
                        <div 
                          className="dashboard-bar income-bar" 
                          style={{ height: `${incomeHeight}%` }}
                          data-amount={formatCurrency(income)}
                        ></div>
                      </div>
                      <div className="dashboard-bar-wrapper expense">
                        <div 
                          className="dashboard-bar expense-bar" 
                          style={{ height: `${expenseHeight}%` }}
                          data-amount={formatCurrency(expense)}
                        ></div>
                      </div>
                    </div>
                    <div className="dashboard-bar-label">{getMonthLabel(monthData.month)}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="dashboard-chart-legend">
              <div className="dashboard-legend-item">
                <div className="dashboard-legend-color income"></div>
                <span>Ingresos</span>
              </div>
              <div className="dashboard-legend-item">
                <div className="dashboard-legend-color expense"></div>
                <span>Gastos</span>
              </div>
            </div>
          </>
        ) : (
          <div className="dashboard-chart-empty">
            <p>No hay datos suficientes para mostrar</p>
          </div>
        )}
      </div>
      
      {hasData && (
        <div className="dashboard-income-expense-summary">
          <div className="dashboard-summary-stat">
            <span className="dashboard-stat-label">Balance medio:</span>
            <span className="dashboard-stat-value">
              {formatCurrency(
                lastSixMonths.reduce((acc, month) => 
                  acc + ((month.income || 0) + (month.expense || 0)), 0) / lastSixMonths.length
              )}
            </span>
          </div>
          <div className="dashboard-summary-stat">
            <span className="dashboard-stat-label">Ahorro total:</span>
            <span className="dashboard-stat-value">
              {formatCurrency(
                lastSixMonths.reduce((acc, month) => 
                  acc + ((month.income || 0) + (month.expense || 0)), 0)
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeExpenseComparison;
