import React from 'react';
import { FaChartPie } from 'react-icons/fa';

const CategoryDistribution = ({ expenseCategories }) => {
  // Format currency for display
  const formatCurrency = amount =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  // Sort and prepare data
  const categories = expenseCategories
    .map(c => ({ 
      label: c.category, 
      value: Math.abs(c.amount),
      budget: c.budget || Math.abs(c.amount) * 1.2 // Placeholder budget if not available
    }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Show top 5 categories

  const hasData = categories.length > 0;
  
  // Calculate total for percentages
  const total = hasData 
    ? categories.reduce((sum, cat) => sum + cat.value, 0)
    : 0;

  // Calculate colors and conic gradient for the donut chart
  const generateConicGradient = () => {
    if (!hasData) return '';
    
    const colors = [
      '#00A6FB', '#0582CA', '#006494', '#003554', '#051923'
    ];
    
    let gradientString = '';
    let currentPercentage = 0;
    
    categories.forEach((category, index) => {
      const percentage = (category.value / total) * 100;
      gradientString += `${colors[index % colors.length]} ${currentPercentage}% ${currentPercentage + percentage}%${index < categories.length - 1 ? ',' : ''}`;
      currentPercentage += percentage;
    });
    
    return `conic-gradient(${gradientString})`;
  };

  return (
    <div className="dashboard-card dashboard-category-card">
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">
          <FaChartPie className="dashboard-card-icon" /> Distribución de Gastos
        </h3>
      </div>
      
      <div className="dashboard-category-content">
        {hasData ? (
          <>
            <div className="dashboard-donut-chart-container">
              <div 
                className="dashboard-donut-chart" 
                style={{ background: generateConicGradient() }}
              >
                <div className="dashboard-donut-inner">
                  <span className="dashboard-donut-total-value">{formatCurrency(total)}</span>
                  <span className="dashboard-donut-total-label">Total</span>
                </div>
              </div>
            </div>
            
            <div className="dashboard-category-bars">
              {categories.map((category, index) => {
                // Calculate percentage of budget used
                const percentUsed = category.budget > 0 
                  ? (category.value / category.budget) * 100 
                  : 100;
                
                // Determine color based on percentage of budget used
                const barColor = percentUsed > 100 
                  ? 'var(--color-danger)' 
                  : percentUsed > 80 
                    ? 'var(--color-warning)' 
                    : 'var(--color-success)';
                
                return (
                  <div key={index} className="dashboard-category-item">
                    <div className="dashboard-category-header">
                      <div className="dashboard-category-info">
                        <span className={`dashboard-category-color color-${index + 1}`}></span>
                        <span className="dashboard-category-name">{category.label}</span>
                      </div>
                      <div className="dashboard-category-value">{formatCurrency(category.value)}</div>
                    </div>
                    
                    <div className="dashboard-budget-bar-container">
                      <div 
                        className="dashboard-budget-bar" 
                        style={{ 
                          width: `${Math.min(percentUsed, 100)}%`,
                          backgroundColor: barColor
                        }}
                      ></div>
                      {percentUsed > 100 && (
                        <span className="dashboard-budget-overrun">
                          +{formatCurrency(category.value - category.budget)}
                        </span>
                      )}
                    </div>
                    
                    <div className="dashboard-budget-info">
                      <span className="dashboard-budget-percent">
                        {percentUsed.toFixed(0)}%
                      </span>
                      <span className="dashboard-budget-label">
                        del presupuesto: {formatCurrency(category.budget)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="dashboard-chart-empty">
            <p>No hay datos de categorías disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDistribution;
