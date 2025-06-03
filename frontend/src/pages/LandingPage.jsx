import React from 'react';
import './css/LandingPage.css';
import Header from '../components/landing/Header';
import HeroSection from '../components/landing/HeroSection';
import ToolsSection from '../components/landing/ToolsSection';
import SecuritySection from '../components/landing/SecuritySection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CtaSection from '../components/landing/CtaSection';
import Footer from '../components/landing/Footer';
import CombinedFeaturesSocialProof from '../components/landing/CombinedFeaturesSocialProof';

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
