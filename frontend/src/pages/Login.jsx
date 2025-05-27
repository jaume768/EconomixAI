import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaGoogle, FaLock, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import './css/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validación básica
    const errors = {};
    if (!email) errors.email = 'El correo electrónico es obligatorio';
    if (!password) errors.password = 'La contraseña es obligatoria';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-box">
        <div className="login-paper">
          <div className="login-header">
            <div className="login-logo-circle">
              <FaLock />
            </div>
            <h1 className="login-title">Mi Riqueza</h1>
            <p className="login-subtitle">Iniciar Sesión</p>
          </div>
          
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}
          
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="login-form-group">
              <div className="login-input-container">
                <div className="login-input-icon">
                  <FaEnvelope />
                </div>
                <input
                  className={`login-input ${formErrors.email ? 'error' : ''}`}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Correo Electrónico"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {formErrors.email && (
                <div className="login-error-text">{formErrors.email}</div>
              )}
            </div>

            <div className="login-form-group">
              <div className="login-input-container">
                <div className="login-input-icon">
                  <FaLock />
                </div>
                <input
                  className={`login-input ${formErrors.password ? 'error' : ''}`}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formErrors.password && (
                <div className="login-error-text">{formErrors.password}</div>
              )}
            </div>

            <div className="login-options">
              <Link to="/forgot-password" className="login-link">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="login-submit-button"
            >
              Iniciar Sesión
            </button>
            
            <div className="login-divider">
              <span>o</span>
            </div>

            <button
              type="button"
              className="login-google-button"
              onClick={() => alert('Funcionalidad en desarrollo')}
            >
              <FaGoogle className="google-icon" />
              <span>Iniciar Sesión con Google</span>
            </button>
            
            <div className="login-signup-link">
              <span>¿No tienes cuenta? </span>
              <Link to="/register" className="login-link highlight">
                Regístrate
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
