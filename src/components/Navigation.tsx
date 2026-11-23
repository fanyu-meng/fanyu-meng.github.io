import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex h-14 items-center justify-between">
          <a href="#home" className="font-semibold">{t('hero.name')}</a>
          <div className="flex items-center gap-4">
            <a href="#works" className="text-sm text-muted-foreground hover:text-foreground">{language === 'zh' ? '作品' : 'Work'}</a>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">
                {language === 'zh' ? 'EN' : '中文'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
