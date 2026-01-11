import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Code, Music, Mic } from 'lucide-react';

const AboutSection: React.FC = () => {
  const { t } = useLanguage();

  const highlights = [
    { icon: Code, label: 'Code' },
    { icon: Mic, label: 'Voice' },
    { icon: Music, label: 'Music' },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-card rounded-2xl p-8 md:p-12 shadow-card border border-border/50">
            <h2 className="text-2xl font-bold mb-6">
              {t('about.title')}
            </h2>
            
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              {t('about.description')}
            </p>

            {/* Highlights */}
            <div className="flex flex-wrap gap-4">
              {highlights.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border/50"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
