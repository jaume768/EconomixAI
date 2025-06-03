import React from 'react';
import { useInView } from 'react-intersection-observer';
import ToolCard from './ToolCard';
import '../css/LandingPage.css';
import expenseIcon from '../../assets/expense-icon.svg';
import smartBudgetIcon from '../../assets/smart-budget-icon.svg';
import goalIcon from '../../assets/goal-icon.svg';

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

export default ToolsSection;
