import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ContactSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="contact" className="py-24 relative">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          {/* Section Header */}
          <h2 className="text-2xl font-bold mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-muted-foreground text-base mb-12">
            {t('contact.subtitle')}
          </p>

          {/* Email Button */}
          <div className="mb-12">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
            >
              <a href="mailto:mengfanyuhit@gmail.com" className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                mengfanyuhit@gmail.com
              </a>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ContactSection;
