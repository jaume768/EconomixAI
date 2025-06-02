import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './css/ConnectBank.css';
import { FaLink, FaExclamationCircle, FaCheckCircle, FaSync } from 'react-icons/fa';
import * as tinkService from '../services/tinkService';

function ConnectBank() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tinkUrl, setTinkUrl] = useState('');
  const [connections, setConnections] = useState([]);

  // Obtener las conexiones existentes y un nuevo link de Tink
  useEffect(() => {
    const fetchTinkData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Obtener las conexiones existentes
        const connectionsResponse = await tinkService.getConnections();
        if (connectionsResponse && connectionsResponse.connections) {
          setConnections(connectionsResponse.connections);
        }
        
        // Obtener un nuevo link de autorización
        const linkResponse = await tinkService.getAuthorizationLink();
        if (linkResponse && linkResponse.url) {
          setTinkUrl(linkResponse.url);
        } else {
          setError('No se pudo obtener el enlace de conexión');
        }
        
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError('Error al cargar los datos de conexión: ' + (err.response?.data?.message || err.message));
        console.error('Error:', err);
      }
    };

    fetchTinkData();
  }, []);  // Ya no necesitamos el token como dependencia

  const handleConnectClick = () => {
    if (tinkUrl) {
      window.location.href = tinkUrl;
    } else {
      setError('El enlace de conexión no está disponible');
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (!connectionId) return;
    
    try {
      setLoading(true);
      
      await tinkService.deleteConnection(connectionId);
      
      // Actualizar la lista de conexiones
      setConnections(connections.filter(conn => conn.id !== connectionId));
      setSuccess('Conexión eliminada correctamente');
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Error al eliminar la conexión: ' + (err.response?.data?.message || err.message));
    }
  };
  
  const handleSync = async (connectionId) => {
    if (!connectionId) return;
    
    try {
      setLoading(true);
      setSuccess('');
      setError('');
      
      await tinkService.syncConnection(connectionId);
      setSuccess('Sincronización iniciada correctamente');
      
      // Actualizar la lista de conexiones después de unos segundos
      setTimeout(async () => {
        try {
          const response = await tinkService.getConnections();
          if (response && response.connections) {
            setConnections(response.connections);
          }
          setLoading(false);
        } catch (err) {
          console.error('Error al actualizar conexiones después de sincronizar:', err);
          setLoading(false);
        }
      }, 2000);
      
    } catch (err) {
      setLoading(false);
      setError('Error al sincronizar la conexión: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="connect-container">
      <div className="connect-header">
        <h1 className="connect-title">
          <FaLink className="connect-icon" /> Conexión con tu Banco
        </h1>
      </div>
      
      {error && (
        <div className="connect-alert connect-error">
          <FaExclamationCircle /> {error}
        </div>
      )}
      
      {success && (
        <div className="connect-alert connect-success">
          <FaCheckCircle /> {success}
        </div>
      )}

      <div className="connect-card">
        <div className="connect-card-content">
          <h2 className="connect-card-title">Conecta tus cuentas bancarias</h2>
          <p className="connect-card-description">
            Conecta tus cuentas bancarias de forma segura utilizando Tink para obtener una visión 
            completa de tus finanzas en EconomixAI. Todos tus datos se mantienen seguros y cifrados.
          </p>
          
          <div className="connect-features">
            <div className="connect-feature-item">
              <span className="connect-feature-icon">🔒</span>
              <span className="connect-feature-text">Conexión segura</span>
            </div>
            <div className="connect-feature-item">
              <span className="connect-feature-icon">🔄</span>
              <span className="connect-feature-text">Sincronización automática</span>
            </div>
            <div className="connect-feature-item">
              <span className="connect-feature-icon">📊</span>
              <span className="connect-feature-text">Análisis completo</span>
            </div>
          </div>
          
          <button 
            className="connect-button" 
            onClick={handleConnectClick}
            disabled={loading || !tinkUrl}
          >
            {loading ? 'Cargando...' : 'Conectar mi Banco'}
          </button>
        </div>
      </div>

      {connections.length > 0 && (
        <div className="connect-card">
          <div className="connect-card-content">
            <h2 className="connect-card-title">Conexiones actuales</h2>
            <div className="connect-connections-list">
              {connections.map(connection => (
                <div key={connection.id} className="connect-connection-item">
                  <div className="connect-connection-info">
                    <div className="connect-connection-name">
                      {connection.bankName || 'Banco conectado'}
                    </div>
                    <div className="connect-connection-status">
                      <span className={`connect-status-badge ${connection.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {connection.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="connect-connection-date">
                        Conectado el {new Date(connection.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="connect-connection-actions">
                    <button 
                      className="connect-sync-button"
                      onClick={() => handleSync(connection.id)}
                      disabled={loading}
                      title="Sincronizar datos"
                    >
                      <FaSync /> Sincronizar
                    </button>
                    <button 
                      className="connect-disconnect-button"
                      onClick={() => handleDisconnect(connection.id)}
                      disabled={loading}
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectBank;
