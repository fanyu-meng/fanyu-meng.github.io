import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Github, Linkedin, Twitter } from 'lucide-react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { EmailIcon } from '@/components/icons/EmailIcon';
import { YoutubeIcon } from '@/components/icons/YoutubeIcon';
import { BilibiliIcon } from '@/components/icons/BilibiliIcon';
import { XiaohongshuIcon } from '@/components/icons/XiaohongshuIcon';
import { XiaoyuzhouIcon } from '@/components/icons/XiaoyuzhouIcon';
import { SpotifyIcon } from '@/components/icons/SpotifyIcon';
import { ApplePodcastIcon } from '@/components/icons/ApplePodcastIcon';
import { WeChatIcon } from '@/components/icons/WeChatIcon';
import { ZhihuIcon } from '@/components/icons/ZhihuIcon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [qrCodeError, setQrCodeError] = useState(false);

  const handleWeChatClick = () => {
    setQrCodeOpen(true);
    setQrCodeError(false);
  };

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
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8 md:mb-12 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <a
                  href="mailto:mengfanyuhit@gmail.com"
                  className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title="Email"
                >
                  <EmailIcon className="w-5 h-5" />
                </a>
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
                <a
                  href="https://www.xiaohongshu.com/user/profile/629325e80000000021027f9b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title="小红书"
                >
                  <XiaohongshuIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://www.youtube.com/@florence_fernandez"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title="YouTube"
                >
                  <YoutubeIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://b23.tv/gkxZqiT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title="Bilibili"
                >
                  <BilibiliIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://www.xiaoyuzhoufm.com/podcast/67cdacc32deb5237c648049f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title="小宇宙"
                >
                  <XiaoyuzhouIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://open.spotify.com/show/6YfmptM1qzz9bmc7HLrzVQ?si=e8cc4a6a48c3483d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title="Spotify"
                >
                  <SpotifyIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://podcasts.apple.com/de/podcast/%E7%A0%B4%E5%A3%81%E5%9C%86%E6%A1%8C/id1719475456?l=en-GB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title="Apple Podcast"
                >
                  <ApplePodcastIcon className="w-5 h-5" />
                </a>
                <button
                  onClick={handleWeChatClick}
                  className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title="微信公众号"
                >
                  <WeChatIcon className="w-5 h-5" />
                </button>
                <a
                  href="https://www.zhihu.com/column/c_165545415"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-200 hover:shadow-glow hover:scale-110"
                  title="知乎"
                >
                  <ZhihuIcon className="w-5 h-5" />
                </a>
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

      {/* QR Code Dialog */}
      <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>公众号二维码</DialogTitle>
            <DialogDescription>
              扫描二维码关注我的公众号
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            {qrCodeError ? (
              <div className="text-center p-8 border border-border rounded-lg bg-secondary/50 w-64">
                <div className="text-muted-foreground mb-4">
                  <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-2">二维码图片未找到</p>
                <p className="text-xs text-muted-foreground">
                  请将二维码图片保存为 <code className="px-1 py-0.5 bg-background rounded text-xs">public/wechat-qrcode.jpg</code>
                </p>
              </div>
            ) : (
              <img
                src="/wechat-qrcode.jpg"
                alt="微信公众号二维码"
                className="w-64 h-64 object-contain border border-border rounded-lg"
                onError={() => setQrCodeError(true)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </section>
  );
};

export default HeroSection;
