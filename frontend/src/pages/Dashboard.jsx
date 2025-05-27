import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { getTransactionSummary, getRecentTransactions } from '../services/transactionService';
import { getUserGoals } from '../services/goalService';
import { getUserChallenges } from '../services/challengeService';
import { getUserAchievements } from '../services/achievementService';
import { format, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.id) return;

      try {
        setLoading(true);
        setError(null);

        const [
          summaryResponse,
          transactionsResponse,
          goalsResponse,
          challengesResponse,
          achievementsResponse
        ] = await Promise.all([
          getTransactionSummary(user.id),
          getRecentTransactions(user.id, 5),
          getUserGoals(user.id),
          getUserChallenges(user.id),
          getUserAchievements(user.id)
        ]);

        setFinancialSummary(summaryResponse.summary || {});
        setRecentTransactions(transactionsResponse.transactions || []);
        setGoals(goalsResponse.goals || []);
        setChallenges(challengesResponse.challenges || []);
        setAchievements(
          (achievementsResponse.achievements || []).filter(a => a.achieved)
        );

        setActiveGoals(
          (goalsResponse.goals || [])
            .filter(g => !g.completed)
            .sort((a, b) => calculateProgress(b) - calculateProgress(a))
            .slice(0, 3)
        );

        setActiveChallenges(
          (challengesResponse.challenges || [])
            .filter(c => {
              const progress = c.progress ? JSON.parse(c.progress) : {};
              return !progress.complete && !progress.expired;
            })
            .slice(0, 3)
        );

        setRecentAchievements(
          (achievementsResponse.achievements || [])
            .filter(a => a.achieved)
            .sort((a, b) => new Date(b.achieved_at) - new Date(a.achieved_at))
            .slice(0, 3)
        );
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('No se pudieron cargar los datos del dashboard. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const calculateProgress = (goal) => {
    return Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  const getChallengeProgress = (challenge) => {
    try {
      const progress = typeof challenge.progress === 'string'
        ? JSON.parse(challenge.progress)
        : challenge.progress || { current: 0, target: 1 };

      if (progress.complete) return 100;
      if (!progress.current || !progress.target) return 0;

      return Math.min(100, Math.round((progress.current / progress.target) * 100));
    } catch (e) {
      return 0;
    }
  };

  // Preparar datos para gráficos
  const getChartData = () => {
    if (!financialSummary || !financialSummary.categoryBreakdown) {
      return {
        pieData: [],
        barData: { months: [], income: [], expenses: [] }
      };
    }

    // Datos para gráfico de categorías
    const pieData = Object.entries(financialSummary.categoryBreakdown || {})
      .map(([name, value]) => ({
        id: name,
        value: Math.abs(value),
        label: name
      }))
      .filter(item => item.value > 0)
      .slice(0, 5); // Mostrar top 5 categorías

    // Datos para gráfico de ingresos/gastos mensuales
    const months = [];
    const income = [];
    const expenses = [];

    // Obtener los últimos 6 meses
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthName = format(date, 'MMM', { locale: es });
      months.push(monthName);

      // Si hay datos para este mes en el resumen, usarlos
      const monthKey = format(date, 'yyyy-MM');
      const monthData = financialSummary.monthlyTotals?.[monthKey] || { income: 0, expenses: 0 };

      income.push(monthData.income || 0);
      expenses.push(Math.abs(monthData.expenses) || 0); // Convertir a positivo para visualización
    }

    return {
      pieData,
      barData: { months, income, expenses }
    };
  };

  const { pieData, barData } = getChartData();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${mode === 'dark' ? 'dark-mode' : ''}`}>
      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Bienvenido, {user?.name?.split(' ')[0] || 'Usuario'}
        </h1>
        <p className="dashboard-subtitle">
          Resumen de tu situación financiera y progresos
        </p>
      </div>

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
            <p className="dashboard-summary-footer">
              en {financialSummary?.accountCount || 0} cuenta(s)
            </p>
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
              <span className="dashboard-summary-icon">
                <i className="fas fa-arrow-up"></i>
              </span>
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
              <span className="dashboard-summary-icon">
                <i className="fas fa-arrow-down"></i>
              </span>
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
              Ingresos y Gastos (Últimos 6 meses)
            </h2>
            <div className="dashboard-chart">
              {barData.months.length > 0 ? (
                <div className="dashboard-chart">
                  {/* Replace with pure CSS/HTML chart or a lightweight chart library */}
                  <div>Chart would be rendered here with pure CSS or a lightweight library</div>
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
              Distribución de Gastos por Categoría
            </h2>
            <div className="dashboard-chart">
              {pieData.length > 0 ? (
                <div className="dashboard-chart">
                  {/* Replace with pure CSS/HTML chart or a lightweight chart library */}
                  <div>Pie chart would be rendered here with pure CSS or a lightweight library</div>
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

      {/* Transacciones recientes y widgets de gamificación */}
      <div className="dashboard-grid">
        {/* Transacciones recientes */}
        <div className="dashboard-col-xs-12 dashboard-col-md-6">
          <div className="dashboard-card dashboard-transactions">
            <div className="dashboard-transactions-header">
              <h2 className="dashboard-transactions-title">
                Transacciones Recientes
              </h2>
              <a
                className="dashboard-transactions-link"
                onClick={() => navigate('/transactions')}
              >
                Ver todas <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            <div className="dashboard-divider"></div>

            {recentTransactions.length > 0 ? (
              <ul className="dashboard-transaction-list">
                {recentTransactions.map((transaction) => (
                  <li key={transaction.id}>
                    <div className="dashboard-transaction-item">
                      <div className={`dashboard-transaction-icon ${transaction.amount > 0 ? 'dashboard-transaction-income' : 'dashboard-transaction-expense'}`}>
                        <i className={`fas ${transaction.amount > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                      </div>
                      <div className="dashboard-transaction-content">
                        <p className="dashboard-transaction-description">{transaction.description}</p>
                        <p className="dashboard-transaction-date">{formatDate(transaction.date)}</p>
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

        {/* Widget de Metas */}
        <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
          <div className="dashboard-card dashboard-transactions">
            <div className="dashboard-goals-header">
              <h2 className="dashboard-goals-title">
                Metas Activas
              </h2>
              <a
                className="dashboard-transactions-link"
                onClick={() => navigate('/goals')}
              >
                Ver todas <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            <div className="dashboard-divider"></div>

            {activeGoals.length > 0 ? (
              <ul className="dashboard-goal-list">
                {activeGoals.map((goal) => (
                  <li key={goal.id} className="dashboard-goal-item">
                    <div className="dashboard-goal-name">
                      <span className="dashboard-goal-icon">
                        <i className="fas fa-flag"></i>
                      </span>
                      {goal.name}
                    </div>
                    <div className="dashboard-goal-info">
                      <span className="dashboard-goal-dates">
                        {formatDate(goal.target_date)}
                      </span>
                      <span className="dashboard-goal-amount">
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                      </span>
                    </div>
                    <div className="dashboard-progress-container">
                      <div
                        className="dashboard-progress-bar"
                        style={{ width: `${calculateProgress(goal)}%` }}
                      ></div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard-empty">
                <p>No tienes metas activas</p>
                <button
                  className="dashboard-button"
                  onClick={() => navigate('/goals/new')}
                >
                  <span className="dashboard-button-icon">
                    <i className="fas fa-plus"></i>
                  </span>
                  Crear Meta
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Widget de Retos Activos */}
        <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
          <div className="dashboard-card dashboard-transactions">
            <div className="dashboard-goals-header">
              <h2 className="dashboard-goals-title">
                Retos Activos
              </h2>
              <a
                className="dashboard-transactions-link"
                onClick={() => navigate('/challenges')}
              >
                Ver todos <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            <div className="dashboard-divider"></div>

            {activeChallenges.length > 0 ? (
              <ul className="dashboard-challenge-list">
                {activeChallenges.map((challenge) => (
                  <li key={challenge.id} className="dashboard-challenge-item">
                    <div className="dashboard-challenge-name">
                      <span className="dashboard-challenge-icon">
                        <i className="fas fa-trophy"></i>
                      </span>
                      {challenge.name}
                    </div>
                    <div className="dashboard-challenge-info">
                      <span className="dashboard-challenge-dates">
                        {formatDate(challenge.end_date)}
                      </span>
                    </div>
                    <div className="dashboard-progress-container">
                      <div
                        className="dashboard-progress-bar"
                        style={{ width: `${getChallengeProgress(challenge)}%` }}
                      ></div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard-empty">
                <p>No estás participando en ningún reto</p>
                <button
                  className="dashboard-button"
                  onClick={() => navigate('/challenges')}
                >
                  <span className="dashboard-button-icon">
                    <i className="fas fa-trophy"></i>
                  </span>
                  Explorar Retos
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Widget de Logros Recientes */}
        <div className="dashboard-col-xs-12 dashboard-col-sm-6 dashboard-col-md-3">
          <div className="dashboard-card dashboard-transactions">
            <div className="dashboard-goals-header">
              <h2 className="dashboard-goals-title">
                Logros Recientes
              </h2>
              <a
                className="dashboard-transactions-link"
                onClick={() => navigate('/achievements')}
              >
                Ver todos <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            <div className="dashboard-divider"></div>

            {recentAchievements.length > 0 ? (
              <ul className="dashboard-achievement-list">
                {recentAchievements.map((achievement) => (
                  <li key={achievement.id} className="dashboard-achievement-item">
                    <div className="dashboard-achievement-icon">
                      <i className="fas fa-award"></i>
                    </div>
                    <div className="dashboard-achievement-content">
                      <h4 className="dashboard-achievement-name">{achievement.name}</h4>
                      <p className="dashboard-achievement-date">Conseguido el {formatDate(achievement.achieved_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard-empty">
                <p>Aún no has conseguido ningún logro</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
