import React from 'react';
import { useInView } from 'react-intersection-observer';
import TestimonialCard from './TestimonialCard';
import '../css/LandingPage.css';
import avatar1 from '../../assets/avatar-1.svg';
import avatar2 from '../../assets/avatar-2.svg';
import avatar3 from '../../assets/avatar-3.svg';

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

export default TestimonialsSection;
