import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';



const menuItems = [
  { text: 'Dashboard', iconClass: 'fas fa-chart-line', path: '/' },
  { text: 'Metas', iconClass: 'fas fa-flag', path: '/goals' },
  { text: 'Retos', iconClass: 'fas fa-trophy', path: '/challenges' },
  { text: 'Logros', iconClass: 'fas fa-star', path: '/achievements' }
];

export default function Layout() {
  const { mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
      if (window.innerWidth >= 600) {
        setMobileOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuToggle = () => {
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
  
  const drawer = (
    <div>
      <div className="layout-sidebar-title">
        <h2>EconomixAI</h2>
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
    </div>
  );
  
  return (
    <div className={`layout-container ${mode === 'dark' ? 'dark-mode' : ''}`}>
      <header className="layout-header">
        <button
          className="layout-menu-button"
          aria-label="open drawer"
          onClick={handleDrawerToggle}
        >
          <i className="fas fa-bars"></i>
        </button>
        <h1 className="layout-title">
          {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
        </h1>
        
        <button className="layout-icon-button" onClick={toggleTheme}>
          <i className={`fas ${mode === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          <span className="layout-tooltip">
            {mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </span>
        </button>
        
        <button
          className="layout-icon-button"
          onClick={handleProfileMenuToggle}
          aria-controls="profile-menu"
          aria-haspopup="true"
        >
          <div className="layout-avatar">
            {getInitials(user?.name)}
          </div>
          <span className="layout-tooltip">Perfil</span>
        </button>
        
        <div className={`layout-menu-dropdown ${menuOpen ? 'open' : ''}`}>
          <div className="layout-menu-dropdown-item" onClick={handleProfileClick}>
            <span className="layout-menu-dropdown-icon">
              <i className="fas fa-user"></i>
            </span>
            <span className="layout-menu-dropdown-text">Mi Perfil</span>
          </div>
          <div className="layout-menu-dropdown-item" onClick={handleLogout}>
            <span className="layout-menu-dropdown-icon">
              <i className="fas fa-sign-out-alt"></i>
            </span>
            <span className="layout-menu-dropdown-text">Cerrar Sesión</span>
          </div>
        </div>
      </header>
      
      <div className={`layout-sidebar-backdrop ${mobileOpen ? 'open' : ''}`} onClick={handleDrawerToggle}></div>
      
      <nav className={`layout-sidebar layout-sidebar-temporary ${mobileOpen ? 'open' : ''}`}>
        {drawer}
      </nav>
      
      <aside className="layout-sidebar layout-sidebar-permanent">
        {drawer}
      </aside>
      
      <main className="layout-main-content">
        <Outlet />
      </main>
    </div>
  );
}
