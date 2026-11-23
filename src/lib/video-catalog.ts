export type PublishedVideo = { id: string; title: string; summary: string; createdAt: string; youtube?: string; bilibili?: string; cover?: string };
export type VideoEntry = {
  id: string;
  title: string;
  url?: string;
  links?: { label: string; url: string }[];
  embed?: string;
  summary?: string;
  featured?: boolean;
  publishedAt?: string;
  duration?: string;
  cover?: string;
  thumbnail?: string;
};
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

export function mergePublishedVideos<T extends { video?: VideoEntry[] }>(works: T, rows: PublishedVideo[]): T {
  const curated = [...(works.video || [])], fresh: VideoEntry[] = [];
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || typeof row.title !== 'string') continue;
    const links: NonNullable<VideoEntry['links']> = [];
    if (row.bilibili && /^BV[A-Za-z0-9]{10}$/.test(row.bilibili)) links.push({ label: 'B 站', url: 'https://www.bilibili.com/video/' + row.bilibili + '/' });
    if (row.youtube && /^[\w-]{11}$/.test(row.youtube)) links.push({ label: 'YouTube', url: 'https://www.youtube.com/watch?v=' + row.youtube });
    if (!links.length) continue;
    const publishedAt = typeof row.createdAt === 'string' ? row.createdAt.slice(0, 10) : undefined;
    const item = { id: row.id, title: row.title, summary: row.summary, publishedAt, cover: row.cover, links };
    const match = curated.findIndex(old => old.id === item.id || videoSources(old).some(source => links.some(link => link.url === source.url)));
    if (match >= 0) {
      const old = curated[match];
      curated[match] = { ...old, cover: old.cover || item.cover, links: [...new Map([...(old.links || []), ...links].map(link => [link.url, link])).values()] };
    } else if (!fresh.some(old => old.id === row.id || videoSources(old).some(source => links.some(link => link.url === source.url)))) fresh.push(item);
  }
  const pinned = curated.filter(item => item.featured);
  const archive = [...fresh, ...curated.filter(item => !item.featured)];
  archive.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return { ...works, video: [...pinned, ...archive] };
}
