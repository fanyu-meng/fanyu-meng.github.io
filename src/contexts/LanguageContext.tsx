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
    'about.description': '热爱技术、音乐和表达。白天写代码，晚上讲脱口秀，周末弹吉他。相信持续学习和分享的力量。',
    
    // Articles
    'articles.title': '原创文章',
    'articles.subtitle': '思考与分享',
    'articles.readMore': '阅读更多',
    'articles.viewAll': '查看全部',
    
    // Side Projects
    'projects.title': '副业空间',
    'projects.subtitle': '工作之外的精彩',
    'projects.standup': '脱口秀',
    'projects.standup.desc': '小红书上的段子和表演',
    'projects.guitar': '吉他演奏',
    'projects.guitar.desc': 'YouTube / Bilibili 视频',
    'projects.podcast': '个人播客',
    'projects.podcast.desc': '小宇宙 / Spotify / Apple',
    'projects.science': '科普文章',
    'projects.science.desc': '公众号 / 知乎专栏',
    
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
    'about.description': 'Passionate about technology, music, and expression. Coding by day, stand-up comedy by night, guitar on weekends. Believer in continuous learning and sharing.',
    
    // Articles
    'articles.title': 'Original Articles',
    'articles.subtitle': 'Thoughts & Insights',
    'articles.readMore': 'Read More',
    'articles.viewAll': 'View All',
    
    // Side Projects
    'projects.title': 'Side Projects',
    'projects.subtitle': 'Beyond the day job',
    'projects.standup': 'Stand-up Comedy',
    'projects.standup.desc': 'Jokes and performances on Xiaohongshu',
    'projects.guitar': 'Guitar Performance',
    'projects.guitar.desc': 'YouTube / Bilibili videos',
    'projects.podcast': 'Personal Podcast',
    'projects.podcast.desc': 'Xiaoyuzhou / Spotify / Apple',
    'projects.science': 'Science Articles',
    'projects.science.desc': 'WeChat / Zhihu columns',
    
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
