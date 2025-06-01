import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAccountById, updateAccount } from '../services/accountService';
import { getAccountTransactions } from '../services/accountService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './css/AccountDetail.css';
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaExchangeAlt,
  FaChartPie,
  FaDownload,
  FaEllipsisH,
  FaTrash,
  FaUniversity,
  FaPiggyBank,
  FaChartLine,
  FaWallet,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaUsers,
  FaCreditCard
} from 'react-icons/fa';

const AccountDetail = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estados
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    bank_name: '',
    account_type: '',
    currency: ''
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Restaurar posición de scroll al inicio al montar el componente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cargar datos de la cuenta y transacciones
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener datos de la cuenta
        const accountData = await getAccountById(accountId);
        
        if (accountData.success) {
          setAccount(accountData.account);
          
          // Obtener transacciones relacionadas
          const transactionsData = await getAccountTransactions(accountId);
          
          if (transactionsData.success) {
            setTransactions(transactionsData.transactions);
            
            // Generar datos analíticos básicos a partir de las transacciones
            if (transactionsData.transactions && transactionsData.transactions.length > 0) {
              generateAnalytics(transactionsData.transactions);
            } else {
              // Proporcionar datos predeterminados para análisis si no hay transacciones
              setAnalytics({
                totalIncome: 0,
                totalExpense: 0,
                monthlyAvgIncome: 0,
                monthlyAvgExpense: 0,
                topCategories: [
                  { name: 'Sin categorías', amount: 0, percentage: 100 }
                ],
                trend: 0
              });
            }
          } else {
            throw new Error('Error al cargar transacciones');
          }
        } else {
          throw new Error(accountData.message || 'Error al cargar datos de la cuenta');
        }
      } catch (err) {
        console.error('Error al cargar detalle de cuenta:', err);
        setError(err.message || 'Ha ocurrido un error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccountData();
  }, [accountId]);

  // Generar datos analíticos básicos
  const generateAnalytics = (transactions) => {
    // Validar que transactions es un array
    if (!Array.isArray(transactions)) {
      console.error('transactions no es un array:', transactions);
      return setAnalytics({
        totalIncome: 0,
        totalExpense: 0,
        monthlyAvgIncome: 0,
        monthlyAvgExpense: 0,
        topCategories: [
          { name: 'Sin datos', amount: 0, percentage: 100 }
        ],
        trend: 0
      });
    }
    
    // Calculamos los ingresos y gastos totales
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Calculamos promedios mensuales (simulado)
    const monthlyAvgIncome = totalIncome / 3; // Asumimos datos de 3 meses
    const monthlyAvgExpense = totalExpense / 3;
    
    // Obtenemos categorías principales de gastos
    const categories = {};
    expenseTransactions.forEach(t => {
      // Asegurar que la categoría no sea null o undefined
      const category = t.category || 'Sin categoría';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += parseFloat(t.amount || 0);
    });
    
    // Convertimos a array y ordenamos
    const topCategories = Object.keys(categories).map(cat => ({
      name: cat,
      amount: categories[cat],
      percentage: (categories[cat] / totalExpense) * 100
    })).sort((a, b) => b.amount - a.amount).slice(0, 3);
    
    // Tendencia (simulada, en realidad debería venir del backend)
    const trend = 3.5;
    
    setAnalytics({
      totalIncome,
      totalExpense,
      monthlyAvgIncome,
      monthlyAvgExpense,
      topCategories,
      trend
    });
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: account?.currency || 'EUR' }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  // Obtener icono según el tipo de cuenta
  const getAccountIcon = (accountType) => {
    switch (accountType) {
      case 'corriente':
        return <FaUniversity className="account-icon-account bank" />;
      case 'ahorro':
        return <FaPiggyBank className="account-icon-account savings" />;
      case 'inversión':
        return <FaChartLine className="account-icon-account investment" />;
      default:
        return <FaWallet className="account-icon-account default" />;
    }
  };

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

  // Abrir modal de edición y cargar datos actuales
  const handleEditAccount = () => {
    // Preparar datos del formulario con los valores actuales
    if (account) {
      setEditFormData({
        name: account.name || '',
        bank_name: account.bank_name || '',
        account_type: account.account_type || 'corriente',
        currency: account.currency || 'EUR'
      });
      setShowEditModal(true);
    }
    setShowActionsMenu(false);
  };
  
  // Manejar cambios en el formulario de edición
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };
  
  // Enviar los datos actualizados de la cuenta
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError(null);
    
    try {
      // Validar datos básicos
      if (!editFormData.name.trim()) {
        return setUpdateError('El nombre de la cuenta es obligatorio');
      }
      
      const updatedData = {
        ...account,
        name: editFormData.name.trim(),
        bank_name: editFormData.bank_name.trim(),
        account_type: editFormData.account_type,
        currency: editFormData.currency
      };
      
      const response = await updateAccount(accountId, updatedData);
      
      if (response.success) {
        // Actualizar la cuenta en el estado local
        setAccount({
          ...account,
          ...updatedData
        });
        setShowEditModal(false);
      } else {
        setUpdateError(response.message || 'Error al actualizar la cuenta');
      }
    } catch (err) {
      console.error('Error al actualizar cuenta:', err);
      setUpdateError('Error de conexión al actualizar la cuenta');
    } finally {
      setUpdating(false);
    }
  };
  
  // Cerrar modal de edición
  const handleCloseModal = () => {
    setShowEditModal(false);
    setUpdateError(null);
  };

  // Manejar la adición de transacción
  const handleAddTransaction = () => {
    navigate(`/transactions/new?accountId=${accountId}`);
  };

  // Manejar la desactivación de cuenta
  const handleToggleStatus = async () => {
    try {
      if (!account) return;
      
      const newStatus = account.status === 'active' ? 'inactive' : 'active';
      
      const response = await updateAccount(accountId, {
        ...account,
        status: newStatus
      });
      
      if (response.success) {
        setAccount({
          ...account,
          status: newStatus
        });
        
        setShowActionsMenu(false);
      }
    } catch (err) {
      console.error('Error al cambiar estado de cuenta:', err);
    }
  };

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-loading">
          <div className="account-detail-spinner"></div>
        </div>
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-error">
          <h2>Error al cargar los datos</h2>
          <p>{error}</p>
          <button 
            className="back-button" 
            onClick={() => navigate('/accounts')}
          >
            Volver a Cuentas
          </button>
        </div>
      </div>
    );
  }

  // Si no hay cuenta, mostrar mensaje
  if (!account) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-error">
          <h2>Cuenta no encontrada</h2>
          <button 
            className="back-button" 
            onClick={() => navigate('/accounts')}
          >
            Volver a Cuentas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="account-detail-page">
      {/* Modal de Edición */}
      {showEditModal && (
        <div className="edit-account-modal-overlay">
          <div className="edit-account-modal">
            <div className="modal-header">
              <h2>Editar Cuenta</h2>
              <button 
                className="close-modal-button" 
                onClick={handleCloseModal}
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleUpdateAccount}>
              <div className="form-group">
                <label htmlFor="account-name">Nombre de la cuenta *</label>
                <input
                  type="text"
                  id="account-name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bank-name">Banco (opcional)</label>
                <input
                  type="text"
                  id="bank-name"
                  name="bank_name"
                  value={editFormData.bank_name}
                  onChange={handleEditFormChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="account-type">Tipo de cuenta *</label>
                <select
                  id="account-type"
                  name="account_type"
                  value={editFormData.account_type}
                  onChange={handleEditFormChange}
                  required
                >
                  <option value="corriente">Cuenta Corriente</option>
                  <option value="ahorro">Cuenta de Ahorro</option>
                  <option value="inversión">Inversión</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="currency">Moneda *</label>
                <select
                  id="currency"
                  name="currency"
                  value={editFormData.currency}
                  onChange={handleEditFormChange}
                  required
                >
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dólar Estadounidense</option>
                  <option value="GBP">GBP - Libra Esterlina</option>
                </select>
              </div>
              
              {updateError && (
                <div className="form-error">
                  {updateError}
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={handleCloseModal}
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={updating}
                >
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Cabecera */}
      <header className="account-detail-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/accounts')}
          aria-label="Volver"
        >
          <FaArrowLeft />
        </button>
        <div className="account-info">
          <div className="account-type-icon">
            {getAccountIcon(account.account_type)}
          </div>
          <div className="account-details">
            <h1 className="account-name">{account.name}</h1>
            <div className="account-meta">
              {account.bank_name && <span className="account-bank">{account.bank_name}</span>}
              <span className={`account-badge ${account.type || 'personal'}`}>
                {account.type === 'family' ? 'Familiar' : 'Personal'}
              </span>
              <span className={`account-status ${account.status || 'active'}`}>
                {account.status === 'inactive' ? 'Inactiva' : 'Activa'}
              </span>
            </div>
          </div>
        </div>
        <div className="account-actions">
          <button 
            className="add-transaction-button"
            onClick={handleAddTransaction}
          >
            <FaPlus /> Añadir Transacción
          </button>
          <div className="more-actions">
            <button 
              className="more-actions-button"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              aria-label="Más acciones"
            >
              <FaEllipsisH />
            </button>
            {showActionsMenu && (
              <div className="actions-menu">
                <button onClick={handleEditAccount}>
                  <FaEdit /> Editar Cuenta
                </button>
                <button onClick={handleToggleStatus}>
                  <FaTrash /> {account.status === 'active' ? 'Desactivar' : 'Activar'} Cuenta
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Panel de Balance */}
      <section className="balance-section">
        <div className="balance-main">
          <div className="balance-amount-container">
            <h2 className="balance-label">Balance Actual</h2>
            <div className="balance-amount">{formatCurrency(account.balance || 0)}</div>
            {analytics && renderTrend(analytics.trend)}
          </div>
          <div className="balance-summary">
            <div className="summary-item income">
              <span className="summary-label">Ingresos Mensuales</span>
              <span className="summary-value">{formatCurrency(analytics?.monthlyAvgIncome || 0)}</span>
            </div>
            <div className="summary-item expense">
              <span className="summary-label">Gastos Mensuales</span>
              <span className="summary-value">{formatCurrency(analytics?.monthlyAvgExpense || 0)}</span>
            </div>
          </div>
        </div>
        <div className="balance-chart">
          {/* Aquí iría un componente de gráfico, por simplicidad lo simulamos */}
          <div className="mini-chart">
            <div className="chart-bar" style={{ height: '60%' }}></div>
            <div className="chart-bar" style={{ height: '40%' }}></div>
            <div className="chart-bar" style={{ height: '70%' }}></div>
            <div className="chart-bar" style={{ height: '50%' }}></div>
            <div className="chart-bar" style={{ height: '90%' }}></div>
            <div className="chart-bar" style={{ height: '65%' }}></div>
          </div>
        </div>
      </section>

      {/* Sección de Transacciones Recientes */}
      <section className="transactions-section">
        <div className="section-header">
          <h2 className="section-title">Transacciones Recientes</h2>
          <div className="transaction-header-actions">
            <button 
              className="mobile-add-transaction-button"
              onClick={handleAddTransaction}
            >
              <FaPlus /> Añadir
            </button>
            <button 
              className="view-all-button"
              onClick={() => navigate(`/transactions?accountId=${accountId}`)}
            >
              Ver todas
            </button>
          </div>
        </div>
        
        {transactions.length === 0 ? (
          <div className="no-transactions">
            <p>No hay transacciones recientes en esta cuenta.</p>
            <button 
              className="add-first-transaction"
              onClick={handleAddTransaction}
            >
              <FaPlus /> Añadir Primera Transacción
            </button>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.slice(0, 8).map(transaction => (
              <div 
                key={transaction.id} 
                className="transaction-item"
                onClick={() => navigate(`/transactions/${transaction.id}`)}
              >
                <div className="transaction-date">
                  {formatDate(transaction.date)}
                </div>
                <div className="transaction-content">
                  <div className="transaction-description">
                    {transaction.description}
                  </div>
                  <div className="transaction-category">
                    {transaction.category}
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección de Análisis */}
      {analytics && analytics.topCategories && analytics.topCategories.length > 0 && (
        <section className="analytics-section">
          <div className="section-header">
            <h2 className="section-title">Análisis de Gastos</h2>
          </div>
          
          <div className="analytics-content">
            <div className="pie-chart-container">
              <div className="pie-chart">
                {/* Simulación visual de un gráfico circular */}
                <div className="pie-segment" style={{ 
                  transform: 'rotate(0deg)', 
                  backgroundColor: '#00A6FB',
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)'
                }}></div>
                <div className="pie-segment" style={{ 
                  transform: 'rotate(90deg)', 
                  backgroundColor: '#5CE1E6',
                  clipPath: `polygon(50% 50%, 50% 0%, ${analytics.topCategories[1]?.percentage * 3.6 / 2}% 0%, 100% 50%)`
                }}></div>
                <div className="pie-segment" style={{ 
                  transform: 'rotate(180deg)', 
                  backgroundColor: '#38B6FF',
                  clipPath: `polygon(50% 50%, 50% 0%, ${analytics.topCategories[2]?.percentage * 3.6 / 2}% 0%, 100% 50%)`
                }}></div>
              </div>
            </div>
            
            <div className="categories-list">
              <h3>Principales Categorías</h3>
              {analytics.topCategories.map((category, index) => (
                <div key={index} className="category-item">
                  <div className="category-color" style={{ 
                    backgroundColor: index === 0 ? '#00A6FB' : index === 1 ? '#5CE1E6' : '#38B6FF' 
                  }}></div>
                  <div className="category-name">{category.name}</div>
                  <div className="category-percentage">{category.percentage.toFixed(1)}%</div>
                  <div className="category-amount">{formatCurrency(category.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Sección de Acciones Adicionales */}
      <section className="additional-actions-section">
        <div className="action-card" onClick={handleAddTransaction}>
          <div className="action-icon"><FaPlus /></div>
          <div className="action-text">Añadir Transacción</div>
        </div>
        <div className="action-card" onClick={() => navigate(`/transfers?fromAccount=${accountId}`)}>
          <div className="action-icon"><FaExchangeAlt /></div>
          <div className="action-text">Transferir</div>
        </div>
        <div className="action-card" onClick={handleEditAccount}>
          <div className="action-icon"><FaEdit /></div>
          <div className="action-text">Editar Cuenta</div>
        </div>
        <div className="action-card" onClick={() => navigate(`/reports?accountId=${accountId}`)}>
          <div className="action-icon"><FaChartPie /></div>
          <div className="action-text">Reportes</div>
        </div>
      </section>
    </div>
  );
};

export default AccountDetail;
