import { useState, useEffect } from 'react';
import { getUserGoals, createGoal, updateGoal, deleteGoal } from '../services/goalService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './css/Goals.css';

const goalTypes = [
  { value: 'ahorro', label: 'Ahorro' },
  { value: 'compra', label: 'Compra' },
  { value: 'viaje', label: 'Viaje' },
  { value: 'jubilacion', label: 'Jubilación' }
];

const Goals = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
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
          goal.id === editingGoal.id ? { ...response.goal } : goal
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
      <div className="goals-container">
        <div className="goals-loading">
          <h2>Cargando metas...</h2>
          <div className="goals-loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`goals-container ${mode === 'dark' ? 'dark-mode' : ''}`}>
      <div className="goals-header">
        <h1 className="goals-title">
          Mis Metas Financieras
        </h1>
        <button
          className="goals-button"
          onClick={() => handleOpenDialog()}
        >
          <span className="goals-button-icon">
            <i className="fas fa-plus"></i>
          </span>
          Nueva Meta
        </button>
      </div>

      {error && (
        <div className="goals-error">
          {error}
        </div>
      )}

      {goals.length === 0 ? (
        <div className="goals-empty">
          <h3 className="goals-empty-title">
            No tienes metas financieras configuradas.
          </h3>
          <p className="goals-empty-text">
            ¡Crea tu primera meta para comenzar a alcanzar tus objetivos financieros!
          </p>
          <button
            className="goals-button"
            onClick={() => handleOpenDialog()}
          >
            <span className="goals-button-icon">
              <i className="fas fa-plus"></i>
            </span>
            Crear Meta
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => (
            <div className="goals-card" key={goal.id}>
              <div className="goals-card-content">
                <div className="goals-card-header">
                  <h3 className="goals-card-title">
                    {goal.description || `Meta de ${getGoalTypeLabel(goal.goal_type)}`}
                  </h3>
                  <span className={`goals-chip ${goal.completed ? "goals-chip-success" : ""}`}>
                    {getGoalTypeLabel(goal.goal_type)}
                  </span>
                </div>

                <div className="goals-info">
                  <p className="goals-info-text">
                    Objetivo: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(goal.target_amount)}
                  </p>
                  <p className="goals-info-text">
                    Progreso actual: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(goal.current_amount)}
                  </p>
                  <p className="goals-info-text">
                    Fecha objetivo: {format(new Date(goal.target_date), 'PPP', { locale: es })}
                  </p>
                </div>

                <div className="goals-progress">
                  <div className="goals-progress-text">
                    <span>Progreso:</span>
                    <span>{calculateProgress(goal)}%</span>
                  </div>
                  <div className="goals-progress-bar">
                    <div
                      className={`goals-progress-value ${goal.completed ? "goals-progress-value-completed" : ""}`}
                      style={{ width: `${calculateProgress(goal)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="goals-card-actions">
                <div className="goals-tooltip" data-tooltip="Editar">
                  <button className="goals-icon-button" onClick={() => handleOpenDialog(goal)}>
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
                <div className="goals-tooltip" data-tooltip="Eliminar">
                  <button className="goals-icon-button" onClick={() => handleDeleteGoal(goal.id)}>
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
                <div className="goals-spacer"></div>
                <div className="goals-tooltip" data-tooltip="Ver detalles">
                  <button className="goals-icon-button">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diálogo de creación/edición de meta */}
      {openDialog && (
        <div className="goals-dialog-backdrop" onClick={handleCloseDialog}>
          <div className="goals-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="goals-dialog-title">
              {editingGoal ? 'Editar Meta' : 'Nueva Meta'}
            </div>
            <div className="goals-dialog-content">
              <form noValidate>
                <div className="goals-form-group">
                  <label className="goals-form-label" htmlFor="goal_type">Tipo de Meta</label>
                  <div className="goals-select-wrapper">
                    <select
                      className="goals-select"
                      id="goal_type"
                      name="goal_type"
                      value={formData.goal_type}
                      onChange={handleChange}
                    >
                      {goalTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <span className="goals-select-arrow">
                      <i className="fas fa-chevron-down"></i>
                    </span>
                  </div>
                </div>

                <div className="goals-form-group">
                  <label className="goals-form-label" htmlFor="target_amount">Monto Objetivo (€)*</label>
                  <input
                    className={`goals-input ${formErrors.target_amount ? 'error' : ''}`}
                    id="target_amount"
                    name="target_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={handleChange}
                  />
                  {formErrors.target_amount && (
                    <div className="goals-error-text">{formErrors.target_amount}</div>
                  )}
                </div>

                <div className="goals-form-group">
                  <label className="goals-form-label" htmlFor="target_date">Fecha Objetivo*</label>
                  <input
                    className={`goals-input ${formErrors.target_date ? 'error' : ''}`}
                    id="target_date"
                    name="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={handleChange}
                  />
                  {formErrors.target_date && (
                    <div className="goals-error-text">{formErrors.target_date}</div>
                  )}
                </div>

                <div className="goals-form-group">
                  <label className="goals-form-label" htmlFor="description">Descripción</label>
                  <textarea
                    className={`goals-input ${formErrors.description ? 'error' : ''}`}
                    id="description"
                    name="description"
                    rows="2"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                  {formErrors.description && (
                    <div className="goals-error-text">{formErrors.description}</div>
                  )}
                </div>
              </form>
            </div>
            <div className="goals-dialog-actions">
              <button className="goals-cancel-button" onClick={handleCloseDialog}>Cancelar</button>
              <button className="goals-submit-button" onClick={handleSubmit}>
                {editingGoal ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
