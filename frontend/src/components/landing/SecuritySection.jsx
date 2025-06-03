import React from 'react';
import { useInView } from 'react-intersection-observer';
import '../css/LandingPage.css';
import securityMobileImg from '../../assets/security-mobile.svg';
import privacyIcon from '../../assets/privacy-icon.svg';
import encryptionIcon from '../../assets/encryption-icon.svg';
import authIcon from '../../assets/auth-icon.svg';
import monitoringIcon from '../../assets/monitoring-icon.svg';

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

export default SecuritySection;
