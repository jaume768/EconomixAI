import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import './css/LandingPage.css';
import mobileImg1 from '../assets/mobile-dashboard.png';
import mobileImg2 from '../assets/mobile-stats.png';
import expenseIcon from '../assets/expense-icon.svg';
import smartBudgetIcon from '../assets/smart-budget-icon.svg';
import goalIcon from '../assets/goal-icon.svg';
import securityMobileImg from '../assets/security-mobile.svg';
import privacyIcon from '../assets/privacy-icon.svg';
import encryptionIcon from '../assets/encryption-icon.svg';
import authIcon from '../assets/auth-icon.svg';
import monitoringIcon from '../assets/monitoring-icon.svg';
import avatar1 from '../assets/avatar-1.svg';
import avatar2 from '../assets/avatar-2.svg';
import avatar3 from '../assets/avatar-3.svg';
import ctaMobileImg from '../assets/cta-mobile.svg';
import { FaFacebook, FaInstagram, FaTwitter, FaGithub } from 'react-icons/fa';
import CombinedFeaturesSocialProof from './CombinedFeaturesSocialProof';

// Componente Header
const Header = () => (
  <header className="landing-header">
    <div className="landing-logo">
      <div className="landing-logo-circle">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" />
          <path d="M8 12H16M8 8H16M8 16H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <span>Mi Riqueza</span>
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

// Componente Hero Section con animación al hacer scroll
const HeroSection = () => {
  const { ref: heroRef, inView: heroInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-100px',
  });

  return (
    <section className="landing-hero-section" ref={heroRef}>
      <div className={`landing-hero-content ${heroInView ? 'animate-fade-in-left' : ''}`}>
        <h1>
          <span className="landing-highlight">Optimiza</span> tus<br />
          gastos financieros
        </h1>
        <p>
          Bienvenido a Mi Riqueza, ya sea que estés planificando tu jubilación,
          invirtiendo en acciones o gestionando tu presupuesto, estamos aquí para
          guiarte en cada paso.
        </p>
        <div className="landing-cta-buttons">
          <Link to="/register" className="landing-try-now-button">Pruébalo Ahora</Link>
          <a href="#learn-more" className="landing-learn-more-button">Más Información <span>→</span></a>
        </div>
      </div>
      <div className={`landing-hero-images ${heroInView ? 'animate-fade-in-right' : ''}`}>
        <img src={mobileImg1} alt="Panel móvil mostrando saldo de $789,500" className="landing-mobile-img1" />
        <img src={mobileImg2} alt="Estadísticas móviles mostrando análisis de gastos" className="landing-mobile-img2" />
      </div>
    </section>
  );
};

// Componente Tool Card para la sección de herramientas
const ToolCard = ({ icon, title, description, isVisible, delay }) => (
  <div className={`landing-tool-card ${isVisible ? 'animate-fade-in-up' : ''}`} style={{ transitionDelay: delay }}>
    <div className="landing-tool-icon">
      <img src={icon} alt={`${title} icon`} />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

// Componente Tools Section
const ToolsSection = () => {
  const { ref: toolsRef, inView: toolsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px',
  });

  return (
    <section className="landing-tools-section" id="tools" ref={toolsRef}>
      <h2 className={`landing-section-title ${toolsInView ? 'animate-fade-in-down' : ''}`}>
        Herramientas <span className="landing-highlight">Esenciales</span>
      </h2>
      <p className={`landing-section-subtitle ${toolsInView ? 'animate-fade-in-down' : ''}`}>
        Explora las potentes funciones y herramientas que Mi Riqueza ofrece para
        optimizar tu gestión financiera y mejorar tu experiencia de inversión.
      </p>

      <div className="landing-tools-grid">
        <ToolCard
          icon={expenseIcon}
          title="Seguimiento de Gastos"
          description="Registra y categoriza fácilmente todos tus gastos. Obtén una visión clara de a dónde va tu dinero y gestiona tu presupuesto en tiempo real."
          isVisible={toolsInView}
          delay="0s"
        />

        <ToolCard
          icon={smartBudgetIcon}
          title="Presupuestación Inteligente"
          description="Planifica, gestiona y personaliza presupuestos sin esfuerzo, asigna fondos, controla gastos y sigue el progreso hacia tus metas con facilidad."
          isVisible={toolsInView}
          delay="0.2s"
        />

        <ToolCard
          icon={goalIcon}
          title="Ahorro Orientado a Objetivos"
          description="Establece objetivos de ahorro significativos, sigue el progreso en tiempo real y utiliza recomendaciones personalizadas para hacer realidad tus metas."
          isVisible={toolsInView}
          delay="0.4s"
        />
      </div>
    </section>
  );
};

