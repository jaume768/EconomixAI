import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './css/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { login, error } = useAuth();
  const { mode } = useTheme();
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
    <div className={`login-container ${mode === 'dark' ? 'dark-mode' : ''}`}>
      <div className="login-box">
        <div className="login-paper">
          <div className="login-avatar">
            <i className="fas fa-lock"></i>
          </div>
          <h1 className="login-title">
            Iniciar Sesión
          </h1>
          
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}
          
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="login-form-group">
              <label className="login-label" htmlFor="email">Correo Electrónico</label>
              <input
                className={`login-input ${formErrors.email ? 'error' : ''}`}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {formErrors.email && (
                <div className="login-error-text">{formErrors.email}</div>
              )}
            </div>

            <div className="login-form-group">
              <label className="login-label" htmlFor="password">Contraseña</label>
              <input
                className={`login-input ${formErrors.password ? 'error' : ''}`}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
              {formErrors.password && (
                <div className="login-error-text">{formErrors.password}</div>
              )}
            </div>

            <button
              type="submit"
              className="login-submit-button"
            >
              Iniciar Sesión
            </button>
            
            <div className="login-links">
              <Link to="/forgot-password" className="login-link">
                ¿Olvidaste tu contraseña?
              </Link>
              <Link to="/register" className="login-link">
                ¿No tienes cuenta? Regístrate
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
