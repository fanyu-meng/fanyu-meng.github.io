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
  archive?: ArchivedVideo;
};
/** A copy of the video kept in one of the site's own guitar-media-N repositories. */
export type ArchivedVideo = { src: string; type: 'mp4' | 'hls'; width?: number; height?: number };
export type VideoMedia = {
  repos: Record<string, string>;
  videos: Record<string, { repo: string; path: string; type: 'mp4' | 'hls'; width?: number; height?: number }>;
};

/** Attach the archived copies listed in video-media.json; the repo table is the one place their addresses live. */
export function withArchivedVideos<T extends { video?: VideoEntry[] }>(works: T, media: VideoMedia, origin: string): T {
  const video = (works.video || []).map(entry => {
    const row = media.videos?.[entry.id], base = row && media.repos?.[row.repo];
    if (!row || !base || !['mp4', 'hls'].includes(row.type) || row.path.includes('..')) return entry;
    const src = new URL(row.path, new URL(base, origin));
    if (src.origin !== origin) return entry;
    return { ...entry, archive: { src: src.href, type: row.type, width: row.width, height: row.height } };
  });
  return { ...works, video };
}
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
    if (yt && /^[\w-]{11}$/.test(yt)) found.set('youtube', { label: 'YouTube', url: 'https://www.youtube.com/watch?v=' + yt, embed: 'https://www.youtube-nocookie.com/embed/' + yt + '?playsinline=1' });
    if (bv && /^BV[0-9A-Za-z]{10}$/.test(bv)) {
      const url = 'https://www.bilibili.com/video/' + bv + '/';
      // Keep a curated player's settings when the same work also links to the watch page.
      if (host !== 'player.bilibili.com' && found.get('bilibili')?.url === url) continue;
      const player = new URL('https://player.bilibili.com/player.html');
      if (host === 'player.bilibili.com') player.search = u.search;
      player.searchParams.set('bvid', bv);
      player.searchParams.set('autoplay', '0');
      found.set('bilibili', { label: 'B 站', url, embed: player.href });
    }
  }
  return [...found.values()];
}

/** Featured videos first, then the rest newest first. */
export function orderVideos<T extends { video?: VideoEntry[] }>(works: T): T {
  const curated = [...(works.video || [])];
  const pinned = curated.filter(item => item.featured);
  const archive = curated.filter(item => !item.featured);
  archive.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return { ...works, video: [...pinned, ...archive] };
}
