import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  AccountBalance as AccountIcon,
  Savings as SavingsIcon,
  CreditCard as CreditCardIcon,
  Flag as FlagIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getTransactionSummary, getRecentTransactions } from '../services/transactionService';
import { getUserGoals } from '../services/goalService';
import { getUserChallenges } from '../services/challengeService';
import { getUserAchievements } from '../services/achievementService';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { format, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        
        // Cargar datos en paralelo
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
        
        // Actualizar estados con los datos obtenidos
        setFinancialSummary(summaryResponse.summary || {});
        setRecentTransactions(transactionsResponse.transactions || []);
        setGoals(goalsResponse.goals || []);
        setChallenges(challengesResponse.challenges || []);
        setAchievements(
          (achievementsResponse.achievements || []).filter(a => a.achieved)
        );
        
        // Procesar datos para widgets
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bienvenido, {user?.name?.split(' ')[0] || 'Usuario'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Resumen de tu situación financiera y progresos
        </Typography>
      </Box>
      
      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'primary.light',
              color: 'primary.contrastText'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Balance Total
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              {formatCurrency(financialSummary?.totalBalance || 0)}
            </Typography>
            <Typography variant="body2">
              en {financialSummary?.accountCount || 0} cuenta(s)
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'success.light',
              color: 'success.contrastText'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Ingresos (Este mes)
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              {formatCurrency(financialSummary?.currentMonthIncome || 0)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ArrowUpIcon fontSize="small" />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {financialSummary?.incomeChangePercentage > 0 ? '+' : ''}
                {financialSummary?.incomeChangePercentage || 0}% vs. mes anterior
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'error.light',
              color: 'error.contrastText'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Gastos (Este mes)
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              {formatCurrency(Math.abs(financialSummary?.currentMonthExpenses || 0))}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ArrowDownIcon fontSize="small" />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {financialSummary?.expenseChangePercentage > 0 ? '+' : ''}
                {financialSummary?.expenseChangePercentage || 0}% vs. mes anterior
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'warning.light',
              color: 'warning.contrastText'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Deuda Total
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              {formatCurrency(financialSummary?.totalDebt || 0)}
            </Typography>
            <Typography variant="body2">
              {financialSummary?.debtCount || 0} deuda(s) activa(s)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Ingresos y Gastos (Últimos 6 meses)
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              {barData.months.length > 0 ? (
                <BarChart
                  series={[
                    { data: barData.income, label: 'Ingresos', color: '#4caf50' },
                    { data: barData.expenses, label: 'Gastos', color: '#f44336' }
                  ]}
                  xAxis={[{ data: barData.months, scaleType: 'band' }]}
                  height={300}
                />
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay datos suficientes para mostrar
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Distribución de Gastos por Categoría
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              {pieData.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: pieData,
                      innerRadius: 60,
                      outerRadius: 130,
                      paddingAngle: 2,
                      cornerRadius: 5,
                      startAngle: -90,
                      endAngle: 270,
                      cx: 150,
                      cy: 150
                    }
                  ]}
                  height={300}
                  slotProps={{
                    legend: { hidden: true }
                  }}
                />
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay datos suficientes para mostrar
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Transacciones recientes y widgets de gamificación */}
      <Grid container spacing={3}>
        {/* Transacciones recientes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Transacciones Recientes
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/transactions')}
              >
                Ver todas
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {recentTransactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No hay transacciones recientes
              </Typography>
            ) : (
              <List>
                {recentTransactions.map((transaction) => (
                  <ListItem 
                    key={transaction.id}
                    secondaryAction={
                      <Typography variant={transaction.type === 'ingreso' ? 'body2' : 'body2'} color={transaction.type === 'ingreso' ? 'success.main' : 'error.main'}>
                        {transaction.type === 'ingreso' ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
                      </Typography>
                    }
                  >
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: transaction.type === 'ingreso' ? 'success.light' : 'error.light',
                          width: 40,
                          height: 40
                        }}
                      >
                        {transaction.type === 'ingreso' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={transaction.description || `${transaction.type === 'ingreso' ? 'Ingreso' : 'Gasto'}`}
                      secondary={formatDate(transaction.date)}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/transactions')}
              >
                Nueva Transacción
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Widget de Metas */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Metas Activas
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/goals')}
              >
                Ver todas
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {activeGoals.length === 0 ? (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No tienes metas activas
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<FlagIcon />}
                  onClick={() => navigate('/goals')}
                >
                  Crear Meta
                </Button>
              </Box>
            ) : (
              <List>
                {activeGoals.map((goal) => {
                  const progress = calculateProgress(goal);
                  
                  return (
                    <ListItem key={goal.id} sx={{ px: 0 }}>
                      <Card sx={{ width: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1">
                              {goal.description || `Meta de ${goal.goal_type}`}
                            </Typography>
                            <Chip 
                              label={goal.goal_type} 
                              size="small" 
                              color="primary"
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {progress}%
                            </Typography>
                          </Box>
                          
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </CardContent>
                      </Card>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Widget de Retos Activos */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Retos Activos
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/challenges')}
              >
                Ver todos
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {activeChallenges.length === 0 ? (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No estás participando en ningún reto
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<TrophyIcon />}
                  onClick={() => navigate('/challenges')}
                >
                  Explorar Retos
                </Button>
              </Box>
            ) : (
              <List>
                {activeChallenges.map((challenge) => {
                  const progress = getChallengeProgress(challenge);
                  
                  return (
                    <ListItem key={challenge.id} sx={{ px: 0 }}>
                      <Card sx={{ width: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {challenge.name}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Finaliza: {formatDate(challenge.end_date)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {progress}%
                            </Typography>
                          </Box>
                          
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </CardContent>
                      </Card>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Widget de Logros Recientes */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Logros Recientes
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/achievements')}
              >
                Ver todos
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {recentAchievements.length === 0 ? (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Aún no has desbloqueado ningún logro
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/achievements')}
                >
                  Ver Logros Disponibles
                </Button>
              </Box>
            ) : (
              <List>
                {recentAchievements.map((achievement) => (
                  <ListItem key={achievement.id}>
                    <ListItemIcon>
                      {achievement.badge_image ? (
                        <Avatar 
                          src={achievement.badge_image} 
                          alt={achievement.name}
                          sx={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <Avatar 
                          sx={{ bgcolor: 'secondary.light', width: 40, height: 40 }}
                        >
                          <TrophyIcon />
                        </Avatar>
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={achievement.name}
                      secondary={`Conseguido el ${formatDate(achievement.achieved_at)}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
