import React from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import ArticlesSection from '@/components/ArticlesSection';
import SideProjectsSection from '@/components/SideProjectsSection';
import Footer from '@/components/Footer';

const Index: React.FC = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main>
          <HeroSection />
          <AboutSection />
          {/* <ArticlesSection /> */}
          <SideProjectsSection />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default Index;