// Componente Social Proof Section
const SocialProofSection = () => (
  <section className="landing-social-proof">
    <div className="landing-user-avatars">
      {/* Placeholder avatars */}
      <div className="landing-avatar"></div>
      <div className="landing-avatar"></div>
      <div className="landing-avatar"></div>
      <div className="landing-avatar"></div>
      <div className="landing-avatar-more">5M+</div>
    </div>
    <p>Descargado más de 5M+ en un año</p>
  </section>
);

// Componente de Seguridad con animaciones
const SecuritySection = () => {
  const { ref: securityRef, inView: securityInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="landing-security-section" id="security" ref={securityRef}>
      <h2 className={`landing-section-title ${securityInView ? 'animate-fade-in-down' : ''}`}>
        Tu <span className="landing-highlight">seguridad</span> es nuestra prioridad
      </h2>
      <p className={`landing-section-subtitle ${securityInView ? 'animate-fade-in-down' : ''}`}>
        Desde estrategias de inversión hasta planes de ahorro, tenemos opciones para
        cada etapa de tu viaje financiero.
      </p>

      <div className="landing-security-container">
        <div className="landing-security-cards landing-security-left">
          <div className={`landing-security-card ${securityInView ? 'animate-slide-in-left' : ''}`} style={{ transitionDelay: '0.1s' }}>
            <div className="landing-security-icon">
              <img src={privacyIcon} alt="Icono de privacidad de datos" />
            </div>
            <h3>Cumplimiento de Privacidad de Datos</h3>
            <p>Cumplimos totalmente con leyes de protección de datos como RGPD y CCPA.</p>
          </div>

          <div className={`landing-security-card ${securityInView ? 'animate-slide-in-left' : ''}`} style={{ transitionDelay: '0.3s' }}>
            <div className="landing-security-icon">
              <img src={authIcon} alt="Icono de autenticación" />
            </div>
            <h3>Autenticación Segura</h3>
            <p>La autenticación de dos factores (2FA) y opciones de inicio de sesión biométrico añaden una capa extra de seguridad.</p>
          </div>
        </div>

        <div className={`landing-security-mobile ${securityInView ? 'animate-fade-in-up' : ''}`} style={{ transitionDelay: '0.2s' }}>
          <img src={securityMobileImg} alt="Verificación de seguridad en móvil" />
        </div>

        <div className="landing-security-cards landing-security-right">
          <div className={`landing-security-card ${securityInView ? 'animate-slide-in-right' : ''}`} style={{ transitionDelay: '0.1s' }}>
            <div className="landing-security-icon">
              <img src={encryptionIcon} alt="Icono de encriptación" />
            </div>
            <h3>Encriptación de Nivel Bancario</h3>
            <p>Toda la información sensible está protegida con estándares avanzados de encriptación (AES-256).</p>
          </div>

          <div className={`landing-security-card ${securityInView ? 'animate-slide-in-right' : ''}`} style={{ transitionDelay: '0.3s' }}>
            <div className="landing-security-icon">
              <img src={monitoringIcon} alt="Icono de monitorización" />
            </div>
            <h3>Monitorización 24/7</h3>
            <p>Nuestro equipo de seguridad monitorea el sistema las 24 horas del día para detectar y prevenir cualquier actividad sospechosa.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Componente de Tarjeta de Testimonio con animación
const TestimonialCard = ({ rating, title, quote, name, position, avatar, isVisible, delay }) => (
  <div className={`landing-testimonial-card ${isVisible ? 'animate-scale-in' : ''}`} style={{ transitionDelay: delay }}>
    <div className="landing-testimonial-rating">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < rating ? "landing-star-filled" : "landing-star-empty"}>★</span>
      ))}
      <span className="landing-rating-number">{rating}</span>
    </div>
    <h3 className="landing-testimonial-title">"{title}"</h3>
    <p className="landing-testimonial-quote">"{quote}"</p>
    <div className="landing-testimonial-author">
      <img src={avatar} alt={`Avatar de ${name}`} />
      <div>
        <h4>{name}</h4>
        <p>{position}</p>
      </div>
    </div>
  </div>
);

