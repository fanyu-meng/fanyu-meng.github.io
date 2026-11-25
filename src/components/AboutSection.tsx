import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

type Metric = { value: number | null; asOf: string | null; status: string };
type ProfileStats = Record<'standupShows' | 'podcastEpisodes' | 'followers' | 'wechatFollowers' | 'zhihuFollowers', Metric>;

async function getStats(): Promise<ProfileStats> {
  const response = await fetch('/content/profile-stats.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('Profile statistics unavailable');
  return response.json();
}

export default function AboutSection() {
  const { language, t } = useLanguage();
  const { data } = useQuery({ queryKey: ['profile-stats'], queryFn: getStats, staleTime: 300_000, retry: 1 });
  const zh = language === 'zh';
  const number = new Intl.NumberFormat(zh ? 'zh-CN' : 'en');
  function count(metric: Metric | undefined) {
    return typeof metric?.value === 'number' && Number.isSafeInteger(metric.value) && metric.value >= 0 ? number.format(metric.value) : '';
  }
  function line(metric: Metric | undefined, label: string, formatted: (value: string) => string) {
    const value = count(metric);
    return <li>{value ? formatted(value) : label}</li>;
  }
  return (
    <ul className="mt-6 list-disc space-y-2 border-t border-border/60 pl-5 pt-5 text-sm leading-relaxed marker:text-primary sm:text-base">
      <li>{t('about.item.1')}</li>
      {line(data?.standupShows, zh ? '脱口秀演员' : 'Stand-up comedian', n => zh ? `脱口秀已记录上台 ${n} 次` : `Stand-up comedian · ${n} documented performances`)}
      {line(data?.podcastEpisodes, zh ? '《破壁圆桌》播客主播' : 'Host of Pobicast', n => zh ? `《破壁圆桌》已发布 ${n} 期播客` : `Host of Pobicast · ${n} published episodes`)}
      <li>{t('about.item.4')}</li>
      {line(data?.followers, zh ? '声学科普博主' : 'Acoustics blogger',
        n => zh ? `声学科普博主，${n} 位关注者` : `Acoustics blogger · ${n} followers`)}
    </ul>
  );
}
