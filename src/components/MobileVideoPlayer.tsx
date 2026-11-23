import { useSyncExternalStore } from 'react';
import { Play } from 'lucide-react';
import type { VideoEntry, VideoSource } from './PublishedVideos';

const mobilePlaybackQuery = '(max-width: 759px), (hover: none) and (pointer: coarse)';

function subscribeToMobilePlayback(onChange: () => void) {
  const media = window.matchMedia(mobilePlaybackQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function useMobileVideoPlayback() {
  return useSyncExternalStore(subscribeToMobilePlayback,
    () => window.matchMedia(mobilePlaybackQuery).matches, () => false);
}

export default function MobileVideoPlayer({ video, sources, en }: {
  video: VideoEntry; sources: VideoSource[]; en: boolean;
}) {
  const youtube = sources.find(source => source.label === 'YouTube');
  if (!youtube) {
    const bilibili = sources.find(source => source.label === 'B 站');
    if (!bilibili) return null;
    const cover = video.thumbnail ? import.meta.env.BASE_URL + video.thumbnail : video.cover;
    return <div className="ex-media"><a className="mobile-video-cover" href={bilibili.url}>
      {cover && <img src={cover} alt="" referrerPolicy="no-referrer" />}
      <span><Play aria-hidden="true" />{en ? 'Watch on Bilibili' : '在 B 站观看'}</span>
    </a></div>;
  }

  return <>
    <div className="ex-media mobile-youtube"><iframe src={youtube.embed + '?playsinline=1'}
      title={video.title + ' · YouTube'} referrerPolicy="strict-origin-when-cross-origin"
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen /></div>
    <div className="ex-actions mobile-video-links" role="group" aria-label={en ? 'Watch on platform' : '到原站观看'}>
      {sources.map(source => {
        const name = en && source.label === 'B 站' ? 'Bilibili' : source.label;
        return <a key={source.url} href={source.url}>{en ? 'Watch on ' + name : '在 ' + name + ' 观看'}</a>;
      })}
    </div>
  </>;
}
