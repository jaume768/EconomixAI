import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { register, error } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username) errors.username = 'El nombre de usuario es obligatorio';
    if (!formData.first_name) errors.first_name = 'El nombre es obligatorio';
    if (!formData.last_name) errors.last_name = 'El apellido es obligatorio';
    if (!formData.email) errors.email = 'El correo electrónico es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'El correo electrónico no es válido';
    
    if (!formData.password) errors.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Limpiar errores previos
    setFormErrors({});
    
    // Intentar registro
    const success = await register({
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password
    });
    
    if (success) {
      navigate('/login', { state: { message: 'Registro exitoso. Por favor, inicia sesión.' } });
    }
  };

  return (
    <div className={`register-container ${mode === 'dark' ? 'dark-mode' : ''}`}>
      <div className="register-box">
        <div className="register-paper">
          <div className="register-avatar">
            <i className="fas fa-user"></i>
          </div>
          <h1 className="register-title">
            Crear Cuenta
          </h1>
          
          {error && (
            <div className="register-error">
              {error}
            </div>
          )}
          
          <form className="register-form" onSubmit={handleRegister} noValidate>
            <div className="register-form-group">
              <label className="register-label" htmlFor="username">Nombre de Usuario</label>
              <input
                className={`register-input ${formErrors.username ? 'error' : ''}`}
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
              />
              {formErrors.username && (
                <div className="register-error-text">{formErrors.username}</div>
              )}
            </div>

            <div className="register-form-group">
              <label className="register-label" htmlFor="first_name">Nombre</label>
              <input
                className={`register-input ${formErrors.first_name ? 'error' : ''}`}
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                value={formData.first_name}
                onChange={handleChange}
              />
              {formErrors.first_name && (
                <div className="register-error-text">{formErrors.first_name}</div>
              )}
            </div>

            <div className="register-form-group">
              <label className="register-label" htmlFor="last_name">Apellido</label>
              <input
                className={`register-input ${formErrors.last_name ? 'error' : ''}`}
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                value={formData.last_name}
                onChange={handleChange}
              />
              {formErrors.last_name && (
                <div className="register-error-text">{formErrors.last_name}</div>
              )}
            </div>

            <div className="register-form-group">
              <label className="register-label" htmlFor="email">Correo Electrónico</label>
              <input
                className={`register-input ${formErrors.email ? 'error' : ''}`}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
              {formErrors.email && (
                <div className="register-error-text">{formErrors.email}</div>
              )}
            </div>

            <div className="register-form-group">
              <label className="register-label" htmlFor="password">Contraseña</label>
              <input
                className={`register-input ${formErrors.password ? 'error' : ''}`}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
              {formErrors.password && (
                <div className="register-error-text">{formErrors.password}</div>
              )}
            </div>

            <div className="register-form-group">
              <label className="register-label" htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                className={`register-input ${formErrors.confirmPassword ? 'error' : ''}`}
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
              {formErrors.confirmPassword && (
                <div className="register-error-text">{formErrors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              className="register-submit-button"
            >
              Registrarse
            </button>
            
            <div className="register-links">
              <Link to="/login" className="register-link">
                ¿Ya tienes una cuenta? Inicia sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
