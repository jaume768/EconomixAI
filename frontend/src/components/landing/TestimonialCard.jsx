import React from 'react';
import '../css/LandingPage.css';

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

export default TestimonialCard;
