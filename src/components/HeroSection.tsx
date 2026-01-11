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
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 lg:gap-12">
            {/* Avatar */}
            <div className="flex-shrink-0 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse-glow" />
                {/* Avatar with border */}
                <div className="relative rounded-full p-1 bg-gradient-to-br from-primary/50 to-primary/30 shadow-glow">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background">
                    <AvatarImage 
                      src="/ProfilePhoto.png" 
                      alt={t('hero.name')}
                      className="object-cover"
                    />
                  </Avatar>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left animate-fade-up" style={{ animationDelay: '0.2s' }}>
              {/* Name */}
              <h1 className="text-3xl font-bold mb-4">
                <span className="gradient-text">{t('hero.name')}</span>
              </h1>

              {/* Description */}
              <p className="text-base text-muted-foreground max-w-2xl md:max-w-none mb-8 md:mb-12 leading-relaxed">
                {t('hero.description')}
              </p>

              {/* Social Links */}
              <div className="flex items-center justify-center md:justify-start gap-4 mb-8 md:mb-12 animate-fade-up" style={{ animationDelay: '0.3s' }}>
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
              <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
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
