import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t, language } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-border/50">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} {t('hero.name')}. {t('footer.rights')}.
          </p>

          <a href="/studio/" className="text-sm text-muted-foreground hover:text-foreground">{language === 'zh' ? '视频发布台' : 'Video studio'}</a>

          {/* Back to top */}
          <a
            href="#home"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ↑ Top
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
