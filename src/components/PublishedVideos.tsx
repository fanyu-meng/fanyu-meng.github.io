import { useEffect, useRef, useState } from 'react';
import { orderVideos, withArchivedVideos, type ArchivedVideo, type VideoEntry, type VideoMedia, type VideoSource } from '@/lib/video-catalog';

export { videoSources, type ArchivedVideo, type VideoEntry, type VideoSource } from '@/lib/video-catalog';

async function archivedVideos<T extends { video?: VideoEntry[] }>(works: T, root: URL, signal?: AbortSignal): Promise<T> {
  try {
    const response = await fetch(new URL('video-media.json', root), { signal });
    if (!response.ok) return works;
    return withArchivedVideos(works, await response.json() as VideoMedia, root.origin);
  } catch (error) {
    if (signal?.aborted) throw error;
    return works;
  }
}

export function withVideoArchive<T extends { video?: VideoEntry[] }>(works: T, root: URL, signal?: AbortSignal): Promise<T> {
  return archivedVideos(orderVideos(works), root, signal);
}

/** Plays the site's own copy: MP4 directly, HLS natively in Safari or through hls.js elsewhere. */
function ArchivedPlayer({ video, title, poster }: { video: ArchivedVideo; title: string; poster?: string }) {
  const element = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    if (video.type === 'mp4' || node.canPlayType('application/vnd.apple.mpegurl')) {
      node.src = video.src;
      return;
    }
    let stop = () => {};
    let cancelled = false;
    import('hls.js').then(({ default: Hls }) => {
      if (cancelled || !Hls.isSupported()) return;
      const hls = new Hls();
      hls.loadSource(video.src);
      hls.attachMedia(node);
      stop = () => hls.destroy();
    });
    return () => { cancelled = true; stop(); };
  }, [video.src, video.type]);
  return <video ref={element} title={title} controls playsInline preload="metadata" poster={poster}
    style={video.width && video.height ? { aspectRatio: `${video.width} / ${video.height}` } : undefined} />;
}

const SITE = '本站';

export function VideoPlayer({ sources, title, en, archive, poster }: {
  sources: VideoSource[]; title: string; en: boolean; archive?: ArchivedVideo; poster?: string;
}) {
  const labels = [...(archive ? [SITE] : []), ...sources.map(source => source.label)];
  const [selected, setSelected] = useState(() => {
    if (archive) return SITE;
    const mobile = window.matchMedia('(max-width: 759px), (hover: none) and (pointer: coarse)').matches;
    const preferred = mobile ? sources.find(source => source.label === 'YouTube') : sources[0];
    return (preferred ?? sources[0]).label;
  });
  const active = sources.find(s => s.label === selected) || sources[0];
  const name = (label: string) => !en ? label : label === 'B 站' ? 'Bilibili' : label === SITE ? 'This site' : label;
  return <>
    <div className="ex-media">
      {archive && (selected === SITE || !active) ? <ArchivedPlayer key={archive.src} video={archive} title={title} poster={poster} /> :
        active && <iframe key={active.embed} src={active.embed} title={title + ' · ' + active.label}
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin" />}
    </div>
    {labels.length > 1 && <div className="ex-actions" role="group" aria-label={en ? 'Video source' : '播放源'}>
      {labels.map(label => <button type="button" key={label} aria-pressed={label === (archive && selected === SITE ? SITE : active?.label)}
        className="min-h-11 rounded border px-3 py-1 text-sm aria-pressed:bg-muted" onClick={() => setSelected(label)}>
        {name(label)}
      </button>)}
    </div>}
  </>;
}
