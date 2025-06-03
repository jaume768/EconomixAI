import React from 'react';
import { useInView } from 'react-intersection-observer';
import '../css/LandingPage.css';
import budgetIcon from '../../assets/budget-icon.svg';
import teamIcon from '../../assets/team-icon.svg';

const CombinedFeaturesSocialProof = () => {
  const { ref: featuresRef, inView: featuresInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="landing-features-social" ref={featuresRef}>
      <div className="landing-features-cards">
        <div className={`landing-feature-card ${featuresInView ? 'animate-fade-in-up' : ''}`} style={{ transitionDelay: '0.1s' }}>
          <div className="landing-feature-icon">
            <img src={budgetIcon} alt="Icono de presupuesto" />
          </div>
          <h3>Análisis Automático de Gastos</h3>
          <p>
            Nuestro sistema de IA analiza automáticamente tus ingresos y gastos, categorizando
            transacciones y detectando patrones para ayudarte a optimizar tu economía.
          </p>
        </div>

        <div className={`landing-feature-card ${featuresInView ? 'animate-fade-in-up' : ''}`} style={{ transitionDelay: '0.3s' }}>
          <div className="landing-feature-icon">
            <img src={teamIcon} alt="Icono de equipo" />
          </div>
          <h3>Planes Personales y Familiares</h3>
          <p>
            Gestiona tus finanzas individualmente o crea un grupo familiar para compartir
            presupuestos, ver gastos conjuntos y fijar objetivos grupales.
          </p>
        </div>
      </div>

      <div className={`landing-social-proof-inline ${featuresInView ? 'animate-fade-in-up' : ''}`} style={{ transitionDelay: '0.5s' }}>
        <div className="landing-user-avatars">
          <div className="landing-avatar"></div>
          <div className="landing-avatar"></div>
          <div className="landing-avatar"></div>
          <div className="landing-avatar"></div>
          <div className="landing-avatar-more">97%</div>
        </div>
        <p>97% de usuarios mejoraron sus finanzas en 3 meses</p>
      </div>
    </section>
  );
};

export default CombinedFeaturesSocialProof;
