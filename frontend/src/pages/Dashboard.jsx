import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Dashboard.css';
import './css/dashboard-animations.css';
import './css/dashboard-visualizations.css';
import { useAuth } from '../context/AuthContext';
import { getTransactionSummary, getRecentTransactions } from '../services/transactionService';
import { getUserDebts } from '../services/debtService';
import { getChallenges } from '../services/challengeService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaCreditCard,
  FaChartLine,
  FaHistory,
  FaRegLightbulb,
  FaUserCircle,
  FaFilter,
  FaPlus,
  FaChartBar,
  FaChartPie
} from 'react-icons/fa';

// Importamos los nuevos componentes de visualización
import NetWorthTrend from '../components/dashboard/NetWorthTrend';
import IncomeExpenseComparison from '../components/dashboard/IncomeExpenseComparison';
import CategoryDistribution from '../components/dashboard/CategoryDistribution';
import CashFlowForecast from '../components/dashboard/CashFlowForecast';
import DebtTracker from '../components/dashboard/DebtTracker';
import KeyPerformanceIndicators from '../components/dashboard/KeyPerformanceIndicators';
import UpcomingPayments from '../components/dashboard/UpcomingPayments';
import SavingsGoalProgress from '../components/dashboard/SavingsGoalProgress';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialSummary, setFinancialSummary] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [debtSummary, setDebtSummary] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [transactionPeriod, setTransactionPeriod] = useState('7d');
  const [animateValues, setAnimateValues] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([
    {
      id: 1,
      description: 'Alquiler',
      amount: 800,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      status: 'urgent'
    },
    {
      id: 2,
      description: 'Factura de luz',
      amount: 75.50,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      status: 'upcoming'
    },
    {
      id: 3,
      description: 'Seguro de coche',
      amount: 220,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 12)),
      status: 'normal'
    }
  ]);

  // Estado y efecto para detectar móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estado de pestañas en móvil (con contenido para todas las secciones)
  const [activeSection, setActiveSection] = useState('balance');

  // Fetch de datos
  useEffect(() => {
    if (!user?.id) return;

    // Iniciar animación cuando se cargan los datos
    setAnimateValues(false);

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          summaryResponse,
          transactionsResponse,
          debtResponse,
          yearSummaryResponse,
          challengesResponse
        ] = await Promise.all([
          getTransactionSummary(user.id, 'month'),
          getRecentTransactions(user.id, 5),
          getUserDebts({ status: 'active' }),
          getTransactionSummary(user.id, 'year'),
          getChallenges()
        ]);

        setFinancialSummary(summaryResponse.summary || {});
        setRecentTransactions(transactionsResponse.transactions || []);
        setDebtSummary(debtResponse.summary || {});
        if (yearSummaryResponse.details?.by_month) {
          setMonthlyData(yearSummaryResponse.details.by_month);
        }
        if (summaryResponse.details?.expense_categories) {
          setExpenseCategories(summaryResponse.details.expense_categories);
        }
        
        // Adaptamos los challenges como metas de ahorro
        if (challengesResponse?.challenges) {
          const goals = challengesResponse.challenges
            .filter(challenge => challenge.status === 'active')
            .map(challenge => ({
              id: challenge.id,
              name: challenge.name,
              target: challenge.target_value,
              current: challenge.current_value,
              end_date: challenge.end_date
            }));
          setSavingsGoals(goals);
        }
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los datos del dashboard. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatCurrency = amount =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatDate = dateString => {
    try {
      return format(parseISO(dateString), 'd MMM yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  const getChartData = () => {
    const barData = { months: [], income: [], expenses: [] };
    if (monthlyData.length) {
      const lastSix = monthlyData.slice(-6);
      barData.months = lastSix.map(item => {
        const d = new Date(2025, item.month - 1, 1);
        return format(d, 'MMM', { locale: es });
      });
      barData.income = lastSix.map(item => item.income || 0);
      barData.expenses = lastSix.map(item => Math.abs(item.expense) || 0);
    }

    let pieData = [];
    if (expenseCategories.length) {
      const total = expenseCategories
        .map(c => Math.abs(c.amount))
        .reduce((a, b) => a + b, 0);
      pieData = expenseCategories
        .map(c => ({ label: c.category, value: Math.abs(c.amount) }))
        .filter(c => c.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);
    }
    return { barData, pieData };
  };

  const { barData, pieData } = getChartData();

  if (loading) {
    return (
      <div className="dashboard-header">
        <h1 className="dashboard-welcome">Bienvenido, {user.name || 'Usuario'}</h1>
        <p className="dashboard-welcome-sub">Aquí tienes un resumen de tus finanzas personales</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {error && <div className="dashboard-error">{error}</div>}

      {isMobile ? (
        <div className="mobile-dashboard">
          {/* Header móvil */}
          <div className="mobile-dashboard-header">
            <div className="mobile-dashboard-user">
              <FaUserCircle className="mobile-avatar-icon" />
              <div className="mobile-user-info">
                <div className="mobile-greeting">Hola, {user.name || 'Usuario'}!</div>
                <div className="mobile-date">{format(new Date(), 'd MMMM yyyy', { locale: es })}</div>
              </div>
            </div>
          </div>

          {/* Pestañas móvil */}
          <div className="mobile-dashboard-tabs">
            {['balance', 'stats', 'goals', 'debt'].map(section => (
              <button
                key={section}
                className={`mobile-tab-btn ${activeSection === section ? 'active' : ''}`}
                onClick={() => setActiveSection(section)}
              >
                {section === 'balance' ? 'Balance' :
                  section === 'stats' ? 'Estadísticas' :
                    section === 'goals' ? 'Metas' : 'Deuda'}
              </button>
            ))}
          </div>

          {/* Secciones móviles */}
          {activeSection === 'balance' && (
            <>
              <div className="mobile-balance-section">
                <h2 className="mobile-balance-label">Balance Total</h2>
                <div className="mobile-balance-amount">
                  {formatCurrency(financialSummary.balance_total || 0)}
                </div>
              </div>
              <KeyPerformanceIndicators financialSummary={financialSummary} />
            </>
          )}
          
          {activeSection === 'stats' && (
            <div className="mobile-stats-section">
              <NetWorthTrend monthlyData={monthlyData} />
              <div className="mobile-section-spacer"></div>
              <IncomeExpenseComparison monthlyData={monthlyData} />
              <div className="mobile-section-spacer"></div>
              <CategoryDistribution expenseCategories={expenseCategories} />
              <div className="mobile-section-spacer"></div>
              <CashFlowForecast monthlyData={monthlyData} />
            </div>
          )}
          
          {activeSection === 'goals' && (
            <div className="mobile-goals-section">
              <SavingsGoalProgress savingsGoals={savingsGoals} />
              <div className="mobile-section-spacer"></div>
              <UpcomingPayments upcomingPayments={upcomingPayments} />
            </div>
          )}
          
          {activeSection === 'debt' && (
            <div className="mobile-debt-section">
              <DebtTracker debtSummary={debtSummary} />
            </div>
          )}

          {/* Transacciones recientes móvil */}
          <div className="mobile-recent-transactions">
            <div className="mobile-section-header">
              <h3 className="mobile-section-title">Transacciones recientes</h3>
              <button className="mobile-view-all" onClick={() => navigate('/transactions')}>
                Ver todas
              </button>
            </div>
            <div className="mobile-transactions-list">
              {recentTransactions.length ? (
                recentTransactions.map(tx => (
                  <div className="mobile-transaction-item" key={tx.id}>
                    <div className={`mobile-icon-circle ${tx.type === 'income' ? 'income' : 'expense'}`}>
                      {tx.type === 'income' ? <FaArrowUp /> : <FaArrowDown />}
                    </div>
                    <div className="mobile-transaction-details">
                      <div className="mobile-transaction-name">{tx.description || 'Transacción'}</div>
                      <div className="mobile-transaction-date">{formatDate(tx.date)}</div>
                    </div>
                    <div className="mobile-transaction-amount">
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(tx.amount || 0))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="mobile-no-transactions">No hay transacciones recientes</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header escritorio */}
          <header className="dashboard-header">
            <h1 className="dashboard-title">
              Bienvenido, <span className="dashboard-highlight">{user.name || 'Usuario'}</span>
            </h1>
            <p className="dashboard-subtitle">Aquí tienes un resumen de tu situación financiera</p>
          </header>

          {/* Resumen financiero */}
          <div className="dashboard-grid">
            <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
              <div className="dashboard-card dashboard-summary-card dashboard-card-primary">
                <h2 className="dashboard-summary-title">Balance Total</h2>
                <p className="dashboard-summary-value animate-value">
                  {animateValues ? (
                    <span className="count-animation">
                      {formatCurrency(financialSummary.balance_total || 0)}
                    </span>
                  ) : (
                    formatCurrency(financialSummary.balance_total || 0)
                  )}
                </p>
                <div className="dashboard-summary-footer">
                  <FaWallet className="dashboard-summary-icon" />
                  <span>Balance actual</span>
                </div>
              </div>
            </div>
            <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
              <div className="dashboard-card dashboard-summary-card dashboard-card-success">
                <h2 className="dashboard-summary-title">Ingresos (Este mes)</h2>
                <p className="dashboard-summary-value animate-value">
                  {animateValues ? (
                    <span className="count-animation">
                      {formatCurrency(financialSummary.income || 0)}
                    </span>
                  ) : (
                    formatCurrency(financialSummary.income || 0)
                  )}
                </p>
                <div className="dashboard-summary-footer">
                  <FaArrowUp className="dashboard-summary-icon" />
                  <span>Este mes</span>
                </div>
              </div>
            </div>
            <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
              <div className="dashboard-card dashboard-summary-card dashboard-card-danger">
                <h2 className="dashboard-summary-title">Gastos (Este mes)</h2>
                <p className="dashboard-summary-value animate-value">
                  {animateValues ? (
                    <span className="count-animation">
                      {formatCurrency(Math.abs(financialSummary.expenses || 0))}
                    </span>
                  ) : (
                    formatCurrency(Math.abs(financialSummary.expenses || 0))
                  )}
                </p>
                <div className="dashboard-summary-footer">
                  <FaArrowDown className="dashboard-summary-icon" />
                  <span>Este mes</span>
                </div>
              </div>
            </div>
            <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
              <div className="dashboard-card dashboard-summary-card dashboard-card-warning">
                <h2 className="dashboard-summary-title">Deuda Total</h2>
                <p className="dashboard-summary-value animate-value">
                  {animateValues ? (
                    <span className="count-animation">
                      {formatCurrency(debtSummary.total_active || 0)}
                    </span>
                  ) : (
                    formatCurrency(debtSummary.total_active || 0)
                  )}
                </p>
                <div className="dashboard-summary-footer">
                  <FaCreditCard className="dashboard-summary-icon" />
                  {debtSummary.total_active > 0 ? 'Deudas activas' : 'Sin deudas'}
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <KeyPerformanceIndicators financialSummary={financialSummary} />

          {/* Fila 1: Net Worth y Income/Expense */}
          <div className="dashboard-grid">
            <div className="dashboard-col-xs-12 dashboard-col-md-6">
              <NetWorthTrend monthlyData={monthlyData} />
            </div>
            <div className="dashboard-col-xs-12 dashboard-col-md-6">
              <IncomeExpenseComparison monthlyData={monthlyData} />
            </div>
          </div>

          {/* Fila 2: Categorías y Forecast */}
          <div className="dashboard-grid">
            <div className="dashboard-col-xs-12 dashboard-col-md-6">
              <CategoryDistribution expenseCategories={expenseCategories} />
            </div>
            <div className="dashboard-col-xs-12 dashboard-col-md-6">
              <CashFlowForecast monthlyData={monthlyData} />
            </div>
          </div>

          {/* Fila 3: Deuda, Pagos y Metas */}
          <div className="dashboard-grid">
            <div className="dashboard-col-xs-12 dashboard-col-md-12 dashboard-col-lg-4">
              <DebtTracker debtSummary={debtSummary} />
            </div>
            <div className="dashboard-col-xs-12 dashboard-col-md-6 dashboard-col-lg-4">
              <UpcomingPayments upcomingPayments={upcomingPayments} />
            </div>
            <div className="dashboard-col-xs-12 dashboard-col-md-6 dashboard-col-lg-4">
              <SavingsGoalProgress savingsGoals={savingsGoals} />
            </div>
          </div>
          
          {/* Fila 4: Transacciones y Tips */}
          <div className="dashboard-grid">
            <div className="dashboard-col-xs-12 dashboard-col-md-8">
              <div className="dashboard-card dashboard-transactions">
                <div className="dashboard-transactions-header">
                  <div className="dashboard-transactions-title-container">
                    <h2 className="dashboard-transactions-title">
                      <FaHistory className="dashboard-chart-icon" /> Transacciones Recientes
                    </h2>
                  </div>
                  <button
                    className="dashboard-transactions-link"
                    onClick={() => navigate('/transactions')}
                  >
                    Ver todas
                  </button>
                </div>
                <div className="dashboard-divider"></div>
                {recentTransactions.length ? (
                  <ul className="dashboard-transaction-list">
                    {recentTransactions.map(tx => (
                      <li key={tx.id}>
                        <div className="dashboard-transaction-item">
                          <div
                            className={`dashboard-transaction-icon ${tx.amount > 0
                              ? 'dashboard-transaction-income'
                              : 'dashboard-transaction-expense'
                              }`}
                          >
                            {tx.amount > 0 ? <FaArrowUp /> : <FaArrowDown />}
                          </div>
                          <div className="dashboard-transaction-content">
                            <p className="dashboard-transaction-description">{tx.description}</p>
                            <p className="dashboard-transaction-date">{formatDate(tx.date)}</p>
                          </div>
                          <div
                            className={`dashboard-transaction-amount ${tx.amount > 0
                              ? 'dashboard-transaction-income-text'
                              : 'dashboard-transaction-expense-text'
                              }`}
                          >
                            {tx.amount > 0 ? '+' : ''}
                            {formatCurrency(tx.amount)}
                          </div>
                        </div>
                        <div className="dashboard-divider"></div>
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
            <div className="dashboard-col-xs-12 dashboard-col-md-4">
              {/* Tarjeta de tips personalizada */}
              <div className="dashboard-card dashboard-tips-card">
                <div className="dashboard-tips-icon">
                  <FaRegLightbulb />
                </div>
                <div className="dashboard-tips-content">
                  <h3 className="dashboard-tips-title">Recomendación personalizada</h3>
                  <p className="dashboard-tips-text">Te recomendamos revisar tu categoría de suscripciones: gasto mensual +120 €</p>
                </div>
                <button className="dashboard-tips-button" onClick={() => navigate('/recommendations')}>
                  Ver detalles
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
