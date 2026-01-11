import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  zh: {
    // Navigation
    'nav.home': '首页',
    'nav.articles': '文章',
    'nav.projects': '副业',
    'nav.contact': '联系',
    
    // Hero
    'hero.greeting': '你好，我是',
    'hero.name': '孟凡雨',
    'hero.title': '创作者 / 开发者 / 探索者',
    'hero.description': '专注于技术创新与内容创作，用代码和文字连接想法与现实。',
    'hero.cta': '了解更多',
    
    // About
    'about.title': '关于我',
    'about.description': '一个想表达的nerdy音频算法工程师',
    'about.highlight.audio': '音频算法',
    'about.highlight.comedy': '脱口秀',
    'about.highlight.guitar': '吉他',
    'about.highlight.podcast': '播客',
    'about.highlight.articles': '文章',
    
    // Articles
    'articles.title': '原创文章',
    'articles.subtitle': '思考与分享',
    'articles.readMore': '阅读更多',
    'articles.viewAll': '查看全部',
    
    // Side Projects
    'projects.title': '那些我干的事',
    'projects.subtitle': '现实世界的出口，1、2、3、4……',
    'projects.standup': '脱口秀',
    'projects.standup.desc': '喜欢你的幽默，再见',
    'projects.guitar': '吉他',
    'projects.guitar.desc': 'Pink Floyd，Beyond，Fingerstyle, and more…',
    'projects.podcast': '播客：破壁圆桌',
    'projects.podcast.desc': '不打针，不吃药，坐那就是跟你唠',
    'projects.science': '科普文章：子鱼说声学',
    'projects.science.desc': '和声音有关的一切',
    
    // Contact
    'contact.title': '联系我',
    'contact.subtitle': '欢迎交流合作',
    'contact.email': '邮箱',
    'contact.social': '社交媒体',
    
    // Footer
    'footer.rights': '保留所有权利',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.articles': 'Articles',
    'nav.projects': 'Projects',
    'nav.contact': 'Contact',
    
    // Hero
    'hero.greeting': "Hi, I'm",
    'hero.name': 'Fanyu Meng',
    'hero.title': 'Creator / Developer / Explorer',
    'hero.description': 'Focused on tech innovation and content creation, connecting ideas with reality through code and words.',
    'hero.cta': 'Learn More',
    
    // About
    'about.title': 'About Me',
    'about.description': 'A nerdy audio engineer who wants to express himself',
    'about.highlight.audio': 'Audio',
    'about.highlight.comedy': 'Stand-up',
    'about.highlight.guitar': 'Guitar',
    'about.highlight.podcast': 'Podcast',
    'about.highlight.articles': 'Articles',
    
    // Articles
    'articles.title': 'Original Articles',
    'articles.subtitle': 'Thoughts & Insights',
    'articles.readMore': 'Read More',
    'articles.viewAll': 'View All',
    
    // Side Projects
    'projects.title': 'Things I do',
    'projects.subtitle': 'Exit of reality, 1, 2,3,4,…',
    'projects.standup': 'Stand-up Comedy',
    'projects.standup.desc': 'I love your humor, goodbye',
    'projects.guitar': 'Guitar',
    'projects.guitar.desc': 'Pink Floyd, Beyond, Fingerstyle, and more…',
    'projects.podcast': 'Pobicast',
    'projects.podcast.desc': 'Sit back, relax, and talk',
    'projects.science': 'ZiYu Acoustics',
    'projects.science.desc': 'Everything about sound',
    
    // Contact
    'contact.title': 'Get in Touch',
    'contact.subtitle': 'Open for collaboration',
    'contact.email': 'Email',
    'contact.social': 'Social Media',
    
    // Footer
    'footer.rights': 'All rights reserved',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
