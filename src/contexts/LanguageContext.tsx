import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    'hero.description': '音频/声学/脱口秀/播客/吉他/AI\u00a0builder/写作',
    'hero.cta': '了解更多',
    
    // About
    'about.title': '关于我',
    'about.item.1': '音频算法工程师',
    'about.item.4': '退过3个乐队的三品战士',
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
    // Wrap only after a slash: zero-width spaces after the slashes, a non-breaking hyphen and space inside the items.
    'hero.description': 'Audio/\u200bAcoustics/\u200bStand\u2011up/\u200bPodcast/\u200bGuitar/\u200bAI\u00a0builder/\u200bWriting',
    'hero.cta': 'Learn More',
    
    // About
    'about.title': 'About me',
    'about.item.1': 'Audio algorithm engineer',
    'about.item.4': 'Open-chord guitarist who has quit three bands',
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

// The English site lives at /en/. index.html sends first-time visitors whose browser has no Chinese there.
const isEnglishPath = (pathname: string) => /^\/en(?:\/|$)/.test(pathname);

const head: Record<Language, { title: string; description: string }> = {
  zh: { title: '孟凡雨 | Fanyu Meng', description: '音频算法工程师。分享技术文章、副业项目和生活感悟。' },
  en: {
    title: 'Fanyu Meng | Audio algorithm engineer',
    description: 'Fanyu Meng is an audio algorithm engineer and acoustician in Munich. Writing on acoustics, stand-up comedy, the Pobicast podcast, guitar and AI projects.',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const language: Language = isEnglishPath(location.pathname) ? 'en' : 'zh';

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = head[language].title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', head[language].description);
  }, [language]);

  // Switching keeps the open tab and work, which live in the hash.
  const setLanguage = (next: Language) => {
    try { localStorage.setItem('language', next); } catch { /* the choice still applies to this visit */ }
    if (next !== language) navigate({ pathname: next === 'en' ? '/en/' : '/', search: location.search, hash: location.hash });
  };

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
