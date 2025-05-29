import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { getTransactionSummary, getRecentTransactions } from '../services/transactionService';
import { format, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaWallet, FaArrowUp, FaArrowDown, FaCreditCard, FaChartLine, FaHistory, FaRegLightbulb } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.id) return;

      try {
        setLoading(true);
        setError(null);

        const [
          summaryResponse,
          transactionsResponse
        ] = await Promise.all([
          getTransactionSummary(user.id),
          getRecentTransactions(user.id, 5)
        ]);

        setFinancialSummary(summaryResponse.summary || {});
        setRecentTransactions(transactionsResponse.transactions || []);
        
        // Añadimos log para depuración
        console.log('Financial Summary:', summaryResponse.summary);
        console.log('Recent Transactions:', transactionsResponse.transactions);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('No se pudieron cargar los datos del dashboard. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'd MMM yyyy', { locale: es });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const getChartData = () => {
    if (!financialSummary || !financialSummary.categoryBreakdown) {
      return { pieData: [], barData: { months: [], income: [], expenses: [] } };
    }

    // Datos para el gráfico de barras
    let barData = { months: [], income: [], expenses: [] };
    if (financialSummary.monthlyData) {
      // Obtenemos los últimos 6 meses o menos si no hay suficientes datos
      const months = Object.keys(financialSummary.monthlyData)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-6);

      barData.months = months.map(dateStr => {
        try {
          return format(parseISO(dateStr), 'MMM yy', { locale: es });
        } catch (e) {
          return dateStr;
        }
      });

      barData.income = months.map(month => 
        financialSummary.monthlyData[month]?.income || 0
      );
      
      barData.expenses = months.map(month => 
        Math.abs(financialSummary.monthlyData[month]?.expenses || 0)
      );
    }

    // Datos para el gráfico circular
    let pieData = [];
    if (financialSummary.categoryBreakdown) {
      pieData = Object.entries(financialSummary.categoryBreakdown)
        .map(([label, value]) => ({ label, value: Math.abs(value) }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);
    }

    return { pieData, barData };
  };

  const { pieData, barData } = getChartData();

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {error && (
        <div className="dashboard-error">{error}</div>
      )}

      <header className="dashboard-header">
        <h1 className="dashboard-title">Bienvenido, <span className="dashboard-highlight">{user?.name || 'Usuario'}</span></h1>
        <p className="dashboard-subtitle">Aquí tienes un resumen de tu situación financiera</p>
      </header>

      {/* Tarjetas de resumen */}
      <div className="dashboard-grid">
        <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
          <div className="dashboard-card dashboard-summary-card dashboard-card-primary">
            <h2 className="dashboard-summary-title">
              Balance Total
            </h2>
            <p className="dashboard-summary-value">
              {formatCurrency(financialSummary?.totalBalance || 0)}
            </p>
            <div className="dashboard-summary-footer">
              <FaWallet className="dashboard-summary-icon" />
              <span>Balance actual</span>
            </div>
          </div>
        </div>

        <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
          <div className="dashboard-card dashboard-summary-card dashboard-card-success">
            <h2 className="dashboard-summary-title">
              Ingresos (Este mes)
            </h2>
            <p className="dashboard-summary-value">
              {formatCurrency(financialSummary?.currentMonthIncome || 0)}
            </p>
            <div className="dashboard-summary-footer">
              <FaArrowUp className="dashboard-summary-icon" />
              <span>
                {financialSummary?.incomeChangePercentage > 0 ? '+' : ''}
                {financialSummary?.incomeChangePercentage || 0}% vs. mes anterior
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
          <div className="dashboard-card dashboard-summary-card dashboard-card-danger">
            <h2 className="dashboard-summary-title">
              Gastos (Este mes)
            </h2>
            <p className="dashboard-summary-value">
              {formatCurrency(Math.abs(financialSummary?.currentMonthExpenses || 0))}
            </p>
            <div className="dashboard-summary-footer">
              <FaArrowDown className="dashboard-summary-icon" />
              <span>
                {financialSummary?.expenseChangePercentage > 0 ? '+' : ''}
                {financialSummary?.expenseChangePercentage || 0}% vs. mes anterior
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
          <div className="dashboard-card dashboard-summary-card dashboard-card-warning">
            <h2 className="dashboard-summary-title">
              Deuda Total
            </h2>
            <p className="dashboard-summary-value">
              {formatCurrency(financialSummary?.totalDebt || 0)}
            </p>
            <p className="dashboard-summary-footer">
              <FaCreditCard className="dashboard-summary-icon" />
              {financialSummary?.debtCount || 0} deuda(s) activa(s)
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="dashboard-grid">
        <div className="dashboard-col-xs-12 dashboard-col-md-7">
          <div className="dashboard-card dashboard-chart-container">
            <h2 className="dashboard-chart-title">
              <FaChartLine className="dashboard-chart-icon" /> Ingresos y Gastos (Últimos 6 meses)
            </h2>
            <div className="dashboard-chart">
              {barData.months.length > 0 ? (
                <div className="dashboard-chart-content">
                  <div className="dashboard-chart-legend">
                    <div className="dashboard-chart-legend-item">
                      <span className="dashboard-chart-legend-color income"></span>
                      <span className="dashboard-chart-legend-label">Ingresos</span>
                    </div>
                    <div className="dashboard-chart-legend-item">
                      <span className="dashboard-chart-legend-color expense"></span>
                      <span className="dashboard-chart-legend-label">Gastos</span>
                    </div>
                  </div>
                  <div className="dashboard-bar-chart">
                    {barData.months.map((month, index) => (
                      <div key={month} className="dashboard-bar-chart-column">
                        <div className="dashboard-bar-chart-bars">
                          <div 
                            className="dashboard-bar-chart-bar income" 
                            style={{ height: `${Math.min(100, barData.income[index] ? (barData.income[index] / Math.max(...barData.income) * 100) : 0)}%` }}
                            title={`Ingresos: ${formatCurrency(barData.income[index] || 0)}`}
                          ></div>
                          <div 
                            className="dashboard-bar-chart-bar expense" 
                            style={{ height: `${Math.min(100, barData.expenses[index] ? (barData.expenses[index] / Math.max(...barData.expenses) * 100) : 0)}%` }}
                            title={`Gastos: ${formatCurrency(barData.expenses[index] || 0)}`}
                          ></div>
                        </div>
                        <div className="dashboard-bar-chart-label">{month}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="dashboard-chart-empty">
                  <p>No hay datos suficientes para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-col-xs-12 dashboard-col-md-5">
          <div className="dashboard-card dashboard-chart-container">
            <h2 className="dashboard-chart-title">
              <FaRegLightbulb className="dashboard-chart-icon" /> Distribución de Gastos por Categoría
            </h2>
            <div className="dashboard-chart">
              {pieData.length > 0 ? (
                <div className="dashboard-pie-chart-container">
                  <div className="dashboard-pie-chart">
                    <div className="dashboard-pie" style={{ background: 'conic-gradient(#00A6FB 0% 25%, #0582CA 25% 55%, #006494 55% 75%, #003554 75% 100%)' }}></div>
                  </div>
                  <div className="dashboard-pie-legend">
                    {pieData.map((item, index) => (
                      <div key={index} className="dashboard-pie-legend-item">
                        <span className={`dashboard-pie-legend-color color-${index + 1}`}></span>
                        <span className="dashboard-pie-legend-label">{item.label}</span>
                        <span className="dashboard-pie-legend-value">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="dashboard-chart-empty">
                  <p>No hay datos suficientes para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Transacciones recientes */}
      <div className="dashboard-grid">
        <div className="dashboard-col-xs-12">
          <div className="dashboard-card dashboard-transactions">
            <div className="dashboard-transactions-header">
              <h2 className="dashboard-transactions-title">
                <FaHistory className="dashboard-chart-icon" /> Transacciones Recientes
              </h2>
              <a
                className="dashboard-transactions-link"
                onClick={() => navigate('/transactions')}
              >
                Ver todas <FaArrowDown />
              </a>
            </div>
            <div className="dashboard-divider"></div>

            {recentTransactions.length > 0 ? (
              <ul className="dashboard-transaction-list">
                {recentTransactions.map((transaction) => (
                  <li key={transaction.id}>
                    <div className="dashboard-transaction-item">
                      <div className={`dashboard-transaction-icon ${transaction.amount > 0 ? 'dashboard-transaction-income' : 'dashboard-transaction-expense'}`}>
                        {transaction.amount > 0 ? <FaArrowUp /> : <FaArrowDown />}
                      </div>
                      <div className="dashboard-transaction-content">
                        <p className="dashboard-transaction-description">{transaction.description}</p>
                        <p className="dashboard-transaction-date">{formatDate(transaction.transaction_date)}</p>
                      </div>
                      <div className={`dashboard-transaction-amount ${transaction.amount > 0 ? 'dashboard-transaction-income-text' : 'dashboard-transaction-expense-text'}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                    {recentTransactions.indexOf(transaction) < recentTransactions.length - 1 && (
                      <div className="dashboard-divider"></div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard-empty">
                <p>No hay transacciones recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
