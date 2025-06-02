import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';
import { FaChartLine, FaWallet, FaExchangeAlt, FaCalculator, FaChartBar, FaSignOutAlt, FaLink } from 'react-icons/fa';

const menuItems = [
  { text: 'Dashboard', icon: <FaChartLine />, path: '/dashboard' },
  { text: 'Cuentas', icon: <FaWallet />, path: '/accounts' },
  { text: 'Transacciones', icon: <FaExchangeAlt />, path: '/transactions' },
  { text: 'Simulador', icon: <FaCalculator />, path: '/simulator' },
  { text: 'Inversiones', icon: <FaChartBar />, path: '/investments' }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
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
    <div className="layout-container">
      {/* Sidebar para escritorio - oculto en móvil */}
      {!isMobile && (
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
                      {item.icon}
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
                <FaSignOutAlt />
              </span>
              <span className="layout-menu-text">Cerrar Sesión</span>
            </button>
          </div>
        </aside>
      )}
      
      <main className={`layout-main-content ${isMobile ? 'layout-mobile-content' : ''}`}>
        <Outlet />
      </main>
      
      {/* Barra de navegación inferior para móvil */}
      {isMobile && (
        <nav className="mobile-nav-bar">
          <Link to="/dashboard" className={`mobile-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <FaChartLine className="mobile-nav-icon" />
            <span className="mobile-nav-text">Inicio</span>
          </Link>
          <Link to="/accounts" className={`mobile-nav-item ${location.pathname === '/accounts' ? 'active' : ''}`}>
            <FaWallet className="mobile-nav-icon" />
            <span className="mobile-nav-text">Cuentas</span>
          </Link>
          <Link to="/transactions" className={`mobile-nav-item ${location.pathname === '/transactions' ? 'active' : ''}`}>
            <FaExchangeAlt className="mobile-nav-icon" />
            <span className="mobile-nav-text">Transacciones</span>
          </Link>
          <Link to="/simulator" className={`mobile-nav-item ${location.pathname === '/simulator' ? 'active' : ''}`}>
            <FaCalculator className="mobile-nav-icon" />
            <span className="mobile-nav-text">Simulador</span>
          </Link>
          <Link to="/investments" className={`mobile-nav-item ${location.pathname === '/investments' ? 'active' : ''}`}>
            <FaChartBar className="mobile-nav-icon" />
            <span className="mobile-nav-text">Inversiones</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
