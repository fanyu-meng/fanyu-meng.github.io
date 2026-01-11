import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Github, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ContactSection: React.FC = () => {
  const { t } = useLanguage();

  const socialLinks = [
    { icon: Github, name: 'GitHub', url: 'https://github.com/fanyu-meng' },
    { icon: Linkedin, name: 'LinkedIn', url: 'https://www.linkedin.com/in/fanyu-meng-9332b489/' },
    { icon: Twitter, name: 'Twitter/X', url: 'https://x.com/fanyu_meng' },
  ];

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

          {/* Social Links */}
          <div>
            <p className="text-sm text-muted-foreground mb-6">
              {t('contact.social')}
            </p>
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map(({ icon: Icon, name, url }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title={name}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
