import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button, 
  LinearProgress,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getChallenges, getUserChallenges, joinChallenge, leaveChallenge } from '../services/challengeService';
import { useAuth } from '../context/AuthContext';
import { format, isBefore, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const Challenges = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [myChallenges, setMyChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Para el diálogo de confirmación
  const [confirmAction, setConfirmAction] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener retos disponibles
        const availableResponse = await getChallenges();
        setAvailableChallenges(availableResponse.challenges || []);
        
        // Obtener retos del usuario
        const userResponse = await getUserChallenges(user.id);
        setMyChallenges(userResponse.challenges || []);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        setError('No se pudieron cargar los retos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      fetchChallenges();
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (challenge) => {
    setSelectedChallenge(challenge);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleJoinChallenge = async () => {
    if (!selectedChallenge) return;
    
    try {
      const response = await joinChallenge(user.id, selectedChallenge.id);
      
      // Actualizar las listas de retos
      setMyChallenges([...myChallenges, response.challenge]);
      setAvailableChallenges(availableChallenges.filter(c => c.id !== selectedChallenge.id));
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error joining challenge:', error);
      setError('No se pudo unirse al reto. Por favor, intenta de nuevo.');
    }
  };

  const handleOpenConfirmLeave = (challenge) => {
    setSelectedChallenge(challenge);
    setConfirmAction('leave');
    setOpenConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedChallenge) return;
    
    try {
      if (confirmAction === 'leave') {
        await leaveChallenge(user.id, selectedChallenge.id);
        
        // Actualizar las listas de retos
        setMyChallenges(myChallenges.filter(c => c.id !== selectedChallenge.id));
        
        // Verificar si el reto sigue activo para añadirlo a los disponibles
        if (selectedChallenge.active) {
          setAvailableChallenges([...availableChallenges, selectedChallenge]);
        }
      }
      
      setOpenConfirmDialog(false);
    } catch (error) {
      console.error('Error performing action:', error);
      setError(`No se pudo ${confirmAction === 'leave' ? 'abandonar' : 'completar'} el reto. Por favor, intenta de nuevo.`);
    }
  };

  const calculateProgress = (challenge) => {
    if (!challenge.progress) return 0;
    
    try {
      const progress = typeof challenge.progress === 'string' 
        ? JSON.parse(challenge.progress) 
        : challenge.progress;
      
      if (progress.complete) return 100;
      if (progress.current === undefined || progress.target === undefined) return 0;
      
      return Math.min(100, Math.round((progress.current / progress.target) * 100));
    } catch (e) {
      console.error('Error parsing challenge progress:', e);
      return 0;
    }
  };

  const getChallengeStatus = (challenge) => {
    if (!challenge) return { label: 'Desconocido', color: 'default' };
    
    try {
      // Verificar si ya está completado
      const progress = typeof challenge.progress === 'string' 
        ? JSON.parse(challenge.progress) 
        : challenge.progress;
      
      if (progress && progress.complete) {
        return { label: 'Completado', color: 'success' };
      }
      
      // Verificar si ha expirado
      const endDate = parseISO(challenge.end_date);
      if (isBefore(endDate, new Date())) {
        return { label: 'Expirado', color: 'error' };
      }
      
      // En progreso
      return { label: 'En progreso', color: 'primary' };
    } catch (e) {
      console.error('Error getting challenge status:', e);
      return { label: 'Error', color: 'error' };
    }
  };

  const getRemainingDays = (endDateStr) => {
    try {
      const endDate = parseISO(endDateStr);
      const today = new Date();
      
      if (isBefore(endDate, today)) {
        return 'Expirado';
      }
      
      const days = differenceInDays(endDate, today);
      return days === 1 ? '1 día' : `${days} días`;
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const formatCriteria = (criteriaStr) => {
    try {
      const criteria = typeof criteriaStr === 'string' 
        ? JSON.parse(criteriaStr) 
        : criteriaStr;
      
      switch (criteria.type) {
        case 'save_amount':
          return `Ahorrar ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(criteria.target)}`;
        case 'reduce_expenses':
          return `Reducir gastos a menos de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(criteria.target)}`;
        default:
          return 'Criterio personalizado';
      }
    } catch (e) {
      return 'Criterio no disponible';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Cargando retos...
        </Typography>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Retos Financieros
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Participa en retos financieros para mejorar tus hábitos y recibir recompensas.
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Mis Retos" />
          <Tab label="Retos Disponibles" />
        </Tabs>
      </Paper>
      
      {/* Panel de Mis Retos */}
      {tabValue === 0 && (
        <>
          {myChallenges.length === 0 ? (
            <Card sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" align="center">
                  No estás participando en ningún reto actualmente.
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  Explora los retos disponibles y únete para mejorar tus finanzas.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => setTabValue(1)}
                  >
                    Ver Retos Disponibles
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {myChallenges.map((challenge) => {
                const status = getChallengeStatus(challenge);
                const progress = calculateProgress(challenge);
                
                return (
                  <Grid item xs={12} md={6} lg={4} key={challenge.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div">
                            {challenge.name}
                          </Typography>
                          <Chip 
                            label={status.label} 
                            size="small" 
                            color={status.color}
                            icon={status.label === 'Completado' 
                              ? <CheckCircleIcon /> 
                              : status.label === 'Expirado' 
                                ? <CancelIcon /> 
                                : <TimerIcon />
                            }
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {challenge.description}
                        </Typography>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <b>Objetivo:</b> {formatCriteria(challenge.criteria)}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          <b>Fecha límite:</b> {format(parseISO(challenge.end_date), 'PPP', { locale: es })}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          <b>Tiempo restante:</b> {getRemainingDays(challenge.end_date)}
                        </Typography>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Progreso: {progress}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            color={status.color}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleOpenConfirmLeave(challenge)}
                        >
                          Abandonar
                        </Button>
                        <Box sx={{ flexGrow: 1 }} />
                        <Tooltip title="Ver detalles">
                          <IconButton 
                            size="small"
                            onClick={() => handleOpenDialog(challenge)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}
      
      {/* Panel de Retos Disponibles */}
      {tabValue === 1 && (
        <>
          {availableChallenges.length === 0 ? (
            <Card sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" align="center">
                  No hay retos disponibles en este momento.
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  Revisa más tarde para ver nuevos retos.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {availableChallenges.map((challenge) => (
                <Grid item xs={12} md={6} lg={4} key={challenge.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="div">
                          {challenge.name}
                        </Typography>
                        <TrophyIcon color="primary" />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {challenge.description}
                      </Typography>
                      
                      <Divider sx={{ my: 1.5 }} />
                      
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <b>Objetivo:</b> {formatCriteria(challenge.criteria)}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <b>Duración:</b> {differenceInDays(parseISO(challenge.end_date), parseISO(challenge.start_date))} días
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <b>Fecha inicio:</b> {format(parseISO(challenge.start_date), 'PPP', { locale: es })}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <b>Fecha fin:</b> {format(parseISO(challenge.end_date), 'PPP', { locale: es })}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small"
                        variant="contained"
                        onClick={() => handleOpenDialog(challenge)}
                        fullWidth
                      >
                        Unirse al Reto
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* Diálogo de detalles del reto */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedChallenge && (
          <>
            <DialogTitle>
              {selectedChallenge.name}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                {selectedChallenge.description}
              </DialogContentText>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Detalles del reto:
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <b>Objetivo:</b> {formatCriteria(selectedChallenge.criteria)}
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <b>Periodo:</b> Del {format(parseISO(selectedChallenge.start_date), 'PPP', { locale: es })} al {format(parseISO(selectedChallenge.end_date), 'PPP', { locale: es })}
                </Typography>
                
                {/* Mostrar progreso si es un reto del usuario */}
                {myChallenges.some(c => c.id === selectedChallenge.id) && (
                  <>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Tu progreso:
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {calculateProgress(selectedChallenge)}% completado
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateProgress(selectedChallenge)} 
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cerrar</Button>
              {/* Si no está en mis retos, mostrar botón para unirse */}
              {!myChallenges.some(c => c.id === selectedChallenge.id) && (
                <Button onClick={handleJoinChallenge} variant="contained" autoFocus>
                  Unirse
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Diálogo de confirmación para abandonar reto */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>
          {confirmAction === 'leave' ? '¿Abandonar reto?' : '¿Completar reto?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'leave' ? 
              '¿Estás seguro de que deseas abandonar este reto? Perderás todo el progreso que has logrado hasta ahora.' : 
              '¿Estás seguro de que has completado este reto? Se verificará tu progreso.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained" 
            color={confirmAction === 'leave' ? 'error' : 'success'}
            autoFocus
          >
            {confirmAction === 'leave' ? 'Abandonar' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Challenges;