// Componente de Testimonios con animación
const TestimonialsSection = () => {
  const { ref: testimonialsRef, inView: testimonialsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px',
  });

  return (
    <section className="landing-testimonials-section" id="testimonials" ref={testimonialsRef}>
      <h2 className={`landing-section-title ${testimonialsInView ? 'animate-fade-in-down' : ''}`}>
        Lo que nuestros <span className="landing-highlight">usuarios</span> dicen
      </h2>
      <p className={`landing-section-subtitle ${testimonialsInView ? 'animate-fade-in-down' : ''}`}>
        Desde estrategias de inversión hasta planes de ahorro, tenemos opciones para
        cada etapa de tu viaje financiero.
      </p>

      <div className="landing-testimonials-grid">
        <TestimonialCard
          rating={4}
          title="Facilidad de uso"
          quote="Me encanta la sencillez de esta aplicación. El seguimiento de gastos y los recordatorios me han hecho más constante con mi planificación financiera. ¡Muy recomendable!"
          name="Sarah W."
          position="Autónoma"
          avatar={avatar1}
          isVisible={testimonialsInView}
          delay="0s"
        />

        <TestimonialCard
          rating={4.5}
          title="Control de gastos"
          quote="Los conocimientos y desgloses visuales realmente me ayudan a entender mis hábitos de gasto. Ahora tengo un control total, lo que me permite mejorar mis finanzas."
          name="Mark T."
          position="Profesor"
          avatar={avatar2}
          isVisible={testimonialsInView}
          delay="0.2s"
        />

        <TestimonialCard
          rating={4.9}
          title="Gestión"
          quote="¡Esta aplicación ha transformado completamente la forma en que gestiono mi dinero! Finalmente puedo ahorrar cada mes y vivir con más comodidad."
          name="Jessica L."
          position="Especialista en Marketing"
          avatar={avatar3}
          isVisible={testimonialsInView}
          delay="0.4s"
        />
      </div>
    </section>
  );
};

// Componente de CTA con animación
const CtaSection = () => {
  const { ref: ctaRef, inView: ctaInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="landing-cta-section" ref={ctaRef}>
      <div className="landing-cta-container">
        <div className={`landing-cta-mobile ${ctaInView ? 'animate-slide-in-left' : ''}`}>
          <img src={ctaMobileImg} alt="Interfaz de la aplicación móvil" />
        </div>
        <div className={`landing-cta-content ${ctaInView ? 'animate-slide-in-right' : ''}`}>
          <h2>Toma el control de tus finanzas con Mi Riqueza</h2>
          <p>
            Comienza gratis y desbloquea potentes herramientas para rastrear
            gastos, gestionar presupuestos y aumentar tus ahorros.
          </p>
          <Link to="/register" className="landing-cta-button">Comenzar Gratis</Link>
        </div>
      </div>
    </section>
  );
};

// Componente Footer
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-footer-content">
        <div className="landing-footer-column">
          <h3>Mi Riqueza</h3>
          <p>
            Bienvenido a Mi Riqueza, donde creemos en empoderar a las personas para
            tomar control de su futuro financiero.
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
            <li><a href="#careers">Carreras</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#legal">Legal</a></li>
          </ul>
        </div>

        <div className="landing-footer-column">
          <h3>Contáctanos</h3>
          <p className="landing-contact-info">123-456790</p>
          <p className="landing-contact-info">miwealth@contact.com</p>
        </div>
      </div>

      <div className="landing-footer-bottom">
        <p>Copyright &copy; Chyvo {currentYear}. Todos los derechos reservados</p>
      </div>
    </footer>
  );
};

// Componente Principal LandingPage
const LandingPage = () => {
  return (
    <div className="landing-container">
      <Header />
      <HeroSection />
      <CombinedFeaturesSocialProof />
      <ToolsSection />
      <SecuritySection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
