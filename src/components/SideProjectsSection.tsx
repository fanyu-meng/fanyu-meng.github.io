import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mic, Guitar, Headphones, BookOpen, ExternalLink } from 'lucide-react';

interface SideProject {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descKey: string;
  links: { name: string; url: string }[];
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
      { name: '小宇宙', url: 'https://xiaoyuzhoufm.com' },
      { name: 'Spotify', url: 'https://spotify.com' },
      { name: 'Apple', url: 'https://podcasts.apple.com' },
    ],
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    id: 'science',
    icon: BookOpen,
    titleKey: 'projects.science',
    descKey: 'projects.science.desc',
    links: [
      { name: '公众号', url: 'https://mp.weixin.qq.com' },
      { name: '知乎', url: 'https://zhihu.com' },
    ],
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
];

const ProjectCard: React.FC<{ project: SideProject }> = ({ project }) => {
  const { t } = useLanguage();
  const Icon = project.icon;

  return (
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
        ))}
      </div>
    </div>
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
