import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mic, Guitar, Headphones, BookOpen, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SideProject {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descKey: string;
  links: { name: string; url: string; isQRCode?: boolean }[];
  gradient: string;
}

const sideProjects: SideProject[] = [
  {
    id: 'standup',
    icon: Mic,
    titleKey: 'projects.standup',
    descKey: 'projects.standup.desc',
    links: [
      { name: '小红书', url: 'https://www.xiaohongshu.com/user/profile/629325e80000000021027f9b' },
    ],
    gradient: 'from-red-500/20 to-pink-500/20',
  },
  {
    id: 'guitar',
    icon: Guitar,
    titleKey: 'projects.guitar',
    descKey: 'projects.guitar.desc',
    links: [
      { name: 'YouTube', url: 'https://www.youtube.com/@florence_fernandez' },
      { name: 'Bilibili', url: 'https://b23.tv/gkxZqiT' },
    ],
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 'podcast',
    icon: Headphones,
    titleKey: 'projects.podcast',
    descKey: 'projects.podcast.desc',
    links: [
      { name: '小宇宙', url: 'https://www.xiaoyuzhoufm.com/podcast/67cdacc32deb5237c648049f' },
      { name: 'Spotify', url: 'https://open.spotify.com/show/6YfmptM1qzz9bmc7HLrzVQ?si=e8cc4a6a48c3483d' },
      { name: 'Apple Podcast', url: 'https://podcasts.apple.com/de/podcast/%E7%A0%B4%E5%A3%81%E5%9C%86%E6%A1%8C/id1719475456?l=en-GB' },
    ],
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    id: 'science',
    icon: BookOpen,
    titleKey: 'projects.science',
    descKey: 'projects.science.desc',
    links: [
      { name: '公众号', url: '#', isQRCode: true },
      { name: '知乎', url: 'https://www.zhihu.com/column/c_165545415' },
    ],
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
];

const ProjectCard: React.FC<{ project: SideProject }> = ({ project }) => {
  const { t } = useLanguage();
  const Icon = project.icon;
  const [qrCodeOpen, setQrCodeOpen] = useState(false);

  const handleLinkClick = (link: { name: string; url: string; isQRCode?: boolean }) => {
    if (link.isQRCode) {
      setQrCodeOpen(true);
    }
  };

  return (
    <>
      <div className="group gradient-card rounded-xl p-6 shadow-card border border-border/50 transition-all duration-300 hover:shadow-card-hover hover:border-primary/30">
        {/* Icon with gradient background */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${project.gradient} flex items-center justify-center mb-5`}>
          <Icon className="w-7 h-7 text-foreground" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold mb-2">
          {t(project.titleKey)}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-5">
          {t(project.descKey)}
        </p>

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          {project.links.map((link) => (
            link.isQRCode ? (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-full transition-colors cursor-pointer"
              >
                {link.name}
              </button>
            ) : (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
              >
                {link.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            )
          ))}
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
          <div className="flex justify-center py-4">
            <img
              src="/wechat-qrcode.png"
              alt="微信公众号二维码"
              className="w-64 h-64 object-contain border border-border rounded-lg"
              onError={(e) => {
                // 如果图片不存在，显示占位符
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
                target.alt = '请将二维码图片保存为 public/wechat-qrcode.png';
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const SideProjectsSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="projects" className="py-24 relative gradient-hero">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('projects.title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('projects.subtitle')}
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sideProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SideProjectsSection;
