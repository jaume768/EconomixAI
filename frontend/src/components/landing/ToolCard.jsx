import React from 'react';
import '../css/LandingPage.css';

const ToolCard = ({ icon, title, description, isVisible, delay }) => (
  <div className={`landing-tool-card ${isVisible ? 'animate-fade-in-up' : ''}`} style={{ transitionDelay: delay }}>
    <div className="landing-tool-icon">
      <img src={icon} alt={`${title} icon`} />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default ToolCard;
