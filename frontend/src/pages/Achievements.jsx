import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle,
  faLock,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './Achievements.css';
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
      <div className="achievements-container achievements-loading">
        <h2 className="achievements-title">Cargando logros...</h2>
        <div className="achievements-loader"></div>
      </div>
    );
  }

  return (
    <div className="achievements-container">
      <div className="achievements-header">
        <h1 className="achievements-title">Mis Logros</h1>
        <p className="achievements-subtitle">
          Descubre y desbloquea logros a medida que mejoras tus finanzas personales.
        </p>
      </div>
      
      {error && (
        <div className="achievements-error">
          {error}
        </div>
      )}
      
      {/* Resumen de Logros */}
      <div className="achievements-summary">
        <div className="achievements-summary-grid">
          <div className="achievements-summary-item">
            <div className="achievements-summary-number primary">
              {stats.earned}
            </div>
            <div className="achievements-summary-text">
              Logros Desbloqueados
            </div>
          </div>
          <div className="achievements-summary-item">
            <div className="achievements-summary-number text-secondary">
              {stats.total}
            </div>
            <div className="achievements-summary-text">
              Logros Totales
            </div>
          </div>
          <div className="achievements-summary-item">
            <div className="achievements-summary-number secondary">
              {stats.completion_percentage}%
            </div>
            <div className="achievements-summary-text">
              Completado
            </div>
          </div>
        </div>
        <div className="achievements-progress-bar">
          <div 
            className="achievements-progress-value" 
            style={{ width: `${stats.completion_percentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Lista de Logros */}
      {achievements.length === 0 ? (
        <div className="achievements-empty">
          <h3 className="achievements-empty-title">
            No hay logros disponibles en este momento.
          </h3>
        </div>
      ) : (
        <div className="achievements-grid">
          {achievements.map((achievement) => {
            const progress = calculateProgress(achievement);
            const isLocked = progress === 0 && !achievement.achieved;
            
            return (
              <div 
                className={`achievements-card ${isLocked ? 'locked' : ''}`}
                key={achievement.id}
              >
                {isLocked && (
                  <div className="achievements-lock-overlay">
                    <FontAwesomeIcon icon={faLock} className="achievements-lock-icon" />
                  </div>
                )}
                
                <img
                  className="achievements-card-image"
                  src={achievement.badge_image || `https://via.placeholder.com/300x140?text=${encodeURIComponent(achievement.name)}`}
                  alt={achievement.name}
                />
                
                <div className="achievements-card-content">
                  <div className="achievements-card-header">
                    <h3 className="achievements-card-title">
                      {achievement.name}
                    </h3>
                    {achievement.achieved && (
                      <span className="achievements-tooltip" data-tooltip="Logro conseguido">
                        <FontAwesomeIcon icon={faCheckCircle} className="achievements-check-icon" />
                      </span>
                    )}
                  </div>
                  
                  <p className="achievements-card-description">
                    {achievement.description}
                  </p>
                  
                  {!isLocked && (
                    <>
                      <div className="achievements-divider"></div>
                      
                      <div className="achievements-progress-container">
                        <div className="achievements-progress-text">
                          <span>Progreso:</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="achievements-progress-bar">
                          <div 
                            className={`achievements-progress-value ${achievement.achieved ? 'success' : ''}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {achievement.achieved && (
                        <p className="achievements-date">
                          <b>Conseguido:</b> {formatDate(achievement.achieved_at)}
                        </p>
                      )}
                    </>
                  )}
                  
                  <div className="achievements-actions">
                    <button 
                      className="achievements-icon-button achievements-tooltip"
                      data-tooltip="Ver detalles"
                      onClick={() => handleOpenDialog(achievement)}
                    >
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Diálogo de detalles del logro */}
      {openDialog && selectedAchievement && (
        <div className="achievements-dialog-backdrop" onClick={handleCloseDialog}>
          <div className="achievements-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="achievements-dialog-title">
              {selectedAchievement.name}
              {selectedAchievement.achieved && (
                <span className="achievements-chip">
                  <span className="achievements-chip-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                  Conseguido
                </span>
              )}
            </div>
            <div className="achievements-dialog-content">
              <img 
                className="achievements-dialog-image"
                src={selectedAchievement.badge_image || `https://via.placeholder.com/200?text=${encodeURIComponent(selectedAchievement.name)}`} 
                alt={selectedAchievement.name}
              />
              
              <p className="achievements-dialog-text">
                {selectedAchievement.description}
              </p>
              
              <h4 className="achievements-dialog-subtitle">
                Detalles del logro:
              </h4>
              
              {(() => {
                const details = getAchievementDetails(selectedAchievement);
                return (
                  <>
                    <p className="achievements-dialog-detail">
                      <b>Requisito:</b> {details.criteria}
                    </p>
                    
                    {!selectedAchievement.achieved && details.current !== undefined && (
                      <p className="achievements-dialog-detail">
                        <b>Progreso actual:</b> {details.current} / {details.target}
                      </p>
                    )}
                    
                    {selectedAchievement.achieved && (
                      <p className="achievements-dialog-detail">
                        <b>Conseguido el:</b> {formatDate(selectedAchievement.achieved_at)}
                      </p>
                    )}
                  </>
                );
              })()}
              
              <div style={{ marginTop: '16px' }}>
                <div className="achievements-progress-text">
                  <span>Progreso:</span>
                  <span>{calculateProgress(selectedAchievement)}%</span>
                </div>
                <div className="achievements-progress-bar">
                  <div 
                    className={`achievements-progress-value ${selectedAchievement.achieved ? 'success' : ''}`}
                    style={{ width: `${calculateProgress(selectedAchievement)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="achievements-dialog-actions">
              <button className="achievements-dialog-button" onClick={handleCloseDialog}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Achievements;
