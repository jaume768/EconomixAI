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
          Tu <span className="landing-highlight">asesor financiero</span><br />
          personal con IA
        </h1>
        <p>
          EconomixAI democratiza la planificación financiera con inteligencia artificial.
          Un asesor disponible 24/7, asequible y automatizado que te ayuda a mejorar
          tu salud financiera sin depender de asesores tradicionales costosos.
        </p>
        <div className="landing-cta-buttons">
          <Link to="/register" className="landing-try-now-button">Comenzar Gratis</Link>
          <a href="#learn-more" className="landing-learn-more-button">Conoce Nuestros Planes <span>→</span></a>
        </div>
      </div>
      <div className={`landing-hero-images ${heroInView ? 'animate-fade-in-right' : ''}`}>
        <img src={mobileImg1} alt="Panel móvil mostrando dashboard financiero" className="landing-mobile-img1" />
        <img src={mobileImg2} alt="Estadísticas móviles con análisis de gastos" className="landing-mobile-img2" />
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
        Funcionalidades <span className="landing-highlight">Inteligentes</span>
      </h2>
      <p className={`landing-section-subtitle ${toolsInView ? 'animate-fade-in-down' : ''}`}>
        Nuestro asesor financiero con IA te ofrece herramientas avanzadas para analizar,
        planificar y optimizar tus finanzas personales o familiares.
      </p>

      <div className="landing-tools-grid">
        <ToolCard
          icon={expenseIcon}
          title="Recomendaciones Personalizadas"
          description="Recibe consejos financieros adaptados a tu perfil de riesgo y objetivos. Nuestro sistema de IA genera presupuestos sugeridos y tips de ahorro específicos para ti."
          isVisible={toolsInView}
          delay="0s"
        />

        <ToolCard
          icon={smartBudgetIcon}
          title="Alertas y Previsiones"
          description="Mantente informado con alertas proactivas para pagos próximos y gastos inusuales. Visualiza tu cash-flow a futuro para detectar posibles tensiones de liquidez."
          isVisible={toolsInView}
          delay="0.2s"
        />

        <ToolCard
          icon={goalIcon}
          title="Simulador 'What-if'"
          description="Explora diferentes escenarios financieros y visualiza cómo afectarían tus decisiones a tu economía. Planifica a 3, 6 y 12 meses con proyecciones basadas en tus datos reales."
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
        Seguridad y <span className="landing-highlight">Cumplimiento</span> Normativo
      </h2>
      <p className={`landing-section-subtitle ${securityInView ? 'animate-fade-in-down' : ''}`}>
        Protegemos tus datos financieros con los más altos estándares de seguridad y
        cumplimos con todas las regulaciones aplicables del sector financiero.
      </p>

      <div className="landing-security-container">
        <div className="landing-security-cards landing-security-left">
          <div className={`landing-security-card ${securityInView ? 'animate-slide-in-left' : ''}`} style={{ transitionDelay: '0.1s' }}>
            <div className="landing-security-icon">
              <img src={privacyIcon} alt="Icono de privacidad de datos" />
            </div>
            <h3>Cumplimiento GDPR</h3>
            <p>Garantizamos tu derecho al olvido y requerimos tu consentimiento explícito para el tratamiento de datos personales.</p>
          </div>

          <div className={`landing-security-card ${securityInView ? 'animate-slide-in-left' : ''}`} style={{ transitionDelay: '0.3s' }}>
            <div className="landing-security-icon">
              <img src={authIcon} alt="Icono de autenticación" />
            </div>
            <h3>Autenticación de Dos Factores</h3>
            <p>Implementamos 2FA para todas las cuentas, asegurando que solo tú puedas acceder a tu información financiera personal.</p>
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
            <h3>Tokenización y Cifrado</h3>
            <p>Utilizamos cifrado de extremo a extremo y tokenización para proteger tus datos bancarios con estándares de nivel financiero.</p>
          </div>

          <div className={`landing-security-card ${securityInView ? 'animate-slide-in-right' : ''}`} style={{ transitionDelay: '0.3s' }}>
            <div className="landing-security-icon">
              <img src={monitoringIcon} alt="Icono de monitorización" />
            </div>
            <h3>Auditorías de Seguridad</h3>
            <p>Realizamos auditorías de seguridad regulares (pentesting) y cumplimos con los estándares ISO 27001 para garantizar la protección de tus datos.</p>
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
        Historias de <span className="landing-highlight">Éxito</span> Financiero
      </h2>
      <p className={`landing-section-subtitle ${testimonialsInView ? 'animate-fade-in-down' : ''}`}>
        Descubre cómo nuestro asesor financiero con IA ha ayudado a personas reales a
        mejorar su salud financiera y alcanzar sus objetivos económicos.
      </p>

      <div className="landing-testimonials-grid">
        <TestimonialCard
          rating={4.8}
          title="Finanzas Familiares"
          quote="Las proyecciones de cash-flow y el simulador 'What-if' nos permitieron planificar la educación de nuestros hijos y al mismo tiempo mantener nuestro presupuesto mensual bajo control."
          name="Laura M."
          position="Madre de familia"
          avatar={avatar1}
          isVisible={testimonialsInView}
          delay="0s"
        />

        <TestimonialCard
          rating={4.9}
          title="Ahorros Automáticos"
          quote="Las alertas proactivas me han ahorrado cientos de euros en pagos innecesarios. La IA detectó suscripciones duplicadas y gastos recurrentes que ni siquiera sabía que tenía."
          name="Carlos R."
          position="Emprendedor"
          avatar={avatar2}
          isVisible={testimonialsInView}
          delay="0.2s"
        />

        <TestimonialCard
          rating={5.0}
          title="Decisiones Informadas"
          quote="Las recomendaciones personalizadas cambiaron mi perspectiva financiera. En solo 6 meses, he creado un fondo de emergencia y estoy en camino de comprar mi primera vivienda."
          name="Elena B."
          position="Analista de Datos"
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
          <h2>Tu Asesor Financiero Personal, Siempre Disponible</h2>
          <p>
            Comienza gratis con nuestro plan básico y visualiza tus finanzas.
          </p>
          <Link to="/register" className="landing-cta-button">Comenzar Gratis Ahora</Link>
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
