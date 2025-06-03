import React from 'react';
import '../css/LandingPage.css';
import { FaFacebook, FaInstagram, FaTwitter, FaGithub } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-footer-content">
        <div className="landing-footer-column">
          <h3>EconomixAI</h3>
          <p>
            Democratizamos la planificación financiera mediante inteligencia artificial.
            Nuestro objetivo es hacer accesible el asesoramiento financiero de calidad para todos.
          </p>
          <div className="landing-social-links">
            <a href="#" aria-label="Facebook"><FaFacebook /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="Github"><FaGithub /></a>
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
          </div>
        </div>

        <div className="landing-footer-column">
          <h3>Empresa</h3>
          <ul>
            <li><a href="#about">Acerca de</a></li>
            <li><a href="#services">Servicios</a></li>
            <li><a href="#contact-us">Contáctanos</a></li>
          </ul>
        </div>

        <div className="landing-footer-column">
          <h3>Recursos</h3>
          <ul>
            <li><a href="#planes">Planes y Precios</a></li>
            <li><a href="#blog">Blog Financiero</a></li>
            <li><a href="#guias">Guías y Tutoriales</a></li>
          </ul>
        </div>

        <div className="landing-footer-column">
          <h3>Contáctanos</h3>
          <p className="landing-contact-info">123-456790</p>
          <p className="landing-contact-info">economixai@contact.com</p>
        </div>
      </div>

      <div className="landing-footer-bottom">
        <p>Copyright &copy; EconomixAI {currentYear}. Cumplimiento GDPR y PSD2. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
