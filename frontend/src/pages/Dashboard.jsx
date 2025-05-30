import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Dashboard.css';
import './css/dashboard-animations.css';
import { useAuth } from '../context/AuthContext';
import { getTransactionSummary, getRecentTransactions } from '../services/transactionService';
import { getUserDebts } from '../services/debtService';
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
  FaUserCircle
} from 'react-icons/fa';

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

  // Estado y efecto para detectar móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estado de pestañas en móvil (aún sin contenido condicional)
  const [activeSection, setActiveSection] = useState('balance');

  // Fetch de datos
  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          summaryResponse,
          transactionsResponse,
          debtResponse,
          yearSummaryResponse
        ] = await Promise.all([
          getTransactionSummary(user.id, 'month'),
          getRecentTransactions(user.id, 5),
          getUserDebts({ status: 'active' }),
          getTransactionSummary(user.id, 'year')
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
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
        </div>
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
            {['balance', 'income', 'expenses', 'debt'].map(section => (
              <button
                key={section}
                className={`mobile-tab-btn ${activeSection === section ? 'active' : ''}`}
                onClick={() => setActiveSection(section)}
              >
                {section === 'balance' ? 'Balance' :
                  section === 'income' ? 'Ingresos' :
                    section === 'expenses' ? 'Gastos' : 'Deuda'}
              </button>
            ))}
          </div>

          {/* Secciones móviles */}
          {activeSection === 'balance' && (
            <div className="mobile-balance-section">
              <h2 className="mobile-balance-label">Balance Total</h2>
              <div className="mobile-balance-amount">
                {formatCurrency(financialSummary.balance_total || 0)}
              </div>
            </div>
          )}
          {activeSection === 'income' && (
            <div className="mobile-balance-section">
              <h2 className="mobile-balance-label">Ingresos (este mes)</h2>
              <div className="mobile-balance-amount">
                {formatCurrency(financialSummary.income || 0)}
              </div>
            </div>
          )}
          {activeSection === 'expenses' && (
            <div className="mobile-balance-section">
              <h2 className="mobile-balance-label">Gastos (este mes)</h2>
              <div className="mobile-balance-amount">
                {formatCurrency(Math.abs(financialSummary.expenses || 0))}
              </div>
            </div>
          )}
          {activeSection === 'debt' && (
            <div className="mobile-balance-section">
              <h2 className="mobile-balance-label">Deuda total</h2>
              <div className="mobile-balance-amount">
                {formatCurrency(debtSummary.total_active || 0)}
              </div>
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
                <p className="dashboard-summary-value">
                  {formatCurrency(financialSummary.balance_total || 0)}
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
                <p className="dashboard-summary-value">
                  {formatCurrency(financialSummary.income || 0)}
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
                <p className="dashboard-summary-value">
                  {formatCurrency(Math.abs(financialSummary.expenses || 0))}
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
                <p className="dashboard-summary-value">
                  {formatCurrency(debtSummary.total_active || 0)}
                </p>
                <div className="dashboard-summary-footer">
                  <FaCreditCard className="dashboard-summary-icon" />
                  {debtSummary.total_active > 0 ? 'Deudas activas' : 'Sin deudas'}
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="dashboard-grid">
            <div className="dashboard-col-xs-12 dashboard-col-md-7">
              <div className="dashboard-card dashboard-chart-container">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">
                    <FaChartLine className="dashboard-card-icon" /> Ingresos y Gastos (Últimos 6 meses)
                  </h3>
                </div>
                <div className="dashboard-chart">
                  {barData.months.length ? (
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
                        {barData.months.map((m, i) => (
                          <div key={m} className="dashboard-bar-chart-column">
                            <div className="dashboard-bar-chart-bars">
                              <div
                                className="dashboard-bar-chart-bar income"
                                style={{
                                  height: `${Math.min(
                                    100,
                                    barData.income[i]
                                      ? (barData.income[i] / Math.max(...barData.income)) * 100
                                      : 0
                                  )}%`
                                }}
                                title={`Ingresos: ${formatCurrency(barData.income[i] || 0)}`}
                              />
                              <div
                                className="dashboard-bar-chart-bar expense"
                                style={{
                                  height: `${Math.min(
                                    100,
                                    barData.expenses[i]
                                      ? (barData.expenses[i] / Math.max(...barData.expenses)) * 100
                                      : 0
                                  )}%`
                                }}
                                title={`Gastos: ${formatCurrency(barData.expenses[i] || 0)}`}
                              />
                            </div>
                            <div className="dashboard-bar-chart-label">{m}</div>
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
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">
                    <FaRegLightbulb className="dashboard-card-icon" /> Distribución de Gastos por Categoría
                  </h3>
                </div>
                <div className="dashboard-chart">
                  {pieData.length ? (
                    <div className="dashboard-pie-chart-container">
                      <div className="dashboard-pie-chart">
                        <div
                          className="dashboard-pie"
                          style={{
                            background: pieData.length
                              ? `conic-gradient(
                                  #00A6FB 0% ${(pieData[0].value / pieData.reduce((s, i) => s + i.value, 0)) *
                              100}%,
                                  #0582CA ${(pieData[0].value / pieData.reduce((s, i) => s + i.value, 0)) *
                              100}% ${(pieData[0].value + (pieData[1]?.value || 0)) /
                              pieData.reduce((s, i) => s + i.value, 0) *
                              100}%,
                                  #006494 ${(pieData[0].value + (pieData[1]?.value || 0)) /
                              pieData.reduce((s, i) => s + i.value, 0) *
                              100}% ${(pieData[0].value +
                                (pieData[1]?.value || 0) +
                                (pieData[2]?.value || 0)) /
                              pieData.reduce((s, i) => s + i.value, 0) *
                              100}%,
                                  #003554 ${(pieData[0].value +
                                (pieData[1]?.value || 0) +
                                (pieData[2]?.value || 0)) /
                              pieData.reduce((s, i) => s + i.value, 0) *
                              100}% 100%
                                )`
                              : undefined
                          }}
                        />
                      </div>
                      <div className="dashboard-pie-legend">
                        {pieData.map((c, idx) => (
                          <div key={idx} className="dashboard-pie-legend-item">
                            <span className={`dashboard-pie-legend-color color-${idx + 1}`}></span>
                            <span className="dashboard-pie-legend-label">{c.label}</span>
                            <span className="dashboard-pie-legend-value">{formatCurrency(c.value)}</span>
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

          {/* Transacciones recientes escritorio */}
          <div className="dashboard-grid">
            <div className="dashboard-col-xs-12">
              <div className="dashboard-card dashboard-transactions">
                <div className="dashboard-transactions-header">
                  <h2 className="dashboard-transactions-title">
                    <FaHistory className="dashboard-chart-icon" /> Transacciones Recientes
                  </h2>
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
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
