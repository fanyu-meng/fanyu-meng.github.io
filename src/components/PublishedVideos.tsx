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
  const [selected, setSelected] = useState(sources[0].label);
  const active = sources.find(s => s.label === selected) || sources[0];
  return <><div className="ex-media"><iframe src={active.embed} title={title + ' · ' + active.label} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
    {sources.length > 1 && <div className="ex-actions" role="group" aria-label={en ? 'Video player' : '播放平台'}>{sources.map(s => <button type="button" key={s.label} aria-pressed={s.label === active.label} className="rounded border px-3 py-1 text-sm aria-pressed:bg-muted" onClick={() => setSelected(s.label)}>{en && s.label === 'B 站' ? 'Bilibili' : s.label}</button>)}</div>}</>;
}
