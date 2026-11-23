import { ChevronDown } from 'lucide-react';
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
  const number = new Intl.NumberFormat(en ? 'en' : 'zh-CN');
  return <details className="group shrink-0 text-sm">
    <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
      {data ? <><strong className="tabular-nums text-primary">{number.format(data.total)}</strong>{en ? 'works' : '件作品'}</>
        : en ? 'Work stats' : '作品统计'}
      <ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" />
    </summary>
    <div className="absolute right-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-xl">
      {data ? <>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {(Object.keys(labels) as (keyof typeof labels)[]).map(key =>
            <div key={key} className="flex justify-between gap-1">
              <dt>{labels[key][Number(en)]}</dt>
              <dd className="font-semibold tabular-nums">{number.format(data[key])}</dd>
            </div>)}
        </dl>
        <p className="mt-3 text-muted-foreground">{en ? 'Cross-posts counted once' : '同一作品多处发布只计一次'}</p>
      </> : <p className="text-muted-foreground" role="status">
        {isError ? <>{en ? 'Work counts are unavailable. ' : '作品统计暂未载入。'}
          <button type="button" onClick={() => void refetch()} className="underline">{en ? 'Retry' : '重试'}</button></>
          : en ? 'Loading work counts…' : '正在载入作品统计…'}
      </p>}
    </div>
  </details>;
}
