import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CreationCounts } from '../../scripts/creation-stats';

const labels = {
  articles: ['文章', 'Articles'],
  answers: ['知乎回答', 'Zhihu answers'],
  videos: ['视频', 'Videos'],
  episodes: ['播客单集', 'Podcast episodes'],
  reviews: ['脱口秀复盘', 'Stand-up notes'],
  projects: ['开发项目', 'Projects'],
} satisfies Record<Exclude<keyof CreationCounts, 'total'>, [string, string]>;

async function loadCounts(signal: AbortSignal): Promise<CreationCounts> {
  const response = await fetch(import.meta.env.BASE_URL + 'content/creation-stats.json', { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error('Could not load creation statistics');
  return response.json();
}

function initialCounts(): CreationCounts | undefined {
  const snapshot = document.getElementById('creation-stats')?.textContent;
  return snapshot ? JSON.parse(snapshot) : undefined;
}

export default function CreationStats() {
  const { language } = useLanguage();
  const en = language === 'en';
  const { data, isError, refetch } = useQuery({
    queryKey: ['creation-stats'],
    queryFn: ({ signal }) => loadCounts(signal),
    initialData: initialCounts,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  if (!data) {
    return <p className="mt-4 text-sm text-muted-foreground" role="status">
      {isError ? <>{en ? 'Work counts are unavailable. ' : '作品统计暂未载入。'}
        <button type="button" onClick={() => void refetch()} className="underline">{en ? 'Retry' : '重试'}</button></>
        : en ? 'Loading work counts…' : '正在载入作品统计…'}
    </p>;
  }
  const number = new Intl.NumberFormat(en ? 'en' : 'zh-CN');
  return <section aria-label={en ? 'Works in the archive' : '站内创作统计'}
    className="mt-5 border-t border-border/70 pt-4 lg:flex lg:items-center lg:gap-8">
    <div className="shrink-0">
      <p className="flex items-baseline gap-1.5">
        {!en && <span className="text-sm">本站收录</span>}
        <strong className="text-2xl font-bold leading-none tabular-nums text-primary">{number.format(data.total)}</strong>
        <span className="text-sm">{en ? 'works in the archive' : '件作品'}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{en ? 'Cross-posts counted once' : '同一作品多处发布只计一次'}</p>
    </div>
    <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-6 lg:mt-0 lg:flex-1 lg:border-l lg:border-border lg:pl-8">
      {(Object.keys(labels) as (keyof typeof labels)[]).map(key =>
        <div key={key} className="flex flex-col">
          <dt className="text-sm leading-snug text-secondary-foreground">{labels[key][Number(en)]}</dt>
          <dd className="order-first text-lg font-semibold leading-tight tabular-nums">{number.format(data[key])}</dd>
        </div>)}
    </dl>
  </section>;
}
