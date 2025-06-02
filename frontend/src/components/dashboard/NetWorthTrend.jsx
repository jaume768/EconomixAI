import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaChartLine } from 'react-icons/fa';

const NetWorthTrend = ({ monthlyData }) => {
  // Filter last 12 months data for trend chart
  const trendData = monthlyData.slice(-12);
  const hasData = trendData.length > 0;

  // Calculate month-to-month net worth changes
  const netWorthByMonth = trendData.map(month => ({
    month: month.month,
    netWorth: (month.income || 0) + (month.expense || 0) // expense is negative
  }));

  // Calculate min/max for scaling the sparkline
  const maxValue = hasData ? Math.max(...netWorthByMonth.map(d => d.netWorth)) : 0;
  const minValue = hasData ? Math.min(...netWorthByMonth.map(d => d.netWorth)) : 0;
  const range = maxValue - minValue || 1;

  // Calculate percentage growth rate
  const firstValue = hasData ? netWorthByMonth[0].netWorth : 0;
  const lastValue = hasData ? netWorthByMonth[netWorthByMonth.length - 1].netWorth : 0;
  const growthRate = firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0;
  
  // Format currency for tooltip
  const formatCurrency = amount =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  // Generate sparkline points
  const generateSparklinePoints = () => {
    if (!hasData) return '';
    
    // Width per point (100% / number of points)
    const pointWidth = 100 / (netWorthByMonth.length - 1);
    
    return netWorthByMonth
      .map((data, index) => {
        // Normalize the value to a percentage of the chart height (0-100%)
        const normalizedHeight = 100 - ((data.netWorth - minValue) / range) * 100;
        return `${index * pointWidth},${normalizedHeight}`;
      })
      .join(' ');
  };

  return (
    <div className="dashboard-card dashboard-net-worth-card">
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">
          <FaChartLine className="dashboard-card-icon" /> Evolución Patrimonial
        </h3>
        <div className={`dashboard-trend-indicator ${growthRate >= 0 ? 'positive' : 'negative'}`}>
          {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate).toFixed(1)}%
        </div>
      </div>
      
      <div className="dashboard-net-worth-chart">
        {hasData ? (
          <>
            <div className="dashboard-sparkline-container">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="dashboard-sparkline">
                <polyline
                  points={generateSparklinePoints()}
                  fill="none"
                  stroke={growthRate >= 0 ? "var(--color-success)" : "var(--color-danger)"}
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="dashboard-net-worth-values">
              <div className="dashboard-net-worth-start">
                <span className="dashboard-net-worth-label">Inicio</span>
                <span className="dashboard-net-worth-amount">{formatCurrency(firstValue)}</span>
                <span className="dashboard-net-worth-date">
                  {hasData && trendData.length > 0 
                    ? format(new Date(2023, trendData[0].month - 1, 1), 'MMM yy', { locale: es })
                    : ''}
                </span>
              </div>
              <div className="dashboard-net-worth-end">
                <span className="dashboard-net-worth-label">Actual</span>
                <span className="dashboard-net-worth-amount">{formatCurrency(lastValue)}</span>
                <span className="dashboard-net-worth-date">
                  {hasData && trendData.length > 0
                    ? format(new Date(2023, trendData[trendData.length - 1].month - 1, 1), 'MMM yy', { locale: es })
                    : ''}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="dashboard-chart-empty">
            <p>No hay datos suficientes para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetWorthTrend;
