import React from 'react';
import { Link } from 'react-router-dom';
import '../css/LandingPage.css';

const Header = () => (
  <header className="landing-header">
    <div className="landing-logo">
      <div className="landing-logo-circle">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" />
          <path d="M8 12H16M8 8H16M8 16H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <span>EconomixAI</span>
    </div>
    <nav className="landing-nav">
      <ul>
        <li><a href="#home">Inicio</a></li>
        <li><a href="#about">Sobre Nosotros</a></li>
        <li><a href="#service">Servicios</a></li>
        <li><a href="#contact">Contacto</a></li>
      </ul>
    </nav>
    <Link to="/login" className="landing-sign-in-button">Iniciar Sesión</Link>
  </header>
);

export default Header;
