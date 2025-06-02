import React from 'react';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import { format, addDays, isBefore, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const UpcomingPayments = ({ upcomingPayments = [] }) => {
  // If no upcoming payments provided, use sample data for display
  const payments = upcomingPayments.length > 0 ? upcomingPayments : [
    { 
      id: 1, 
      name: 'Alquiler', 
      amount: 850, 
      due_date: format(addDays(new Date(), 3), 'yyyy-MM-dd') 
    },
    { 
      id: 2, 
      name: 'Netflix', 
      amount: 12.99, 
      due_date: format(addDays(new Date(), 5), 'yyyy-MM-dd') 
    },
    { 
      id: 3, 
      name: 'Préstamo coche', 
      amount: 320, 
      due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd')  
    },
    { 
      id: 4, 
      name: 'Agua', 
      amount: 45, 
      due_date: format(addDays(new Date(), 12), 'yyyy-MM-dd') 
    }
  ];

  // Format currency for display
  const formatCurrency = amount =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  
  // Format date
  const formatDate = dateString => {
    try {
      return format(new Date(dateString), 'd MMM', { locale: es });
    } catch {
      return dateString;
    }
  };
  
  // Sort payments by due date
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(a.due_date) - new Date(b.due_date)
  );
  
  // Filter only upcoming payments (next 15 days)
  const filteredPayments = sortedPayments.filter(payment => {
    const dueDate = new Date(payment.due_date);
    const today = new Date();
    return isBefore(today, dueDate) && differenceInDays(dueDate, today) <= 15;
  });
  
  // Determine urgency level
  const getUrgencyClass = (dueDate) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
  };

  return (
    <div className="dashboard-upcoming-card">
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">
          <FaCalendarAlt className="dashboard-card-icon" style={{ marginRight: '10px' }} /> Próximos Pagos
        </h3>
      </div>
      
      <div className="dashboard-upcoming-content">
        {filteredPayments.length > 0 ? (
          <div className="dashboard-upcoming-list">
            {filteredPayments.map(payment => (
              <div 
                key={payment.id} 
                className={`dashboard-upcoming-item ${getUrgencyClass(payment.due_date)}`}
              >
                <div className="dashboard-upcoming-date">
                  <div className="dashboard-date-container">
                    <span className="dashboard-date-day">
                      {format(new Date(payment.due_date), 'd')}
                    </span>
                    <span className="dashboard-date-month">
                      {format(new Date(payment.due_date), 'MMM', { locale: es })}
                    </span>
                  </div>
                </div>
                
                <div className="dashboard-upcoming-details">
                  <div className="dashboard-upcoming-name">{payment.name}</div>
                  <div className="dashboard-upcoming-countdown">
                    <FaClock className="dashboard-countdown-icon" />
                    <span>
                      {differenceInDays(new Date(payment.due_date), new Date())} días
                    </span>
                  </div>
                </div>
                
                <div className="dashboard-upcoming-amount">
                  {formatCurrency(payment.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty-state">
            <p>No hay pagos programados en los próximos 15 días</p>
          </div>
        )}
        
        {filteredPayments.length > 0 && (
          <div className="dashboard-upcoming-summary">
            <div className="dashboard-upcoming-total">
              <span className="dashboard-upcoming-total-label">Total a pagar:</span>
              <span className="dashboard-upcoming-total-amount">
                {formatCurrency(
                  filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingPayments;
