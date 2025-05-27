import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import budgetIcon from '../assets/budget-icon.svg';
import teamIcon from '../assets/team-icon.svg';

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
          <h3>Presupuesto Personalizado</h3>
          <p>
            Crea flujos de presupuestación personalizados para objetivos individuales.
            Define límites y categorías para alcanzar tus metas.
          </p>
        </div>

        <div className={`landing-feature-card ${featuresInView ? 'animate-fade-in-up' : ''}`} style={{ transitionDelay: '0.3s' }}>
          <div className="landing-feature-icon">
            <img src={teamIcon} alt="Icono de equipo" />
          </div>
          <h3>Seguimiento de Gastos de Equipo</h3>
          <p>
            Gestiona finanzas en múltiples cuentas y asigna responsabilidades de forma sencilla.
          </p>
        </div>
      </div>

      <div className={`landing-social-proof-inline ${featuresInView ? 'animate-fade-in-up' : ''}`} style={{ transitionDelay: '0.5s' }}>
        <div className="landing-user-avatars">
          <div className="landing-avatar"></div>
          <div className="landing-avatar"></div>
          <div className="landing-avatar"></div>
          <div className="landing-avatar"></div>
          <div className="landing-avatar-more">5M+</div>
        </div>
        <p>Descargado más de 5M+ en un año</p>
      </div>
    </section>
  );
};

export default CombinedFeaturesSocialProof;
