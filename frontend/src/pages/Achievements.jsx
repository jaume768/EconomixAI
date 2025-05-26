import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  Chip,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  Tooltip,
  IconButton,
  Paper
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getUserAchievements } from '../services/achievementService';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Achievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ total: 0, earned: 0, completion_percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getUserAchievements(user.id);
        setAchievements(response.achievements || []);
        setStats(response.stats || { total: 0, earned: 0, completion_percentage: 0 });
      } catch (error) {
        console.error('Error fetching achievements:', error);
        setError('No se pudieron cargar los logros. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      fetchAchievements();
    }
  }, [user]);

  const handleOpenDialog = (achievement) => {
    setSelectedAchievement(achievement);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const calculateProgress = (achievement) => {
    if (achievement.achieved) return 100;
    
    // Si no está logrado pero tiene progreso
    try {
      if (achievement.progress) {
        const progress = typeof achievement.progress === 'string' 
          ? JSON.parse(achievement.progress) 
          : achievement.progress;
        
        if (progress.current === undefined || progress.target === undefined) return 0;
        return Math.min(100, Math.round((progress.current / progress.target) * 100));
      }
    } catch (e) {
      console.error('Error parsing achievement progress:', e);
    }
    
    return 0;
  };

  const getAchievementDetails = (achievement) => {
    try {
      const criteria = typeof achievement.criteria === 'string' 
        ? JSON.parse(achievement.criteria) 
        : achievement.criteria;
      
      let description = 'Criterio personalizado';
      
      switch (criteria.type) {
        case 'transaction_count':
          description = `Realizar ${criteria.target} transacciones`;
          break;
        case 'savings_amount':
          description = `Ahorrar ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(criteria.target)}`;
          break;
        case 'debt_reduction':
          description = `Reducir deudas en un ${criteria.target}%`;
          break;
        case 'goal_completion':
          description = `Completar ${criteria.target} metas financieras`;
          break;
        case 'expense_reduction':
          description = `Reducir gastos en un ${criteria.target}% respecto al mes anterior`;
          break;
      }
      
      return {
        title: achievement.name,
        description: achievement.description,
        criteria: description,
        current: achievement.progress ? JSON.parse(achievement.progress).current : 0,
        target: criteria.target
      };
    } catch (e) {
      console.error('Error parsing achievement details:', e);
      return {
        title: achievement.name,
        description: achievement.description,
        criteria: 'Información no disponible',
        current: 0,
        target: 0
      };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No obtenido aún';
    
    try {
      return format(new Date(dateString), 'PPP', { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Cargando logros...
        </Typography>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mis Logros
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Descubre y desbloquea logros a medida que mejoras tus finanzas personales.
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Resumen de Logros */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {stats.earned}
              </Typography>
              <Typography variant="body1">
                Logros Desbloqueados
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="text.secondary">
                {stats.total}
              </Typography>
              <Typography variant="body1">
                Logros Totales
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="secondary">
                {stats.completion_percentage}%
              </Typography>
              <Typography variant="body1">
                Completado
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={stats.completion_percentage} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
      </Paper>
      
      {/* Lista de Logros */}
      {achievements.length === 0 ? (
        <Card sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" align="center">
              No hay logros disponibles en este momento.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {achievements.map((achievement) => {
            const progress = calculateProgress(achievement);
            const isLocked = progress === 0 && !achievement.achieved;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    opacity: isLocked ? 0.7 : 1,
                    position: 'relative'
                  }}
                >
                  {isLocked && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 1,
                        borderRadius: 'inherit'
                      }}
                    >
                      <LockIcon sx={{ fontSize: 48, color: 'white' }} />
                    </Box>
                  )}
                  
                  <CardMedia
                    component="img"
                    height="140"
                    image={achievement.badge_image || `https://via.placeholder.com/300x140?text=${encodeURIComponent(achievement.name)}`}
                    alt={achievement.name}
                  />
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div">
                        {achievement.name}
                      </Typography>
                      {achievement.achieved && (
                        <Tooltip title="Logro conseguido">
                          <CheckCircleIcon color="success" />
                        </Tooltip>
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {achievement.description}
                    </Typography>
                    
                    {!isLocked && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Progreso:</span>
                            <span>{progress}%</span>
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            color={achievement.achieved ? "success" : "primary"}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        
                        {achievement.achieved && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <b>Conseguido:</b> {formatDate(achievement.achieved_at)}
                          </Typography>
                        )}
                      </>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(achievement)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      
      {/* Diálogo de detalles del logro */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedAchievement && (
          <>
            <DialogTitle>
              {selectedAchievement.name}
              {selectedAchievement.achieved && (
                <Chip 
                  label="Conseguido" 
                  color="success" 
                  size="small" 
                  icon={<CheckCircleIcon />} 
                  sx={{ ml: 1 }}
                />
              )}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <img 
                  src={selectedAchievement.badge_image || `https://via.placeholder.com/200?text=${encodeURIComponent(selectedAchievement.name)}`} 
                  alt={selectedAchievement.name}
                  style={{ maxWidth: '200px', maxHeight: '200px' }}
                />
              </Box>
              
              <DialogContentText paragraph>
                {selectedAchievement.description}
              </DialogContentText>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Detalles del logro:
                </Typography>
                
                {(() => {
                  const details = getAchievementDetails(selectedAchievement);
                  return (
                    <>
                      <Typography variant="body2" paragraph>
                        <b>Requisito:</b> {details.criteria}
                      </Typography>
                      
                      {!selectedAchievement.achieved && details.current !== undefined && (
                        <Typography variant="body2" paragraph>
                          <b>Progreso actual:</b> {details.current} / {details.target}
                        </Typography>
                      )}
                      
                      {selectedAchievement.achieved && (
                        <Typography variant="body2" paragraph>
                          <b>Conseguido el:</b> {formatDate(selectedAchievement.achieved_at)}
                        </Typography>
                      )}
                    </>
                  );
                })()}
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Progreso: {calculateProgress(selectedAchievement)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculateProgress(selectedAchievement)} 
                    color={selectedAchievement.achieved ? "success" : "primary"}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Achievements;
