import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowDown, Github, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

const HeroSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="container mx-auto pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Avatar */}
          <div className="flex justify-center mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse-glow" />
              {/* Avatar with border */}
              <div className="relative rounded-full p-1 bg-gradient-to-br from-primary/50 to-primary/30 shadow-glow">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 border-4 border-background">
                  <AvatarImage 
                    src="/ProfilePhoto.png" 
                    alt={t('hero.name')}
                    className="object-cover"
                  />
                </Avatar>
              </div>
            </div>
          </div>

          {/* Name */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <span className="gradient-text">{t('hero.name')}</span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{ animationDelay: '0.3s' }}>
            {t('hero.description')}
          </p>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <a
              href="https://github.com/fanyu-meng"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
              title="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/fanyu-meng-9332b489/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://x.com/fanyu_meng"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
              title="Twitter/X"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>

          {/* CTA Button */}
          <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
            >
              <a href="#articles" className="flex items-center gap-2">
                {t('hero.cta')}
                <ArrowDown className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
