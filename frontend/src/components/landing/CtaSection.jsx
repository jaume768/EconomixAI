import React from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import '../css/LandingPage.css';
import ctaMobileImg from '../../assets/cta-mobile.svg';

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

export default CtaSection;
