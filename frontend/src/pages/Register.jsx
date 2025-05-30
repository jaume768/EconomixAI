import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash, FaUserCircle, FaArrowRight, FaCheck, FaMoneyBillWave, FaGoogle } from 'react-icons/fa';
import axios from 'axios';
import './css/Register.css';

const Register = () => {
  // Estado para controlar los pasos del registro
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [verificationStatus, setVerificationStatus] = useState('');
  const { register, error, setError, setJustRegistered } = useAuth();
  const navigate = useNavigate();
  // Total de pasos en el proceso de registro
  const totalSteps = 4;

  // Estado para almacenar los datos del formulario a través de los pasos
  const [formData, setFormData] = useState(() => {
    // Intentar recuperar datos del localStorage por si el usuario refrescó la página
    const savedData = localStorage.getItem('registerFormData');
    return savedData ? JSON.parse(savedData) : {
      email: '',
      password: '',
      verificationCode: '',
      username: '',
      first_name: '',
      last_name: '',
      second_last_name: '',
      plan: 'individual',
      initial_balance: ''
    };
  });

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('registerFormData', JSON.stringify(formData));
  }, [formData]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Para el campo de contraseña, evaluar la fortaleza
    if (name === 'password') {
      evaluatePasswordStrength(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Evaluar la fortaleza de la contraseña (0-3)
  const evaluatePasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  };

  // Validar email y contraseña (Paso 1)
  const validateEmailAndPassword = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El correo electrónico no es válido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    return errors;
  };

  // Validar código de verificación (Paso 2)
  const validateVerificationCode = () => {
    const errors = {};

    if (!formData.verificationCode) {
      errors.verificationCode = 'El código de verificación es obligatorio';
    } else if (formData.verificationCode.length !== 6 || !/^\d+$/.test(formData.verificationCode)) {
      errors.verificationCode = 'El código debe ser de 6 dígitos';
    }

    return errors;
  };

  // Validar datos de perfil (Paso 3)
  const validateProfileData = () => {
    const errors = {};

    if (!formData.username) errors.username = 'El nombre de usuario es obligatorio';
    if (!formData.first_name) errors.first_name = 'El nombre es obligatorio';
    if (!formData.last_name) errors.last_name = 'El primer apellido es obligatorio';
    // El segundo apellido es opcional

    return errors;
  };

  // Validar datos financieros (Paso 4)
  const validateFinancialData = () => {
    const errors = {};

    if (formData.initial_balance) {
      if (!/^\d+(\.\d{1,2})?$/.test(formData.initial_balance)) {
        errors.initial_balance = 'El saldo debe ser un número positivo válido';
      } else if (parseFloat(formData.initial_balance) <= 0) {
        errors.initial_balance = 'El saldo debe ser mayor que cero';
      }
    }

    return errors;
  };

  // Avanzar al siguiente paso
  const goToNextStep = async () => {
    let errors = {};

    // Validar según el paso actual
    if (step === 1) {
      errors = validateEmailAndPassword();

      if (Object.keys(errors).length === 0) {
        setLoading(true);
        try {
          // Enviar solicitud para generar código de verificación
          const response = await axios.post('/api/auth/send-verification-code', {
            email: formData.email
          });

          if (response.data.success) {
            setStep(2);
            setVerificationStatus('El código ha sido enviado a tu correo');
          } else {
            setError(response.data.message || 'Error al enviar el código');
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Error de conexión');
        } finally {
          setLoading(false);
        }
      }
    } else if (step === 2) {
      errors = validateVerificationCode();

      if (Object.keys(errors).length === 0) {
        setLoading(true);
        try {
          // Verificar el código ingresado
          const response = await axios.post('/api/auth/verify-code', {
            email: formData.email,
            code: formData.verificationCode
          });

          if (response.data.success) {
            setStep(3);
          } else {
            setError(response.data.message || 'Código incorrecto');
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Error de conexión');
        } finally {
          setLoading(false);
        }
      }
    } else if (step === 3) {
      errors = validateProfileData();

      if (Object.keys(errors).length === 0) {
        setStep(4);
      }
    } else if (step === 4) {
      errors = validateFinancialData();

      if (Object.keys(errors).length === 0) {
        handleRegister();
      }
    }

    setFormErrors(errors);
  };

  // Reenviar código de verificación
  const resendVerificationCode = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/send-verification-code', {
        email: formData.email,
        resend: true
      });

      if (response.data.success) {
        setVerificationStatus('Nuevo código enviado a tu correo');
      } else {
        setError(response.data.message || 'Error al reenviar el código');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Registrar usuario (paso final)
  const handleRegister = async () => {
    setLoading(true);

    try {
      // Realizar el registro final con todos los datos
      const success = await register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        second_last_name: formData.second_last_name || null,
        plan: formData.plan,
        initial_balance: formData.initial_balance || '0'
      });

      if (success) {
        // Limpiar localStorage y avanzar a la pantalla de éxito
        localStorage.removeItem('registerFormData');
        setStep(5);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Ir al dashboard después del registro exitoso
  const goToDashboard = () => {
    // Resetear el estado justRegistered antes de navegar
    setJustRegistered(false);
    navigate('/dashboard');
  };

  // Renderizar el paso actual
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2 className="register-step-title">Paso 1/{totalSteps} - Email & Contraseña</h2>

            <div className="register-form-group">
              <label className="register-label" htmlFor="email">Correo Electrónico</label>
              <div className="register-input-container">
                <div className="register-input-icon">
                  <FaEnvelope />
                </div>
                <input
                  className={`register-input ${formErrors.email ? 'error' : ''}`}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Correo Electrónico"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {formErrors.email && (
                <div className="register-error-text">{formErrors.email}</div>
              )}
            </div>

            <div className="register-form-group">
              <label className="register-label" htmlFor="password">Contraseña</label>
              <div className="register-input-container">
                <div className="register-input-icon">
                  <FaLock />
                </div>
                <input
                  className={`register-input ${formErrors.password ? 'error' : ''}`}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formErrors.password && (
                <div className="register-error-text">{formErrors.password}</div>
              )}

              {/* Indicador de fortaleza de contraseña */}
              {formData.password && (
                <div className="password-strength-container">
                  <div className="password-strength-text">
                    {passwordStrength < 2 ? 'Débil' : passwordStrength < 4 ? 'Media' : 'Fuerte'}
                  </div>
                  <div className="password-strength-meter">
                    <div className={`password-strength-value strength-${passwordStrength}`}></div>
                  </div>
                </div>
              )}

              <div className="register-password-info">
                La contraseña debe tener mínimo 8 caracteres.
              </div>
            </div>

            <div className="register-social-login">
              <button 
                type="button" 
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '30px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '10px',
                  marginBottom: '15px'
                }}
                onClick={() => alert('Funcionalidad en desarrollo')}
                disabled={loading}
              >
                <FaGoogle style={{ color: '#fff', fontSize: '18px', marginRight: '8px' }} />
                <span>Iniciar sesión con Google</span>
              </button>
            </div>

            <div className="register-actions">
              <button
                type="button"
                className="register-next-btn"
                onClick={goToNextStep}
                disabled={loading}
              >
                Siguiente <FaArrowRight />
              </button>
            </div>

            <div className="register-login-link">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <h2 className="register-step-title">Paso 2/{totalSteps} - Verificación de Email</h2>

            <div className="register-progress">
              <div className="register-progress-bar">
                <div className="register-progress-value" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
              </div>
              <div className="register-progress-text">2/{totalSteps}</div>
            </div>

            <div className="register-verification-info">
              Te hemos enviado un código de 6 dígitos a tu correo.
              <span className="register-email-display">{formData.email}</span>
            </div>

            <div className="register-form-group">
              <label className="register-label" htmlFor="verificationCode">Código de verificación</label>
              <div className="register-input-container">
                <input
                  className={`register-input verification-code ${formErrors.verificationCode ? 'error' : ''}`}
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  placeholder="Código de 6 dígitos"
                  maxLength="6"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {formErrors.verificationCode && (
                <div className="register-error-text">{formErrors.verificationCode}</div>
              )}
              {verificationStatus && (
                <div className="register-verification-status">{verificationStatus}</div>
              )}
            </div>

            <div className="register-actions">
              <button
                type="button"
                className="register-confirm-btn"
                onClick={goToNextStep}
                disabled={loading}
              >
                Confirmar código <FaCheck />
              </button>

              <button
                type="button"
                className="register-resend-btn"
                onClick={resendVerificationCode}
                disabled={loading}
              >
                Reenviar código
              </button>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 className="register-step-title">Paso 3/{totalSteps} - Datos de Perfil</h2>

            <div className="register-progress">
              <div className="register-progress-bar">
                <div className="register-progress-value" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
              </div>
              <div className="register-progress-text">3/{totalSteps}</div>
            </div>

            <div className="register-profile-section">
              <h3 className="register-section-title">Datos básicos</h3>

              <div className="register-form-group">
                <label className="register-label" htmlFor="first_name">Nombre</label>
                <div className="register-input-container">
                  <div className="register-input-icon">
                    <FaUser />
                  </div>
                  <input
                    className={`register-input ${formErrors.first_name ? 'error' : ''}`}
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="Nombre"
                    autoComplete="given-name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {formErrors.first_name && (
                  <div className="register-error-text">{formErrors.first_name}</div>
                )}
              </div>

              <div className="register-form-group">
                <label className="register-label" htmlFor="last_name">Primer apellido</label>
                <div className="register-input-container">
                  <div className="register-input-icon">
                    <FaUser />
                  </div>
                  <input
                    className={`register-input ${formErrors.last_name ? 'error' : ''}`}
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Primer apellido"
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {formErrors.last_name && (
                  <div className="register-error-text">{formErrors.last_name}</div>
                )}
              </div>

              <div className="register-form-group">
                <label className="register-label" htmlFor="second_last_name">Segundo apellido (opcional)</label>
                <div className="register-input-container">
                  <div className="register-input-icon">
                    <FaUser />
                  </div>
                  <input
                    className="register-input"
                    id="second_last_name"
                    name="second_last_name"
                    type="text"
                    placeholder="Segundo apellido (opcional)"
                    value={formData.second_last_name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="register-form-group">
                <label className="register-label" htmlFor="username">Username</label>
                <div className="register-input-container">
                  <div className="register-input-icon">
                    <FaUserCircle />
                  </div>
                  <input
                    className={`register-input ${formErrors.username ? 'error' : ''}`}
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Nombre de usuario"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {formErrors.username && (
                  <div className="register-error-text">{formErrors.username}</div>
                )}
                <div className="register-field-info">
                  Tu identificador público en la app.
                </div>
              </div>
            </div>

            <div className="register-actions">
              <button
                type="button"
                className="register-next-btn"
                onClick={goToNextStep}
                disabled={loading}
              >
                Siguiente <FaArrowRight />
              </button>
            </div>
          </>
        );

      case 4:
        return (
          <>
            <h2 className="register-step-title">Paso 4/{totalSteps} - Plan y Finanzas</h2>

            <div className="register-progress">
              <div className="register-progress-bar">
                <div className="register-progress-value" style={{ width: '100%' }}></div>
              </div>
              <div className="register-progress-text">4/{totalSteps}</div>
            </div>

            <div className="register-finance-section">
              <h3 className="register-section-title">Plan y finanzas iniciales</h3>

              <div className="register-form-group">
                <label className="register-label">Selección de plan</label>
                <div className="register-plan-options">
                  <div className="register-plan-option">
                    <input
                      type="radio"
                      id="individual"
                      name="plan"
                      value="individual"
                      checked={formData.plan === 'individual'}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <label htmlFor="individual">Individual</label>
                  </div>
                  <div className="register-plan-option">
                    <input
                      type="radio"
                      id="familiar"
                      name="plan"
                      value="familiar"
                      checked={formData.plan === 'familiar'}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <label htmlFor="familiar">Familiar (hasta 5 miembros)</label>
                  </div>
                </div>
                <div className="register-field-info">
                  Podrás cambiarlo más adelante.
                </div>
              </div>

              <div className="register-form-group">
                <label className="register-label" htmlFor="initial_balance">
                  Saldo actual (opcional, para recomendaciones inmediatas)
                </label>
                <div className="register-input-container">
                  <div className="register-input-icon">
                    <FaMoneyBillWave />
                  </div>
                  <input
                    className={`register-input ${formErrors.initial_balance ? 'error' : ''}`}
                    id="initial_balance"
                    name="initial_balance"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej. 1200.00"
                    value={formData.initial_balance}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {formErrors.initial_balance && (
                  <div className="register-error-text">{formErrors.initial_balance}</div>
                )}
              </div>
            </div>

            <div className="register-actions">
              <button
                type="button"
                className="register-submit-btn"
                onClick={goToNextStep}
                disabled={loading}
              >
                Finalizar registro
              </button>
            </div>
          </>
        );

      case 5:
        return (
          <div className="register-success">
            <div className="register-success-icon">
              <FaCheck />
            </div>
            <h2 className="register-success-title">
              ¡Todo listo! Bienvenido, {formData.first_name}.
            </h2>
            <p className="register-success-message">
              Tu cuenta ha sido creada correctamente. Ahora puedes comenzar a usar EconomixAI.
            </p>
            <button
              type="button"
              className="register-dashboard-btn"
              onClick={goToDashboard}
            >
              Ir al Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="register-container">
      <div className="register-background"></div>
      <div className="register-box">
        <div className="register-paper">
          <div className="register-header">
            <div className="register-logo-circle">
              <FaUserCircle />
            </div>
            <h1 className="register-title">EconomixAI</h1>
            {step < 4 && <p className="register-subtitle">Crear Cuenta</p>}
          </div>

          {error && (
            <div className="register-error">
              {error}
            </div>
          )}

          <form className="register-form" onSubmit={(e) => e.preventDefault()} noValidate>
            {renderStep()}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;