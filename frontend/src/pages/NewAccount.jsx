import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAccount } from '../services/accountService';
import './css/NewAccount.css';
import {
  FaArrowLeft,
  FaUniversity,
  FaPiggyBank,
  FaChartLine,
  FaWallet,
  FaUsers,
  FaEuroSign,
  FaDollarSign,
  FaPoundSign,
  FaYenSign
} from 'react-icons/fa';

const NewAccount = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    account_type: 'corriente',
    currency: 'EUR',
    family_id: null
  });

  // Estado para familias disponibles
  const [families, setFamilies] = useState([]);
  const [hasFamilies, setHasFamilies] = useState(false);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Obtener familias si existen (simulado por ahora)
  useEffect(() => {
    // Aquí podríamos implementar la llamada a una API para obtener las familias del usuario
    // Por ahora, solo configuramos un estado para simular si tiene o no familias
    setHasFamilies(false);
    setFamilies([]);
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si se selecciona "Sin familia", establecer family_id a null
    if (name === 'family_id' && value === 'none') {
      setFormData(prev => ({ ...prev, family_id: null }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Si family_id está como string, convertirlo a número o null
      const dataToSend = {
        ...formData,
        family_id: formData.family_id === null ? null : 
                  Number(formData.family_id)
      };
      
      const response = await createAccount(dataToSend);
      
      if (response.success) {
        setSuccess(true);
        // Redireccionar después de 1.5 segundos
        setTimeout(() => {
          navigate('/accounts');
        }, 1500);
      } else {
        throw new Error(response.message || 'Error al crear la cuenta');
      }
    } catch (err) {
      console.error('Error al crear cuenta:', err);
      setError(err.message || 'Error al crear la cuenta. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Obtener clase CSS según el tipo de cuenta
  const getAccountTypeClass = (type) => {
    switch (type) {
      case 'corriente': return 'bank';
      case 'ahorro': return 'savings';
      case 'inversión': return 'investment';
      default: return 'default';
    }
  };

  // Obtener icono según el tipo de cuenta
  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'corriente': return <FaUniversity />;
      case 'ahorro': return <FaPiggyBank />;
      case 'inversión': return <FaChartLine />;
      default: return <FaWallet />;
    }
  };

  // Obtener icono según la moneda
  const getCurrencyIcon = (currency) => {
    switch (currency) {
      case 'EUR': return <FaEuroSign />;
      case 'USD': return <FaDollarSign />;
      case 'GBP': return <FaPoundSign />;
      case 'JPY': return <FaYenSign />;
      default: return <FaEuroSign />;
    }
  };

  return (
    <div className="new-account-page">
      <header className="new-account-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/accounts')}
          aria-label="Volver"
        >
          <FaArrowLeft />
        </button>
        <h1 className="new-account-title">Nueva Cuenta</h1>
      </header>

      {success ? (
        <div className="new-account-success">
          <div className="success-icon">✓</div>
          <h2>¡Cuenta creada con éxito!</h2>
          <p>Redirigiendo a la lista de cuentas...</p>
        </div>
      ) : (
        <form className="new-account-form" onSubmit={handleSubmit}>
          {error && (
            <div className="new-account-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Nombre de la cuenta *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Cuenta Principal"
              required
              minLength="2"
              maxLength="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bank_name">Banco o entidad</label>
            <input
              type="text"
              id="bank_name"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              placeholder="Ej: BBVA, Santander, N26..."
            />
          </div>

          <div className="form-group">
            <label>Tipo de cuenta *</label>
            <div className="account-type-options">
              {['corriente', 'ahorro', 'inversión'].map(type => (
                <div
                  key={type}
                  className={`account-type-option ${formData.account_type === type ? 'selected' : ''} ${getAccountTypeClass(type)}`}
                  onClick={() => setFormData(prev => ({ ...prev, account_type: type }))}
                >
                  <div className="account-type-icon">
                    {getAccountTypeIcon(type)}
                  </div>
                  <span className="account-type-label">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Moneda</label>
            <div className="currency-options">
              {['EUR', 'USD', 'GBP'].map(currency => (
                <div
                  key={currency}
                  className={`currency-option ${formData.currency === currency ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, currency: currency }))}
                >
                  <div className="currency-icon">
                    {getCurrencyIcon(currency)}
                  </div>
                  <span className="currency-label">{currency}</span>
                </div>
              ))}
            </div>
          </div>

          {hasFamilies && (
            <div className="form-group">
              <label htmlFor="family_id">Asociar a familia (opcional)</label>
              <select
                id="family_id"
                name="family_id"
                value={formData.family_id || 'none'}
                onChange={handleChange}
              >
                <option value="none">Sin asociar a familia</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/accounts')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewAccount;
