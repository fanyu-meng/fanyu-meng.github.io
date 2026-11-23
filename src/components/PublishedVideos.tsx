import { useState } from 'react';

type FeedRow = { id: string; title: string; summary: string; createdAt: string; youtube?: string; bilibili?: string };
type VideoEntry = { id: string; title: string; url?: string; links?: { label: string; url: string }[]; embed?: string; summary?: string; featured?: boolean };
export type VideoSource = { label: string; url: string; embed: string };

export function videoSources(entry: VideoEntry): VideoSource[] {
  const found = new Map<string, VideoSource>();
  const urls = [entry.url, entry.embed, ...(entry.links || []).map(link => link.url)];
  for (const raw of urls) {
    if (!raw) continue;
    let u: URL;

    try {
      u = new URL(raw);
    } catch {
      continue;
    }
    const host = u.hostname.toLowerCase(), parts = u.pathname.split('/').filter(Boolean);
    let yt: string | null = null, bv: string | null = null;
    if (host === 'youtu.be') yt = parts[0];
    if (['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'].includes(host)) yt = u.pathname === '/watch' ? u.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : null;
    if (['www.bilibili.com', 'bilibili.com'].includes(host) && parts[0] === 'video') bv = parts[1];
    if (host === 'player.bilibili.com') bv = u.searchParams.get('bvid');
    if (yt && /^[\w-]{11}$/.test(yt)) found.set('youtube', { label: 'YouTube', url: 'https://www.youtube.com/watch?v=' + yt, embed: 'https://www.youtube-nocookie.com/embed/' + yt });
    if (bv && /^BV[0-9A-Za-z]{10}$/.test(bv)) found.set('bilibili', { label: 'B 站', url: 'https://www.bilibili.com/video/' + bv + '/', embed: 'https://player.bilibili.com/player.html?autoplay=0&bvid=' + bv });
  }
  return [...found.values()];
}
export async function withPublishedVideos<T extends { video?: VideoEntry[] }>(works: T, root: URL, signal?: AbortSignal): Promise<T> {
  let rows: FeedRow[];
  try {
    const response = await fetch(new URL('published-videos.json', root), { signal });
    if (!response.ok) return works;
    rows = await response.json();
    if (!Array.isArray(rows)) return works;
  } catch (error) {
    if (signal?.aborted) throw error;

    return works;
  }
  const curated = [...(works.video || [])], fresh: VideoEntry[] = [];
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || typeof row.title !== 'string') continue;
    const links = [];
    if (row.bilibili && /^BV[A-Za-z0-9]{10}$/.test(row.bilibili)) links.push({ label: 'B 站', url: 'https://www.bilibili.com/video/' + row.bilibili + '/' });
    if (row.youtube && /^[\w-]{11}$/.test(row.youtube)) links.push({ label: 'YouTube', url: 'https://www.youtube.com/watch?v=' + row.youtube });
    if (!links.length) continue;
    const item = { id: row.id, title: row.title, summary: row.summary, links };
    const match = curated.findIndex(old => old.id === item.id || videoSources(old).some(source => links.some(link => link.url === source.url)));
    if (match >= 0) {
      const old = curated[match];
      curated[match] = { ...old, links: [...new Map([...(old.links || []), ...links].map(link => [link.url, link])).values()] };
    } else if (!fresh.some(old => old.id === row.id || videoSources(old).some(source => links.some(link => link.url === source.url)))) fresh.push(item);
  }
  return { ...works, video: [...curated.filter(i => i.featured), ...fresh, ...curated.filter(i => !i.featured)] };
}
export function VideoPlayer({ sources, title, en }: { sources: VideoSource[]; title: string; en: boolean }) {
  const [selected, setSelected] = useState(sources[0].label);
  const active = sources.find(s => s.label === selected) || sources[0];
  return <><div className="ex-media"><iframe src={active.embed} title={title + ' · ' + active.label} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
    {sources.length > 1 && <div className="ex-actions" role="group" aria-label={en ? 'Video player' : '播放平台'}>{sources.map(s => <button type="button" key={s.label} aria-pressed={s.label === active.label} className="rounded border px-3 py-1 text-sm aria-pressed:bg-muted" onClick={() => setSelected(s.label)}>{en && s.label === 'B 站' ? 'Bilibili' : s.label}</button>)}</div>}</>;
}
