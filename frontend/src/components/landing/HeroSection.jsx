import React from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import '../css/LandingPage.css';
import mobileImg1 from '../../assets/mobile-dashboard.png';
import mobileImg2 from '../../assets/mobile-stats.png';

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

export default HeroSection;
