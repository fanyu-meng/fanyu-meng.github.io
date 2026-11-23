import { useState } from 'react';
import { mergePublishedVideos, type PublishedVideo, type VideoEntry, type VideoSource } from '@/lib/video-catalog';

export { videoSources, type VideoEntry, type VideoSource } from '@/lib/video-catalog';

export async function withPublishedVideos<T extends { video?: VideoEntry[] }>(works: T, root: URL, signal?: AbortSignal): Promise<T> {
  let rows: PublishedVideo[];
  try {
    const response = await fetch(new URL('published-videos.json', root), { signal });
    if (!response.ok) return works;
    rows = await response.json();
    if (!Array.isArray(rows)) return works;
  } catch (error) {
    if (signal?.aborted) throw error;

    return works;
  }
  return mergePublishedVideos(works, rows);
}

export function VideoPlayer({ sources, title, en }: { sources: VideoSource[]; title: string; en: boolean }) {
  const [selected, setSelected] = useState(() => {
    const mobile = window.matchMedia('(max-width: 759px), (hover: none) and (pointer: coarse)').matches;
    const preferred = mobile ? sources.find(source => source.label === 'YouTube') : sources[0];
    return (preferred ?? sources[0]).label;
  });
  const active = sources.find(s => s.label === selected) || sources[0];
  return <>
    <div className="ex-media">
      <iframe key={active.embed} src={active.embed} title={title + ' · ' + active.label}
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin" />
    </div>
    {sources.length > 1 && <div className="ex-actions" role="group" aria-label={en ? 'Video source' : '播放源'}>
      {sources.map(source => <button type="button" key={source.label} aria-pressed={source.label === active.label}
        className="min-h-11 rounded border px-3 py-1 text-sm aria-pressed:bg-muted" onClick={() => setSelected(source.label)}>
        {en && source.label === 'B 站' ? 'Bilibili' : source.label}
      </button>)}
    </div>}
  </>;
}
