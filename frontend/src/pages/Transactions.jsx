// src/pages/Transactions.jsx

import React, { useState, useEffect } from 'react';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaCalendarAlt, 
  FaFilter, 
  FaPlus, 
  FaTimes, 
  FaWallet, 
  FaCreditCard, 
  FaListAlt,
  FaSpinner,
  FaEdit,
  FaTrashAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTransactions,
  deleteTransaction
} from '../services/transactionService';
import { getAccounts } from '../services/accountService';
import { getCategories } from '../services/categoryService';
import './css/transactions.css';

const Transactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado principal
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  
  // Estados para desplegables
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  // Estado para filtros activos y validaciones
  const [activeFilters, setActiveFilters] = useState([]);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [filterError, setFilterError] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Estado para el modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Filtros y paginación
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',         // 'income' | 'expense' | ''
    account_id: '',   // id numérico o ''
    category_id: '',  // id numérico o ''
    limit: 20,
    offset: 0,
    sort_by: 'transaction_date',
    sort_order: 'DESC'
  });

  // Cargar cuentas y categorías disponibles
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        // Cargar cuentas
        const accountsResponse = await getAccounts();
        if (accountsResponse.success) {
          setAccounts(accountsResponse.accounts || []);
        }
        
        // Cargar categorías
        const categoriesResponse = await getCategories();
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.categories || []);
        }
      } catch (err) {
        console.error('Error al cargar opciones:', err);
      } finally {
        setLoadingOptions(false);
      }
    };
    
    if (user?.id) {
      loadOptions();
    }
  }, [user]);

  // Cargar transacciones cada vez que cambien filtros u offset
  useEffect(() => {
    if (!user?.id) return;

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Llamada al backend con los filtros
        const params = {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          type: filters.type || undefined,
          account_id: filters.account_id || undefined,
          category_id: filters.category_id || undefined,
          limit: filters.limit,
          offset: filters.offset,
          sort_by: filters.sort_by,
          sort_order: filters.sort_order
        };
        const response = await getTransactions(params);
        if (response.success) {
          setTransactions(response.transactions);
          setTotal(response.pagination.total);
        } else {
          setError('No se pudieron obtener las transacciones.');
        }
      } catch (err) {
        console.error(err);
        setError('Error del servidor al cargar transacciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user, filters]);

  // Formatear fecha (DD MMM YYYY, ej. “5 May 2025” -> “5 May 2025”)
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'd MMM yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  // Manejadores de filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value,
      offset: 0 // al cambiar filtro, regresar a la primera página
    };
    
    // Validar formato y rango de fechas
    if ((name === 'startDate' || name === 'endDate') && 
        newFilters.startDate && newFilters.endDate) {
      if (newFilters.startDate > newFilters.endDate) {
        setFilterError('Fecha inicio debe ser anterior o igual a Fecha fin');
      } else {
        setFilterError(null);
      }
    } else {
      setFilterError(null);
    }
    
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    // Validar que fecha inicio no sea posterior a fecha fin
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      setFilterError('La fecha de inicio no puede ser posterior a la fecha fin');
      return;
    }
    
    setApplyingFilters(true);
    
    // Generar chips para filtros activos
    const newActiveFilters = [];
    
    if (filters.startDate && filters.endDate) {
      newActiveFilters.push({
        id: 'date-range',
        label: `Del ${format(new Date(filters.startDate), 'd MMM', { locale: es })} al ${format(new Date(filters.endDate), 'd MMM yyyy', { locale: es })}`,
        type: 'date'
      });
    } else if (filters.startDate) {
      newActiveFilters.push({
        id: 'start-date',
        label: `Desde ${format(new Date(filters.startDate), 'd MMM yyyy', { locale: es })}`,
        type: 'date'
      });
    } else if (filters.endDate) {
      newActiveFilters.push({
        id: 'end-date',
        label: `Hasta ${format(new Date(filters.endDate), 'd MMM yyyy', { locale: es })}`,
        type: 'date'
      });
    }

    if (filters.type) {
      newActiveFilters.push({
        id: 'type',
        label: filters.type === 'income' ? 'Ingresos' : 'Gastos',
        type: 'type'
      });
    }

    if (filters.account_id) {
      const selectedAccount = accounts.find(acc => acc.id === parseInt(filters.account_id));
      if (selectedAccount) {
        newActiveFilters.push({
          id: 'account',
          label: `Cuenta: ${selectedAccount.name}`,
          type: 'account'
        });
      }
    }

    if (filters.category_id) {
      const selectedCategory = categories.find(cat => cat.id === parseInt(filters.category_id));
      if (selectedCategory) {
        newActiveFilters.push({
          id: 'category',
          label: `Categoría: ${selectedCategory.name}`,
          type: 'category'
        });
      }
    }

    setActiveFilters(newActiveFilters);
    
    // Aplicar filtros actualizando el estado
    setFilters((prev) => ({ ...prev }));
    
    // Vuelve al estado normal después de 700ms (mostrar una animación de carga)
    setTimeout(() => setApplyingFilters(false), 700);
  };
  
  // Quitar un filtro específico
  const handleRemoveFilter = (filterId) => {
    const filter = activeFilters.find(f => f.id === filterId);
    
    // Determinar qué campo actualizar basado en el tipo de filtro
    if (!filter) return;
    
    let updatedFilters = {...filters};
    
    switch (filter.type) {
      case 'date':
        updatedFilters.startDate = '';
        updatedFilters.endDate = '';
        break;
      case 'type':
        updatedFilters.type = '';
        break;
      case 'account':
        updatedFilters.account_id = '';
        break;
      case 'category':
        updatedFilters.category_id = '';
        break;
      default:
        break;
    }
    
    // Actualizar filtros y quitar el chip
    setFilters(updatedFilters);
    setActiveFilters(activeFilters.filter(f => f.id !== filterId));
    
    // Aplicar cambios inmediatamente
    setTimeout(() => setFilters(prev => ({ ...prev })), 0);
  };
  
  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: '',
      account_id: '',
      category_id: '',
      limit: filters.limit,
      offset: 0,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order
    });
    setActiveFilters([]);
    setFilterError(null);
    
    // Aplicar cambios inmediatamente
    setTimeout(() => setFilters(prev => ({ ...prev })), 0);
  };

  const handlePageChange = (direction) => {
    const newOffset = direction === 'next'
      ? filters.offset + filters.limit
      : filters.offset - filters.limit;
    if (newOffset < 0 || newOffset >= total) return;
    setFilters((prev) => ({
      ...prev,
      offset: newOffset
    }));
  };

  // Abre el modal de confirmación y guarda el ID de la transacción a eliminar
  const handleDeleteClick = (id) => {
    setTransactionToDelete(id);
    setShowDeleteModal(true);
  };
  
  // Confirma la eliminación de la transacción
  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteTransaction(transactionToDelete);
      // Cerrar el modal y limpiar el ID
      setShowDeleteModal(false);
      setTransactionToDelete(null);
      // Refrescar lista
      setFilters((prev) => ({
        ...prev
      }));
    } catch (err) {
      console.error(err);
      setShowDeleteModal(false);
      setTransactionToDelete(null);
      // Mostrar un mensaje de error más amigable
      setError('Error al eliminar la transacción.');
    }
  };
  
  // Cancela la eliminación y cierra el modal
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  return (
    <div className="transactions-page">
      {/* Header de la página */}
      <div className="transactions-header" role="banner">
        <div className="title-wrapper">
          <h1 className="transactions-title">Transacciones</h1>
        </div>
        <div className="actions-wrapper">
          <button
            className="btn-add-transaction"
            onClick={() => navigate('/transactions/new')}
            aria-label="Agregar nueva transacción"
          >
            <FaPlus className="icon-plus" aria-hidden="true" />
            <span>Agregar Transacción</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="transactions-filters-container" aria-labelledby="filters-heading">
        <div className="filters-header">
          <button 
            className={`btn-toggle-filters ${filtersVisible ? 'active' : ''}`}
            onClick={() => setFiltersVisible(!filtersVisible)}
            aria-expanded={filtersVisible}
            aria-controls="filters-panel"
          >
            <h2 id="filters-heading" className="filters-title">
              <FaFilter className="filters-icon" aria-hidden="true" />
              Filtros
              <span className="toggle-indicator">{filtersVisible ? '▼' : '▶'}</span>
            </h2>
          </button>
          {activeFilters.length > 0 && (
            <button 
              className="btn-clear-filters" 
              onClick={handleClearFilters}
              aria-label="Limpiar todos los filtros"
            >
              <FaTimes className="icon-clear" aria-hidden="true" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
        
        {filterError && (
          <div className="filter-error" role="alert">
            <span className="error-icon">⚠️</span>
            {filterError}
          </div>
        )}
        
        <div 
          id="filters-panel" 
          className={`transactions-filters ${filtersVisible ? 'visible' : 'hidden'}`}
          aria-hidden={!filtersVisible}
        >
          <div className="filter-group date-filters">
            <div className="filter-item">
              <label htmlFor="startDate" className="filter-label">
                <FaCalendarAlt className="filter-icon" aria-hidden="true" />
                Fecha inicio
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className={`filter-input date-input ${filterError && filters.startDate && filters.endDate && filters.startDate > filters.endDate ? 'error' : ''}`}
                aria-describedby={filterError && filters.startDate && filters.endDate && filters.startDate > filters.endDate ? 'date-error' : 'date-hint'}
                aria-invalid={filterError && filters.startDate && filters.endDate && filters.startDate > filters.endDate ? 'true' : 'false'}
              />
              {filterError && filters.startDate && filters.endDate && filters.startDate > filters.endDate && (
                <span id="date-error" className="date-error-message" role="alert">
                  Fecha inicio debe ser anterior o igual a Fecha fin
                </span>
              )}
            </div>
            <div className="filter-item">
              <label htmlFor="endDate" className="filter-label">
                <FaCalendarAlt className="filter-icon" aria-hidden="true" />
                Fecha fin
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className={`filter-input date-input ${filterError && filters.startDate && filters.endDate && filters.startDate > filters.endDate ? 'error' : ''}`}
                aria-describedby={filterError && filters.startDate && filters.endDate && filters.startDate > filters.endDate ? 'date-error' : 'date-hint'}
                aria-invalid={filterError && filters.startDate && filters.endDate && filters.startDate > filters.endDate ? 'true' : 'false'}
              />
            </div>
          </div>
          
          <div className="filter-item">
            <label htmlFor="type" className="filter-label">
              <FaListAlt className="filter-icon" aria-hidden="true" />
              Tipo
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="filter-select"
              aria-label="Filtrar por tipo de transacción"
            >
              <option value="">Todos los tipos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="account_id" className="filter-label">
              <FaCreditCard className="filter-icon" aria-hidden="true" />
              Cuenta
            </label>
            <select
              id="account_id"
              name="account_id"
              value={filters.account_id}
              onChange={handleFilterChange}
              className="filter-select"
              disabled={loadingOptions}
              aria-busy={loadingOptions}
              aria-label="Filtrar por cuenta"
            >
              <option value="">Todas las cuentas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} {account.bank_name ? `(${account.bank_name})` : ''}
                </option>
              ))}
            </select>
            {loadingOptions && <span className="visually-hidden">Cargando cuentas...</span>}
          </div>
          
          <div className="filter-item">
            <label htmlFor="category_id" className="filter-label">
              <FaWallet className="filter-icon" aria-hidden="true" />
              Categoría
            </label>
            <select
              id="category_id"
              name="category_id"
              value={filters.category_id}
              onChange={handleFilterChange}
              className="filter-select"
              disabled={loadingOptions}
              aria-busy={loadingOptions}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {loadingOptions && <span className="visually-hidden">Cargando categorías...</span>}
          </div>
          
          <div className="filter-actions">
            <button 
              onClick={handleClearFilters}
              className="btn-clear-inside"
              aria-label="Limpiar todos los filtros"
              type="button"
            >
              <FaTimes className="icon-clear" aria-hidden="true" />
              <span>Limpiar</span>
            </button>
            <button 
              onClick={handleApplyFilters}
              className="btn-apply-filters"
              disabled={applyingFilters}
              type="button"
            >
              {applyingFilters ? (
                <>
                  <FaSpinner className="icon-spinner" /> 
                  <span>Aplicando...</span>
                </> 
              ) : (
                <>
                  <FaFilter className="filter-icon" aria-hidden="true" />
                  <span>Aplicar filtros</span>
                </> 
              )}
            </button>
          </div>
        </div>
        
        {/* Chips de filtros activos */}
        {activeFilters.length > 0 && (
          <div className="active-filters" role="region" aria-label="Filtros activos">
            {activeFilters.map(filter => (
              <div className="filter-chip" key={filter.id}>
                <span className="chip-label">{filter.label}</span>
                <button 
                  className="btn-remove-filter"
                  onClick={() => handleRemoveFilter(filter.id)}
                  aria-label={`Eliminar filtro: ${filter.label}`}
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="transactions-content">
        {loading ? (
          <div className="transactions-loading" role="status">
            <div className="spinner-transactions">
              <FaSpinner className="spinner-icon" aria-hidden="true" />
            </div>
            <span className="loading-text">Cargando transacciones...</span>
            <span className="visually-hidden">Por favor espere mientras se cargan las transacciones</span>
          </div>
        ) : error ? (
          <div className="transactions-error" role="alert">
            <div className="error-icon-container">
              <span className="error-icon" aria-hidden="true">⚠️</span>
            </div>
            <div className="error-content">
              <h3 className="error-title">Error al cargar transacciones</h3>
              <p className="error-message">{error}</p>
              <button 
                className="btn-retry" 
                onClick={() => setFilters(prev => ({...prev}))} 
                aria-label="Intentar cargar las transacciones nuevamente"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="transactions-empty" role="status">
            <div className="empty-icon-container">
              <span className="empty-icon" aria-hidden="true">📃</span>
            </div>
            <h3 className="empty-title">No hay transacciones para mostrar</h3>
            <p className="empty-message">
              {(filters.startDate || filters.endDate || filters.type || filters.account_id || filters.category_id) ? 
                'Prueba a cambiar los filtros para ver resultados diferentes.' : 
                'Añade tu primera transacción para comenzar a hacer seguimiento de tus finanzas.'}
            </p>
            {(filters.startDate || filters.endDate || filters.type || filters.account_id || filters.category_id) && (
              <button 
                className="btn-clear-all" 
                onClick={handleClearFilters}
                aria-label="Limpiar todos los filtros"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Versión escritorio: listado en filas */}
            <div className="transactions-table-container" role="region" aria-label="Lista de transacciones">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Cuenta</th>
                    <th scope="col">Categoría</th>
                    <th scope="col" className="col-amount">Monto</th>
                    <th scope="col" className="col-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => (
                    <tr 
                      key={tx.id} 
                      className={`${index % 2 === 0 ? 'row-even' : 'row-odd'} ${tx.type === 'income' ? 'row-income' : 'row-expense'}`}
                    >
                      <td data-label="Fecha">{formatDate(tx.transaction_date)}</td>
                      <td className="tx-description" data-label="Descripción">
                        {tx.description ? (
                          <span title={tx.description}>{tx.description}</span>
                        ) : (
                          <span className="no-data">—</span>
                        )}
                      </td>
                      <td data-label="Cuenta">
                        {tx.account_name ? (
                          <span title={tx.account_name}>{tx.account_name}</span>
                        ) : (
                          <span className="no-data">Cuenta {tx.account_id}</span>
                        )}
                      </td>
                      <td data-label="Categoría">
                        {tx.category_name || <span className="no-data">Sin categoría</span>}
                      </td>
                      <td className="col-amount" data-label="Monto">
                        <div className={`tx-amount ${tx.type === 'income' ? 'tx-income' : 'tx-expense'}`}>
                          {tx.type === 'income' ? (
                            <FaArrowUp className="icon-type income" aria-hidden="true" />
                          ) : (
                            <FaArrowDown className="icon-type expense" aria-hidden="true" />
                          )}
                          <span>
                            <span className="visually-hidden">{tx.type === 'income' ? 'Ingreso de' : 'Gasto de'}</span>
                            {tx.type === 'income' ? ' +' : ' -'}
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: tx.currency || 'EUR'
                            }).format(Math.abs(tx.amount))}
                          </span>
                        </div>
                      </td>
                      <td className="col-actions" data-label="Acciones">
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/transactions/edit/${tx.id}`)}
                            title="Editar transacción"
                            aria-label={`Editar transacción: ${tx.description || 'Sin descripción'} del ${formatDate(tx.transaction_date)}`}
                          >
                            <FaEdit className="action-icon" aria-hidden="true" />
                            <span className="action-text">Editar</span>
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteClick(tx.id)}
                            title="Eliminar transacción"
                            aria-label={`Eliminar transacción: ${tx.description || 'Sin descripción'} del ${formatDate(tx.transaction_date)}`}
                          >
                            <FaTrashAlt className="action-icon" aria-hidden="true" />
                            <span className="action-text">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="transactions-pagination" role="navigation" aria-label="Navegación de páginas">
              <button
                className="btn-page btn-prev"
                onClick={() => handlePageChange('prev')}
                disabled={filters.offset === 0}
                aria-label="Página anterior"
                aria-disabled={filters.offset === 0}
              >
                <span aria-hidden="true">&laquo;</span> Anterior
              </button>
              <div className="pagination-info" aria-live="polite">
                <span className="current-range">
                  {Math.min(filters.offset + 1, total)}–
                  {Math.min(filters.offset + filters.limit, total)}
                </span>
                <span className="total-info"> de {total} transacciones</span>
              </div>
              <button
                className="btn-page btn-next"
                onClick={() => handlePageChange('next')}
                disabled={filters.offset + filters.limit >= total}
                aria-label="Página siguiente"
                aria-disabled={filters.offset + filters.limit >= total}
              >
                Siguiente <span aria-hidden="true">&raquo;</span>
              </button>
            </div>
          </>
        )}

        {/* Versión móvil: tarjetas */}
        {!loading && !error && transactions.length > 0 && (
          <div className="transactions-card-container">
            {transactions.map((tx) => (
              <div 
                className={`transaction-card ${tx.type === 'income' ? 'income' : 'expense'}`} 
                key={tx.id}
                tabIndex="0"
                aria-label={`${tx.description || 'Transacción'}, ${tx.type === 'income' ? 'Ingreso' : 'Gasto'} de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: tx.currency || 'EUR' }).format(Math.abs(tx.amount))}, fecha ${formatDate(tx.transaction_date)}`}
              >
                <div className="card-main-content">
                  <div className="card-left">
                    <div className={`type-indicator ${tx.type}`} aria-hidden="true"></div>
                    <div className="card-primary-info">
                      <h3 className="card-desc" title={tx.description || 'Transacción'}>{tx.description || 'Transacción'}</h3>
                      <div className="card-meta">
                        <span className="card-category">
                          <FaWallet className="meta-icon" aria-hidden="true" /> {tx.category_name || 'Sin categoría'}
                        </span>
                        <span className="card-date">
                          <FaCalendarAlt className="meta-icon" aria-hidden="true" /> {formatDate(tx.transaction_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-right">
                    <div className={`amount-display ${tx.type}`}>
                      <span className="amount-symbol">{tx.type === 'income' ? '+ ' : '- '}</span>
                      <span className="amount-value">
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: tx.currency || 'EUR'
                        }).format(Math.abs(tx.amount))}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-card-action edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/transactions/edit/${tx.id}`);
                        }}
                        title="Editar transacción"
                        aria-label={`Editar transacción: ${tx.description || 'Sin descripción'}`}
                      >
                        <FaEdit className="action-icon" aria-hidden="true" />
                      </button>
                      <button
                        className="btn-card-action delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(tx.id);
                        }}
                        title="Eliminar transacción"
                        aria-label={`Eliminar transacción: ${tx.description || 'Sin descripción'}`}
                      >
                        <FaTrashAlt className="action-icon" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card-account">
                  <FaCreditCard className="account-icon" aria-hidden="true" />
                  <span className="account-name">{tx.account_name || `Cuenta ${tx.account_id}`}</span>
                </div>
              </div>
            ))}
            {/* En móvil, paginación bajo las tarjetas */}
            <div className="transactions-pagination-mobile" role="navigation" aria-label="Navegación de páginas móvil">
              <button
                className="btn-page btn-prev mobile"
                onClick={() => handlePageChange('prev')}
                disabled={filters.offset === 0}
                aria-label="Página anterior" 
                aria-disabled={filters.offset === 0}
              >
                <span aria-hidden="true">&laquo;</span> Anterior
              </button>
              <div className="pagination-info mobile" aria-live="polite">
                <span className="current-page">
                  Página {Math.floor(filters.offset / filters.limit) + 1} 
                </span>
                <span className="total-info"> de {Math.ceil(total / filters.limit)}</span>
              </div>
              <button
                className="btn-page btn-next mobile"
                onClick={() => handlePageChange('next')}
                disabled={filters.offset + filters.limit >= total}
                aria-label="Página siguiente"
                aria-disabled={filters.offset + filters.limit >= total}
              >
                Siguiente <span aria-hidden="true">&raquo;</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Botón flotante para añadir transacción en dispositivos móviles */}
      <button 
        className="fab-add-transaction"
        onClick={() => navigate('/transactions/new')}
        aria-label="Agregar nueva transacción"
        title="Agregar transacción"
      >
        <FaPlus className="fab-icon" aria-hidden="true" />
      </button>

      {/* Modal de confirmación para eliminar transacción */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <FaExclamationTriangle className="modal-icon warning" aria-hidden="true" />
              <h3>Confirmar eliminación</h3>
            </div>
            <div className="modal-content">
              <p>¿Estás seguro que quieres eliminar esta transacción?</p>
              <p className="modal-warning">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-modal btn-cancel" onClick={cancelDelete}>
                Cancelar
              </button>
              <button className="btn-modal btn-confirm" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
