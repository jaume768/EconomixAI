import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAccounts } from '../services/accountService';
import './css/Accounts.css';
import {
  FaWallet,
  FaPiggyBank,
  FaChartLine,
  FaPlus,
  FaAngleRight,
  FaArrowUp,
  FaArrowDown,
  FaUsers,
  FaCreditCard,
  FaUniversity
} from 'react-icons/fa';

const Accounts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('personal');
  const [totalBalance, setTotalBalance] = useState(0);
  const [balanceTrend, setBalanceTrend] = useState(0);
  
  // Obtener datos de cuentas
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar el servicio para obtener las cuentas
        const data = await getAccounts();
        
        if (data.success) {
          setAccounts(data.accounts);
          
          // Calcular balance total
          const total = data.accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);
          setTotalBalance(total);
          
          // Simular tendencia (en una aplicación real, esto vendría del backend)
          setBalanceTrend(3.2);
        } else {
          throw new Error(data.message || 'Error al cargar las cuentas');
        }
      } catch (err) {
        console.error('Error al cargar cuentas:', err);
        setError(err.message || 'Error al cargar las cuentas');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccounts();
  }, []);
  
  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  // Obtener icono según el tipo de cuenta
  const getAccountIcon = (accountType) => {
    switch (accountType) {
      case 'corriente':
        return <FaUniversity className="account-icon bank" />;
      case 'ahorro':
        return <FaPiggyBank className="account-icon savings" />;
      case 'inversión':
        return <FaChartLine className="account-icon investment" />;
      default:
        return <FaWallet className="account-icon default" />;
    }
  };
  
  // Filtrar cuentas según el tab seleccionado
  const filteredAccounts = accounts.filter(account => 
    selectedTab === 'personal' 
      ? account.type === 'personal' 
      : account.type === 'family'
  );
  
  // Renderizar un indicador de tendencia
  const renderTrend = (value) => {
    const isPositive = value >= 0;
    return (
      <span className={`trend-indicator ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? <FaArrowUp /> : <FaArrowDown />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="accounts-page">
        <div className="accounts-loading">
          <div className="accounts-spinner"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="accounts-page">
      {error && (
        <div className="accounts-error">{error}</div>
      )}
      
      <header className="accounts-header">
        <div className="accounts-title-section">
          <h1 className="accounts-title">Tus Cuentas Financieras</h1>
          <button className="accounts-add-button" onClick={() => navigate('/accounts/new')}>
            <FaPlus /> Nueva Cuenta
          </button>
        </div>
        
        <div className="accounts-summary">
          <div className="accounts-total-balance">
            <span className="accounts-label">Balance Total:</span>
            <span className="accounts-value">{formatCurrency(totalBalance)}</span>
            {renderTrend(balanceTrend)}
            <span className="accounts-period">este mes</span>
          </div>
        </div>
      </header>
      
      <div className="accounts-tabs">
        <button 
          className={`accounts-tab ${selectedTab === 'personal' ? 'active' : ''}`}
          onClick={() => setSelectedTab('personal')}
        >
          Personales
        </button>
        <button 
          className={`accounts-tab ${selectedTab === 'family' ? 'active' : ''}`}
          onClick={() => setSelectedTab('family')}
        >
          Familiares
        </button>
      </div>
      
      <div className="accounts-list">
        {filteredAccounts.length > 0 ? (
          filteredAccounts.map(account => (
            <div 
              key={account.id} 
              className="account-card"
              onClick={() => navigate(`/accounts/${account.id}`)}
            >
              <div className="account-card-main">
                <div className="account-card-icon">
                  {getAccountIcon(account.account_type)}
                </div>
                <div className="account-card-details">
                  <div className="account-card-name">
                    {account.bank_name} - {account.name}
                  </div>
                  <div className="account-card-type">
                    {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
                    {account.type === 'family' && (
                      <span className="account-family-tag">
                        <FaUsers /> {account.family_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="account-card-balance">
                  <div className="account-balance-amount">
                    {formatCurrency(account.balance || 0)}
                  </div>
                  <div className="account-balance-trend">
                    {/* En una app real, estos datos vendrían del backend */}
                    {renderTrend(Math.random() * 10 - 3)} 
                    <span>últimos 7 días</span>
                  </div>
                </div>
                <div className="account-card-action">
                  <FaAngleRight />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="accounts-empty">
            <p>
              {selectedTab === 'personal' 
                ? 'No tienes cuentas personales. ¡Añade una para empezar!' 
                : 'No tienes cuentas familiares. ¡Comparte finanzas con tu familia!'}
            </p>
            <button className="accounts-add-empty" onClick={() => navigate('/accounts/new')}>
              <FaPlus /> Añadir Cuenta
            </button>
          </div>
        )}
      </div>
      
      {filteredAccounts.length > 0 && (
        <div className="accounts-actions">
          <button 
            className="accounts-action-button"
            onClick={() => navigate('/accounts/analysis')}
          >
            Ver análisis global
          </button>
        </div>
      )}
      
      {/* Dashboard de análisis de cuentas */}
      {filteredAccounts.length > 0 && selectedTab === 'personal' && (
        <div className="accounts-dashboard">
          <h2 className="dashboard-section-title">Análisis de Cuentas</h2>
          
          <div className="accounts-dashboard-grid">
            <div className="accounts-dashboard-card">
              <h3>Distribución por Tipo</h3>
              <div className="accounts-chart-placeholder">
                {/* Aquí iría un gráfico circular */}
                <div className="placeholder-text">Gráfico de distribución</div>
              </div>
            </div>
            
            <div className="accounts-dashboard-card">
              <h3>Evolución de Saldos</h3>
              <div className="accounts-chart-placeholder">
                {/* Aquí iría un gráfico de línea */}
                <div className="placeholder-text">Gráfico de evolución</div>
              </div>
            </div>
          </div>
          
          {/* Recomendaciones IA */}
          <div className="accounts-recommendations">
            <h3>Recomendaciones Personalizadas</h3>
            <div className="recommendation-card">
              <div className="recommendation-icon">
                <FaPiggyBank />
              </div>
              <div className="recommendation-content">
                <h4>Optimiza tus ahorros</h4>
                <p>Tu cuenta corriente tiene un saldo promedio de {formatCurrency(3500)}. Considera transferir {formatCurrency(2000)} a tu cuenta de ahorro para obtener mejor rendimiento.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
