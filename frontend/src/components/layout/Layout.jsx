import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

const menuItems = [
  { text: 'Dashboard', iconClass: 'fas fa-chart-line', path: '/dashboard' },
  { text: 'Metas', iconClass: 'fas fa-flag', path: '/goals' },
  { text: 'Retos', iconClass: 'fas fa-trophy', path: '/challenges' },
  { text: 'Logros', iconClass: 'fas fa-star', path: '/achievements' }
];

export default function Layout() {
  const { mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleProfileMenuToggle = (e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
    setMenuOpen(false);
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className={`layout-container ${mode === 'dark' ? 'dark-mode' : ''}`}>
      <aside className="layout-sidebar">
        <div className="layout-sidebar-title">
          <h2>EconomixAI</h2>
        </div>
        <div className="layout-divider"></div>
        <div className="layout-sidebar-user">
          <div className="layout-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="layout-sidebar-username">
            {user?.name || 'Usuario'}
          </div>
          <button className="layout-theme-toggle" onClick={toggleTheme}>
            <i className={`fas ${mode === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
        <div className="layout-divider"></div>
        <ul className="layout-menu">
          {menuItems.map((item) => (
            <li key={item.text}>
              <Link 
                to={item.path} 
                className="layout-menu-item"
              >
                <div className={`layout-menu-button ${location.pathname === item.path ? 'selected' : ''}`}>
                  <span className="layout-menu-icon">
                    <i className={item.iconClass}></i>
                  </span>
                  <span className="layout-menu-text">{item.text}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="layout-sidebar-footer">
          <button 
            className="layout-menu-button layout-logout-button" 
            onClick={handleLogout}
          >
            <span className="layout-menu-icon">
              <i className="fas fa-sign-out-alt"></i>
            </span>
            <span className="layout-menu-text">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      
      <main className="layout-main-content">
        <Outlet />
      </main>
    </div>
  );
}
