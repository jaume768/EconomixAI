import React, { useState } from 'react';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaChartLine, FaCalendarAlt } from 'react-icons/fa';

const CashFlowForecast = ({ monthlyData }) => {
  const [forecastPeriod, setForecastPeriod] = useState('6'); // Options: 3, 6, 12 months
  
  // Format currency for display
  const formatCurrency = amount =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  // Get historical data (last 6 months)
  const historicalData = monthlyData.slice(-6);
  const hasData = historicalData.length > 0;
  
  // Simple forecasting function (can be enhanced with more complex models)
  const generateForecast = (period) => {
    if (!hasData) return [];
    
    const numericPeriod = parseInt(period, 10);
    const lastMonth = historicalData[historicalData.length - 1];
    const lastMonthNum = lastMonth.month;
    const lastYear = 2023; // Can be dynamically calculated if year is included in data
    
    // Calculate average change in income and expenses over historical period
    const incomeChange = historicalData.length > 1
      ? (historicalData[historicalData.length - 1].income - historicalData[0].income) / (historicalData.length - 1)
      : 0;
    
    const expenseChange = historicalData.length > 1
      ? (historicalData[historicalData.length - 1].expense - historicalData[0].expense) / (historicalData.length - 1)
      : 0;
    
    // Generate forecast data
    return Array.from({ length: numericPeriod }, (_, index) => {
      const forecastMonth = (lastMonthNum + index) % 12 + 1; // Wrap around after December
      const forecastYear = lastYear + Math.floor((lastMonthNum + index) / 12);
      const monthDate = new Date(forecastYear, forecastMonth - 1, 1);
      
      return {
        month: forecastMonth,
        label: format(monthDate, 'MMM yy', { locale: es }),
        income: lastMonth.income + (incomeChange * (index + 1)),
        expense: lastMonth.expense + (expenseChange * (index + 1)),
        balance: lastMonth.income + (incomeChange * (index + 1)) + 
                (lastMonth.expense + (expenseChange * (index + 1))),
        isProjection: true
      };
    });
  };

  // Prepare data for the chart
  const prepareChartData = () => {
    if (!hasData) return { combinedData: [], maxValue: 0, minValue: 0 };
    
    // Format historical data
    const formattedHistorical = historicalData.map(item => {
      const monthDate = new Date(2023, item.month - 1, 1);
      return {
        month: item.month,
        label: format(monthDate, 'MMM yy', { locale: es }),
        income: item.income || 0,
        expense: item.expense || 0,
        balance: (item.income || 0) + (item.expense || 0), // expense is negative
        isProjection: false
      };
    });
    
    // Generate and combine with forecast
    const forecastData = generateForecast(forecastPeriod);
    const combinedData = [...formattedHistorical, ...forecastData];
    
    // Find min/max for chart scaling
    const allBalances = combinedData.map(d => d.balance);
    const maxValue = Math.max(...allBalances);
    const minValue = Math.min(...allBalances);
    
    return { combinedData, maxValue, minValue };
  };

  const { combinedData, maxValue, minValue } = prepareChartData();
  const range = maxValue - minValue || 1;

  // Generate line chart points
  const generateLinePoints = () => {
    if (!hasData || combinedData.length === 0) return '';
    
    // Width per point (100% / number of points)
    const pointWidth = 100 / (combinedData.length - 1);
    
    return combinedData
      .map((data, index) => {
        // Normalize the value to a percentage of the chart height (0-100%)
        const normalizedHeight = 100 - ((data.balance - minValue) / range) * 100;
        return `${index * pointWidth},${normalizedHeight}`;
      })
      .join(' ');
  };

  return (
    <div className="dashboard-card dashboard-forecast-card">
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">
          <FaChartLine className="dashboard-card-icon" /> Previsión de Cash Flow
        </h3>
        <div className="dashboard-period-selector">
          <FaCalendarAlt className="dashboard-period-icon" />
          <select 
            value={forecastPeriod} 
            onChange={(e) => setForecastPeriod(e.target.value)}
            className="dashboard-period-select"
          >
            <option value="3">3 meses</option>
            <option value="6">6 meses</option>
            <option value="12">12 meses</option>
          </select>
        </div>
      </div>
      
      <div className="dashboard-forecast-chart">
        {hasData ? (
          <>
            <div className="dashboard-forecast-container">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="dashboard-forecast-line">
                {/* Historical line */}
                <polyline
                  points={generateLinePoints()}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                />
                
                {/* Projection area */}
                <path
                  d={`
                    ${generateLinePoints()} 
                    L ${100},${100} 
                    L ${100 * (historicalData.length - 1) / (combinedData.length - 1)},${100} 
                    Z
                  `}
                  fill="url(#projection-gradient)"
                  opacity="0.2"
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="projection-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                
                {/* Vertical separator between historical and forecast */}
                <line
                  x1={`${100 * (historicalData.length - 1) / (combinedData.length - 1)}%`}
                  y1="0"
                  x2={`${100 * (historicalData.length - 1) / (combinedData.length - 1)}%`}
                  y2="100"
                  stroke="var(--color-muted)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              </svg>
              
              {/* Month labels */}
              <div className="dashboard-forecast-labels">
                {combinedData.map((data, index) => (
                  <div 
                    key={index} 
                    className={`dashboard-forecast-label ${data.isProjection ? 'projection' : ''}`}
                    style={{
                      left: `${index * (100 / (combinedData.length - 1))}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {index % 2 === 0 ? data.label : ''}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="dashboard-forecast-legend">
              <div className="dashboard-legend-item">
                <div className="dashboard-legend-line historical"></div>
                <span>Histórico</span>
              </div>
              <div className="dashboard-legend-item">
                <div className="dashboard-legend-area projection"></div>
                <span>Proyección</span>
              </div>
            </div>
            
            {/* Forecast summary */}
            <div className="dashboard-forecast-summary">
              <div className="dashboard-forecast-stat">
                <div className="dashboard-stat-value">
                  {formatCurrency(combinedData[combinedData.length - 1].balance)}
                </div>
                <div className="dashboard-stat-label">
                  Balance proyectado para {combinedData[combinedData.length - 1].label}
                </div>
              </div>
              
              <div className="dashboard-forecast-stat">
                <div className="dashboard-stat-value">
                  {((combinedData[combinedData.length - 1].balance - 
                     combinedData[historicalData.length - 1].balance) / 
                     Math.abs(combinedData[historicalData.length - 1].balance) * 100).toFixed(1)}%
                </div>
                <div className="dashboard-stat-label">
                  Cambio proyectado
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="dashboard-chart-empty">
            <p>No hay datos suficientes para mostrar una previsión</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowForecast;
