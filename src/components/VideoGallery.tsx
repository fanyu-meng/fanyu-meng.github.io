import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Pin, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { videoSources, type VideoEntry } from './PublishedVideos';
import './video-gallery.css';

type GalleryProps = {
  videos: VideoEntry[];
  selectedId: string;
  en: boolean;
  hrefForVideo: (id: string) => string;
  closeDirectLink: () => void;
  children: ReactNode;
};

function VideoCard({ video, en, href, eager, rememberOpener }: {
  video: VideoEntry; en: boolean; href: string; eager: boolean;
  rememberOpener: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const sources = videoSources(video);
  const youtube = sources.find(source => source.label === 'YouTube');
  const youtubeId = youtube && new URL(youtube.url).searchParams.get('v');
  const thumbnail = [
    video.thumbnail && import.meta.env.BASE_URL + video.thumbnail,
    video.cover,
    youtubeId && 'https://i.ytimg.com/vi/' + youtubeId + '/hqdefault.jpg',
  ].find(src => src && !failedImages.includes(src));
  const platforms = [...(video.archive ? [en ? 'This site' : '本站'] : []),
    ...sources.map(source => en && source.label === 'B 站' ? 'Bilibili' : source.label)].join(' / ');

  return <a className="video-card" href={href} aria-haspopup="dialog" onClick={rememberOpener} data-video-id={video.id}>
    <div className="video-poster">
      {thumbnail && <img src={thumbnail} alt="" width={720} height={405} loading={eager ? 'eager' : 'lazy'}
        decoding="async" referrerPolicy="no-referrer" onError={() => setFailedImages(failed => [...failed, thumbnail])} />}
      <span className={thumbnail ? 'video-play' : 'video-play video-play-visible'} aria-hidden="true"><Play /></span>
      {video.featured && <span className="video-pin"><Pin aria-hidden="true" />{en ? 'Pinned' : '置顶'}</span>}
      {video.duration && <span className="video-duration">{video.duration}</span>}
    </div>
    <h3 className="video-card-title">{video.title}</h3>
    <div className="video-card-meta">{video.publishedAt && <time dateTime={video.publishedAt}>{video.publishedAt}</time>}
      {video.publishedAt && platforms && <span aria-hidden="true"> · </span>}{platforms}</div>
  </a>;
}

export default function VideoGallery({ videos, selectedId, en, hrefForVideo, closeDirectLink, children }: GalleryProps) {
  const gallery = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLAnchorElement>(null);
  const historyLengthBeforeOpen = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = videos.find(video => video.id === selectedId);
  function rememberOpener(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      opener.current = event.currentTarget;
      historyLengthBeforeOpen.current = window.history.length;
    }
  }
  function dismiss() {
    // Embedded players can add their own entries to the tab's back history.
    if (opener.current?.href === window.location.href && window.history.length === historyLengthBeforeOpen.current + 1) window.history.back();
    else closeDirectLink();
  }

  return <>
    <div className="video-gallery" ref={gallery} tabIndex={-1} role="group" aria-label={en ? 'Video gallery' : '视频作品'}>
      {videos.map((video, index) => <VideoCard key={video.id} video={video} en={en} href={hrefForVideo(video.id)}
        eager={index < 3} rememberOpener={rememberOpener} />)}
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) dismiss(); }}>
      {selected && <DialogContent className="video-dialog w-[calc(100%-1.5rem)] max-w-4xl gap-0 overflow-y-auto rounded-xl p-0"
        aria-describedby={undefined}
        onOpenAutoFocus={event => { event.preventDefault(); heading.current?.focus({ preventScroll: true }); }}
        onCloseAutoFocus={event => { event.preventDefault(); (opener.current || gallery.current)?.focus({ preventScroll: true }); }}>
        <DialogTitle ref={heading} tabIndex={-1} className="px-5 py-4 pr-14 text-left leading-snug">{selected.title}</DialogTitle>
        {children}
      </DialogContent>}
    </Dialog>
  </>;
}
