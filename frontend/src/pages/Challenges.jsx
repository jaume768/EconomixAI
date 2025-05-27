import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle,
  faClock,
  faTimes,
  faTrophy,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './Challenges.css';
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
      <div className="challenges-container challenges-loading">
        <h2 className="challenges-title">Cargando retos...</h2>
        <div className="challenges-loader"></div>
      </div>
    );
  }

  return (
    <div className="challenges-container">
      <div className="challenges-header">
        <h1 className="challenges-title">Retos Financieros</h1>
        <p className="challenges-subtitle">
          Participa en retos financieros para mejorar tus hábitos y recibir recompensas.
        </p>
      </div>
      
      {error && (
        <div className="challenges-error">
          {error}
        </div>
      )}
      
      <div className="challenges-tabs-container">
        <div className="challenges-tabs">
          <button 
            className={`challenges-tab ${tabValue === 0 ? 'active' : ''}`}
            onClick={(e) => handleTabChange(e, 0)}
          >
            Mis Retos
          </button>
          <button 
            className={`challenges-tab ${tabValue === 1 ? 'active' : ''}`}
            onClick={(e) => handleTabChange(e, 1)}
          >
            Retos Disponibles
          </button>
        </div>
      </div>
      
      {/* Panel de Mis Retos */}
      {tabValue === 0 && (
        <>
          {myChallenges.length === 0 ? (
            <div className="challenges-empty">
              <h3 className="challenges-empty-title">
                No estás participando en ningún reto actualmente.
              </h3>
              <p className="challenges-empty-text">
                Explora los retos disponibles y únete para mejorar tus finanzas.
              </p>
              <button 
                className="challenges-button" 
                onClick={() => setTabValue(1)}
              >
                Ver Retos Disponibles
              </button>
            </div>
          ) : (
            <div className="challenges-grid">
              {myChallenges.map((challenge) => {
                const status = getChallengeStatus(challenge);
                const progress = calculateProgress(challenge);
                
                return (
                  <div className="challenges-card" key={challenge.id}>
                    <div className="challenges-card-content">
                      <div className="challenges-card-header">
                        <h3 className="challenges-card-title">
                          {challenge.name}
                        </h3>
                        <span 
                          className={`challenges-chip challenges-chip-${status.color}`}
                        >
                          <span className="challenges-chip-icon">
                            <FontAwesomeIcon 
                              icon={
                                status.label === 'Completado' 
                                  ? faCheckCircle 
                                  : status.label === 'Expirado' 
                                    ? faTimes 
                                    : faClock
                              }
                            />
                          </span>
                          {status.label}
                        </span>
                      </div>
                      
                      <p className="challenges-description">
                        {challenge.description}
                      </p>
                      
                      <div className="challenges-divider"></div>
                      
                      <p className="challenges-info-text">
                        <b>Objetivo:</b> {formatCriteria(challenge.criteria)}
                      </p>
                      
                      <p className="challenges-info-text">
                        <b>Fecha límite:</b> {format(parseISO(challenge.end_date), 'PPP', { locale: es })}
                      </p>
                      
                      <p className="challenges-info-text">
                        <b>Tiempo restante:</b> {getRemainingDays(challenge.end_date)}
                      </p>
                      
                      <div style={{ marginTop: '16px' }}>
                        <div className="challenges-progress-text">
                          <span>Progreso</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="challenges-progress-bar">
                          <div 
                            className={`challenges-progress-value challenges-progress-value-${status.color}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="challenges-card-actions">
                      <button 
                        className="challenges-button-outlined"
                        onClick={() => handleOpenConfirmLeave(challenge)}
                      >
                        Abandonar
                      </button>
                      <span className="challenges-spacer"></span>
                      <button 
                        className="challenges-icon-button challenges-tooltip"
                        data-tooltip="Ver detalles"
                        onClick={() => handleOpenDialog(challenge)}
                      >
                        <FontAwesomeIcon icon={faInfoCircle} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    
    {/* Panel de Retos Disponibles */}
    {tabValue === 1 && (
      <>
        {availableChallenges.length === 0 ? (
          <div className="challenges-empty">
            <h3 className="challenges-empty-title">
              No hay retos disponibles en este momento.
            </h3>
            <p className="challenges-empty-text">
              Revisa más tarde para ver nuevos retos.
            </p>
          </div>
        ) : (
          <div className="challenges-grid">
            {availableChallenges.map((challenge) => (
              <div className="challenges-card" key={challenge.id}>
                <div className="challenges-card-content">
                  <div className="challenges-card-header">
                    <h3 className="challenges-card-title">
                      {challenge.name}
                    </h3>
                    <span className="challenges-trophy-icon">
                      <FontAwesomeIcon icon={faTrophy} />
                    </span>
                  </div>
                  
                  <p className="challenges-description">
                    {challenge.description}
                  </p>
                  
                  <div className="challenges-divider"></div>
                  
                  <p className="challenges-info-text">
                    <b>Objetivo:</b> {formatCriteria(challenge.criteria)}
                  </p>
                  
                  <p className="challenges-info-text">
                    <b>Duración:</b> {differenceInDays(parseISO(challenge.end_date), parseISO(challenge.start_date))} días
                  </p>
                  
                  <p className="challenges-info-text">
                    <b>Fecha límite:</b> {format(parseISO(challenge.end_date), 'PPP', { locale: es })}
                  </p>
                </div>
                <div className="challenges-card-actions">
                  <button 
                    className="challenges-button"
                    onClick={() => handleOpenDialog(challenge)}
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}
    
    {/* Dialog para ver detalles del reto y unirse */}
    {openDialog && (
      <div className="challenges-dialog-backdrop" onClick={handleCloseDialog}>
        <div className="challenges-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="challenges-dialog-title">
            {selectedChallenge?.name}
          </div>
          <div className="challenges-dialog-content">
            <p className="challenges-dialog-text">
              {selectedChallenge?.description}
            </p>
            
            <h4>Detalles del Reto</h4>
            
            <p className="challenges-info-text">
              <b>Objetivo:</b> {selectedChallenge ? formatCriteria(selectedChallenge.criteria) : ''}
            </p>
            
            <p className="challenges-info-text">
              <b>Fecha de inicio:</b> {selectedChallenge ? format(parseISO(selectedChallenge.start_date), 'PPP', { locale: es }) : ''}
            </p>
            
            <p className="challenges-info-text">
              <b>Fecha límite:</b> {selectedChallenge ? format(parseISO(selectedChallenge.end_date), 'PPP', { locale: es }) : ''}
            </p>
            
            <p className="challenges-info-text">
              <b>Duración:</b> {selectedChallenge ? differenceInDays(parseISO(selectedChallenge.end_date), parseISO(selectedChallenge.start_date)) : ''} días
            </p>
            
            {myChallenges.some(c => c.id === selectedChallenge?.id) && (
              <p className="challenges-info-text">
                <b>Progreso:</b> {selectedChallenge ? calculateProgress(selectedChallenge) : 0}%
              </p>
            )}
            
            <h4>Recompensas</h4>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '16px' }}>
              {selectedChallenge?.rewards && Array.isArray(selectedChallenge.rewards) && 
                selectedChallenge.rewards.map((reward, index) => (
                  <span 
                    key={index}
                    className="challenges-reward-chip"
                  >
                    {reward.description}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="challenges-dialog-actions">
            <button className="challenges-cancel-button" onClick={handleCloseDialog}>
              Cerrar
            </button>
            {!myChallenges.some(c => c.id === selectedChallenge?.id) && (
              <button className="challenges-submit-button" onClick={handleJoinChallenge}>
                Unirse al Reto
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    
    {/* Dialog de confirmación para abandonar reto */}
    {openConfirmDialog && (
      <div className="challenges-dialog-backdrop" onClick={() => setOpenConfirmDialog(false)}>
        <div className="challenges-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="challenges-dialog-title">
            Confirmar acción
          </div>
          <div className="challenges-dialog-content">
            <p className="challenges-dialog-text">
              {confirmAction === 'leave' 
                ? '¿Estás seguro de que quieres abandonar este reto? Perderás todo el progreso realizado.'
                : '¿Estás seguro de que quieres realizar esta acción?'
              }
            </p>
          </div>
          <div className="challenges-dialog-actions">
            <button className="challenges-cancel-button" onClick={() => setOpenConfirmDialog(false)}>
              Cancelar
            </button>
            <button className="challenges-submit-button" onClick={handleConfirmAction}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default Challenges;
