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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { getUserGoals, createGoal, updateGoal, deleteGoal } from '../services/goalService';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const goalTypes = [
  { value: 'ahorro', label: 'Ahorro' },
  { value: 'compra', label: 'Compra' },
  { value: 'viaje', label: 'Viaje' },
  { value: 'jubilacion', label: 'Jubilación' }
];

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    goal_type: 'ahorro',
    target_amount: '',
    target_date: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoading(true);
        const response = await getUserGoals(user.id);
        setGoals(response.goals || []);
      } catch (error) {
        console.error('Error fetching goals:', error);
        setError('No se pudieron cargar las metas. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      fetchGoals();
    }
  }, [user]);

  const handleOpenDialog = (goal = null) => {
    if (goal) {
      // Editar meta existente
      setFormData({
        goal_type: goal.goal_type,
        target_amount: goal.target_amount.toString(),
        target_date: goal.target_date.split('T')[0], // Formato YYYY-MM-DD
        description: goal.description || ''
      });
      setEditingGoal(goal);
    } else {
      // Nueva meta
      setFormData({
        goal_type: 'ahorro',
        target_amount: '',
        target_date: '',
        description: ''
      });
      setEditingGoal(null);
    }
    setOpenDialog(true);
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.target_amount) {
      errors.target_amount = 'El monto objetivo es obligatorio';
    } else if (isNaN(formData.target_amount) || parseFloat(formData.target_amount) <= 0) {
      errors.target_amount = 'El monto debe ser un número positivo';
    }

    if (!formData.target_date) {
      errors.target_date = 'La fecha objetivo es obligatoria';
    } else {
      const selectedDate = new Date(formData.target_date);
      const today = new Date();
      if (selectedDate <= today) {
        errors.target_date = 'La fecha debe ser posterior a hoy';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      // Preparar datos
      const goalData = {
        ...formData,
        target_amount: parseFloat(formData.target_amount)
      };
      
      let response;
      if (editingGoal) {
        // Actualizar meta existente
        response = await updateGoal(user.id, editingGoal.id, goalData);
        // Actualizar el estado local
        setGoals(goals.map(goal => 
          goal.id === editingGoal.id ? {...response.goal} : goal
        ));
      } else {
        // Crear nueva meta
        response = await createGoal(user.id, goalData);
        // Añadir la nueva meta al estado local
        setGoals([...goals, response.goal]);
      }
      
      // Cerrar diálogo
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('No se pudo guardar la meta. Por favor, intenta de nuevo.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta meta?')) {
      try {
        await deleteGoal(user.id, goalId);
        // Actualizar estado local
        setGoals(goals.filter(goal => goal.id !== goalId));
      } catch (error) {
        console.error('Error deleting goal:', error);
        setError('No se pudo eliminar la meta. Por favor, intenta de nuevo.');
      }
    }
  };

  const calculateProgress = (goal) => {
    return Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  };

  const getGoalTypeLabel = (type) => {
    const goalType = goalTypes.find(gt => gt.value === type);
    return goalType ? goalType.label : type;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Cargando metas...
        </Typography>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mis Metas Financieras
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Meta
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {goals.length === 0 ? (
        <Card sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" align="center">
              No tienes metas financieras configuradas.
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 1 }}>
              ¡Crea tu primera meta para comenzar a alcanzar tus objetivos financieros!
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Crear Meta
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {goals.map((goal) => (
            <Grid item xs={12} md={6} lg={4} key={goal.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div">
                      {goal.description || `Meta de ${getGoalTypeLabel(goal.goal_type)}`}
                    </Typography>
                    <Chip 
                      label={getGoalTypeLabel(goal.goal_type)} 
                      size="small" 
                      color={goal.completed ? "success" : "primary"}
                    />
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Objetivo: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(goal.target_amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Progreso actual: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(goal.current_amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fecha objetivo: {format(new Date(goal.target_date), 'PPP', { locale: es })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Progreso: {calculateProgress(goal)}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateProgress(goal)} 
                      color={goal.completed ? "success" : "primary"}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => handleOpenDialog(goal)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" onClick={() => handleDeleteGoal(goal.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Ver detalles">
                    <IconButton size="small">
                      <ChevronRightIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Diálogo de creación/edición de meta */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nueva Meta'}</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="goal-type-label">Tipo de Meta</InputLabel>
              <Select
                labelId="goal-type-label"
                id="goal_type"
                name="goal_type"
                value={formData.goal_type}
                onChange={handleChange}
                label="Tipo de Meta"
              >
                {goalTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="target_amount"
              label="Monto Objetivo (€)"
              name="target_amount"
              type="number"
              inputProps={{ min: "0", step: "0.01" }}
              value={formData.target_amount}
              onChange={handleChange}
              error={!!formErrors.target_amount}
              helperText={formErrors.target_amount}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="target_date"
              label="Fecha Objetivo"
              name="target_date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.target_date}
              onChange={handleChange}
              error={!!formErrors.target_date}
              helperText={formErrors.target_date}
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Descripción"
              name="description"
              multiline
              rows={2}
              value={formData.description}
              onChange={handleChange}
              error={!!formErrors.description}
              helperText={formErrors.description}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingGoal ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Goals;
