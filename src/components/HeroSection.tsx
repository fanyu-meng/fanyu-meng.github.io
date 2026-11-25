import { useState, type ComponentType } from 'react';
import { ChevronDown, Github, Linkedin, Twitter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import AboutSection from './AboutSection';
import { Button } from './ui/button';
import { EmailIcon } from './icons/EmailIcon';
import { YoutubeIcon } from './icons/YoutubeIcon';
import { BilibiliIcon } from './icons/BilibiliIcon';
import { XiaohongshuIcon } from './icons/XiaohongshuIcon';
import { XiaoyuzhouIcon } from './icons/XiaoyuzhouIcon';
import { SpotifyIcon } from './icons/SpotifyIcon';
import { ApplePodcastIcon } from './icons/ApplePodcastIcon';
import { WeChatIcon } from './icons/WeChatIcon';
import { ZhihuIcon } from './icons/ZhihuIcon';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const social: { label: string; icon: ComponentType<{ className?: string }>; href: string; badge?: string }[] = [
  { label: 'Email', icon: EmailIcon, href: 'mailto:mengfanyuhit@gmail.com' },
  { label: 'GitHub', icon: Github, href: '#/works?type=github' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/fanyu-meng-9332b489/' },
  { label: 'X', icon: Twitter, href: 'https://x.com/fanyu_meng' },
  { label: '小红书 · 子鱼说声学', icon: XiaohongshuIcon, href: 'https://www.xiaohongshu.com/user/profile/62933ab2000000002102b627', badge: '声' },
  { label: '小红书 · 子鱼脱口秀', icon: XiaohongshuIcon, href: 'https://www.xiaohongshu.com/user/profile/629325e80000000021027f9b', badge: '秀' },
  { label: 'YouTube', icon: YoutubeIcon, href: 'https://www.youtube.com/@florence_fernandez' },
  { label: 'Bilibili', icon: BilibiliIcon, href: 'https://b23.tv/gkxZqiT' },
  { label: '小宇宙', icon: XiaoyuzhouIcon, href: 'https://www.xiaoyuzhoufm.com/podcast/67cdacc32deb5237c648049f' },
  { label: 'Spotify', icon: SpotifyIcon, href: 'https://open.spotify.com/show/6YfmptM1qzz9bmc7HLrzVQ' },
  { label: 'Apple Podcasts', icon: ApplePodcastIcon, href: 'https://podcasts.apple.com/podcast/id1719475456' },
  { label: '知乎', icon: ZhihuIcon, href: 'https://www.zhihu.com/column/c_165545415' },
];

export default function HeroSection() {
  const { t, language, setLanguage } = useLanguage();
  const [showQR, setShowQR] = useState(false);
  const socialClass = 'inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:text-primary';
  const qrTitle = language === 'zh' ? '微信公众号' : 'WeChat';
  return (
    <section id="home" className="gradient-hero border-b border-border/50">
      <div className="container mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        <div className="relative">
          <div className="flex items-center gap-3 sm:gap-5">
            <img src="/ProfilePhoto.png" width="64" height="64" alt="" className="h-12 w-12 shrink-0 rounded-full border-2 border-primary/60 object-cover sm:h-16 sm:w-16" />
            <div><h1 className="gradient-text pr-32 text-2xl font-bold sm:text-3xl">{t('hero.name')}</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t('hero.description')}</p></div>
          </div>
          <Button type="button" variant="ghost" size="sm"
            className="absolute right-0 top-0 h-8 px-2 text-muted-foreground"
            aria-label={language === 'zh' ? 'Switch to English' : '切换到中文'}
            lang={language === 'zh' ? 'en' : 'zh-CN'}
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}>
            {language === 'zh' ? 'EN' : '中文'}
          </Button>
          <details className="group" id="about">
            <summary className="absolute right-12 top-0 flex min-h-8 cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
              {t('about.title')}<ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" />
            </summary>
            <AboutSection />
            <div className="mt-5 flex flex-wrap gap-2">
              {social.map(({ label, href, icon: Icon, badge }) => <a key={label} className={socialClass + ' relative'} href={href}
                aria-label={label} title={label} target={href.startsWith('https:') ? '_blank' : undefined} rel={href.startsWith('https:') ? 'noopener noreferrer' : undefined}>
                <Icon className="h-5 w-5" />{badge && <span aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none text-primary-foreground">{badge}</span>}</a>)}
              <button type="button" className={socialClass} aria-label={qrTitle} title={qrTitle} onClick={() => setShowQR(true)}><WeChatIcon className="h-5 w-5" /></button>
            </div>
          </details>
        </div>
      </div>
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{qrTitle}</DialogTitle>
            <DialogDescription>{language === 'zh' ? '扫描二维码关注「子鱼说声学」。' : 'Scan the QR code to follow Ziyu Acoustics.'}</DialogDescription></DialogHeader>
          <img className="mx-auto h-56 w-56 rounded-lg object-contain" src="/wechat-qrcode.jpg" alt={qrTitle} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
