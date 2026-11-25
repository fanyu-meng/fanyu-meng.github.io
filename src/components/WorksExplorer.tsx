import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronDown, ChevronUp, Code2, Guitar, Headphones, Mic, PenLine, Search, Ticket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import articleIndexUrl from '../../public/content/acoustics-index.json?url';
import worksIndexUrl from '../../public/content/works.json?url';
import { VideoPlayer, videoSources, withPublishedVideos, type ArchivedVideo } from './PublishedVideos';
import VideoGallery from './VideoGallery';
import CreationStats from './CreationStats';
import CareerTimeline from './CareerTimeline';
import './works-explorer.css';

const categories = {
  all: ['全部', 'All'],
  career: ['主业', 'Career'],
  reviews: ['脱口秀', 'Stand-up'],
  podcast: ['播客', 'Podcast'],
  articles: ['声学科普', 'Acoustics'],
  writing: ['写作', 'Writing'],
  video: ['吉他&音乐', 'Guitar & music'],
  github: ['AI Builder', 'AI Builder'],
} as const;

type Category = keyof typeof categories;
// The career tab is a fixed page of its own, not an index of works.
type Kind = Exclude<Category, 'all' | 'writing' | 'career'> | 'club';
const articleTabs = {
  article: ['本人原创', 'My original articles'],
  'non-original': ['非本人原创', 'Guest & sourced articles'],
  answer: ['知乎回答', 'Zhihu answers'],
} as const;
type ArticleTab = keyof typeof articleTabs;
// Video sub-tabs: my own playing, and gigs I went to watch.
const videoTabs = { room: ['琴房', 'Practice room'], gigs: ['Gigs', 'Gigs'] } as const;
type VideoTab = keyof typeof videoTabs;
type Link = { url: string; label: string };
type Entry = {
  id: string;
  title: string;
  bookTitle?: string;
  projectCover?: { src: string; thumbnail: string; alt: [string, string] };
  alternateTitle?: string;
  publishedAt?: string;
  duration?: string;
  meta?: string;
  topic?: string;
  section?: 'articles' | 'writing';
  videoTab?: 'gigs';
  theme?: string;
  format?: 'article' | 'answer';
  originality?: 'original' | 'non-original';
  featured?: boolean;
  summary?: string;
  url?: string;
  links?: Link[];
  body?: string[];
  contentPath?: string;
  audio?: string;
  embed?: string;
  videoFile?: string;
  videoPoster?: string;
  thumbnail?: string;
  archive?: ArchivedVideo;
  chapters?: { seconds: number; title: string }[];
};
type Work = Entry & { kind: Kind };
type WorksFile = Partial<Record<Exclude<Kind, 'articles'>, Entry[]>> & { videoChannels?: Link[] };
type Article = { body?: string[]; html?: string };
type Address = {
  type: Category; item: string; q: string;
  articleTab?: ArticleTab; writingTab?: WritingTab; videoTab?: VideoTab;
};

function articleTabFor(item: Entry): ArticleTab {
  if (item.format === 'answer') return 'answer';
  return item.originality === 'non-original' ? 'non-original' : 'article';
}

// Writing sub-tabs. 文学 holds works first published here (topic 文学) and is hidden while empty.
const writingTabs = {
  literature: ['文学', 'Literature'],
  home: ['回家过年', 'Home for the New Year'],
  reviews: ['书评', 'Book reviews'],
  abroad: ['留学生活', 'Life abroad'],
  research: ['科研与技术', 'Research & tech'],
  music: ['音乐与吉他', 'Music & guitar'],
  misc: ['杂谈', 'Miscellany'],
} as const;
type WritingTab = keyof typeof writingTabs;
const isWritingTab = (tab: unknown): tab is WritingTab =>
  typeof tab === 'string' && Object.prototype.hasOwnProperty.call(writingTabs, tab);

function videoTabFor(item: Entry): VideoTab {
  return item.videoTab === 'gigs' ? 'gigs' : 'room';
}

function writingTabFor(item: Work): WritingTab {
  // Douban diaries are the New Year series; the rest of Douban is book reviews.
  if (item.id.startsWith('douban-')) return /^东北(?:回家|老家)过年/.test(item.title) ? 'home' : 'reviews';
  if (item.topic === '文学') return 'literature';
  // Other writing carries a theme; anything new without one lands in 杂谈.
  return isWritingTab(item.theme) && item.theme !== 'literature' ? item.theme : 'misc';
}

function writingLabel(item: Work, en: boolean) {
  return writingTabs[writingTabFor(item)][Number(en)];
}

const dataRoot = new URL(import.meta.env.BASE_URL + 'content/', window.location.origin);
const audioRoot = new URL('acoustics-media/', dataRoot).href;
const videoRoot = new URL('/largeFiles/acoustics-media/', window.location.origin).href;
const iconByKind = { reviews: Mic, podcast: Headphones, articles: BookOpen, video: Guitar, github: Code2, club: Ticket };
const artwork: Partial<Record<Kind, string>> = { podcast: 'pobicast.webp', club: 'leslam.webp' };
function categoryOf(item: Work): Category {
  if (item.kind === 'club') return 'reviews';
  if (item.kind === 'articles') return item.section || (item.topic === '声学科普' ? 'articles' : 'writing');
  return item.kind;
}

function labelForWork(item: Work, en: boolean) {
  return categories[categoryOf(item)][Number(en)];
}

function videoMetadata(item: Entry) {
  return [item.publishedAt, item.duration].filter(Boolean).join(' · ') || item.meta;
}

function iconFor(item: Work) {
  return categoryOf(item) === 'writing' ? PenLine : iconByKind[item.kind];
}

async function loadJSON<T>(url: URL | string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}

function articleURL(path: string) {
  // Index-relative body paths and site-root paths are both supported.
  const url = new URL(path, dataRoot);
  if (url.origin !== dataRoot.origin || !url.pathname.startsWith(dataRoot.pathname)) throw new Error('Invalid article URL');
  return url;
}

function webURL(raw?: string, base = location.href) {
  if (!raw?.trim()) return undefined;
  try {
    const url = new URL(raw, base);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

const safeTags = new Set('p br b strong em i del s sub sup u ol ul li blockquote pre code h1 h2 h3 h4 h5 h6 hr figure figcaption img a table thead tbody tfoot tr td th'.split(' '));
const omitTags = new Set('script style template iframe object embed svg noscript form'.split(' '));
const mathNS = 'http://www.w3.org/1998/Math/MathML';
const mathTags = new Set('math mfrac mi mn mo mover munder munderover mroot mrow msqrt msub msubsup msup mtable mtd mtext mtr mspace mstyle'.split(' '));
const mathAttributes = ['display', 'stretchy', 'form', 'mathvariant', 'columnalign', 'accent'];

function articleMarkup(html: string, base: string) {
  // Read into an inert template; only create approved markup in the resulting document fragment.
  const template = document.createElement('template');
  template.innerHTML = html;
  const result = document.createElement('div');
  function copy(source: Node, parent: Node) {
    if (source.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(source.textContent || ''));
      return;
    }
    if (!(source instanceof Element)) return;
    const tag = source.localName;
    if (omitTags.has(tag)) return;
    if (tag === 'audio' || tag === 'video') {
      // Players only load media from the site's own archives: audio sits with the article data,
      // videos sit in the separate largeFiles repository, which the site deployment publishes at /largeFiles/.
      const root = tag === 'video' ? videoRoot : audioRoot;
      const archived = (raw: string | null) => {
        const url = webURL(raw || undefined, base);
        return url?.startsWith(root) ? url : undefined;
      };
      const src = archived(source.getAttribute('src'));
      if (!src) return;
      const player = document.createElement(tag);
      player.controls = true;
      player.preload = 'none';
      player.src = src;
      if (player instanceof HTMLVideoElement) {
        player.playsInline = true;
        const poster = archived(source.getAttribute('poster'));
        if (poster) player.poster = poster;
        // Reserve the frame before playback so the article does not jump when the video loads.
        for (const name of ['width', 'height'] as const) {
          const value = source.getAttribute(name);
          if (value && /^[1-9]\d{1,3}$/.test(value)) player.setAttribute(name, value);
        }
      }
      const label = source.getAttribute('aria-label');
      if (label) player.setAttribute('aria-label', label);
      parent.appendChild(player);
      return;
    }
    const isMath = source.namespaceURI === mathNS && mathTags.has(tag);
    const el = isMath ? document.createElementNS(mathNS, tag) : safeTags.has(tag) ? document.createElement(tag) : null;
    if (el) {
      if (isMath) {
        for (const name of mathAttributes) {
          const value = source.getAttribute(name);
          if (value && /^[a-z]+$/.test(value)) el.setAttribute(name, value);
        }
      } else if (tag === 'img') {
        const url = webURL(source.getAttribute('src'), base);
        if (!url) return;
        el.setAttribute('src', url);
        el.setAttribute('alt', source.getAttribute('alt') || '');
        el.setAttribute('loading', 'lazy');
        el.setAttribute('referrerpolicy', 'no-referrer');
      } else if (tag === 'a') {
        const url = webURL(source.getAttribute('href'), base);
        if (url) {
          el.setAttribute('href', url);
          if (new URL(url).origin !== location.origin) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          }
        }
      } else if (tag === 'td' || tag === 'th') {
        for (const name of ['colspan', 'rowspan']) {
          const value = source.getAttribute(name);
          if (value && /^[1-9]\d?$/.test(value)) el.setAttribute(name, value);
        }
      }
      parent.appendChild(el);
    }
    for (const child of source.childNodes) copy(child, el || parent);
  }
  for (const child of template.content.childNodes) copy(child, result);
  const first = Array.from(result.childNodes).find(el => el.textContent?.trim() || el instanceof Element);
  if (!first) return { head: '', rest: '' };
  const head = document.createElement('div');
  head.append(first);
  return { head: head.innerHTML, rest: result.innerHTML.trim() };
}

function readAddress(): Address {
  const [path, query] = location.hash.replace(/^#\/?/, '').split('?');
  const [legacy, id = ''] = path.split('/');
  const params = new URLSearchParams(query);
  const rawType = params.get('type') || legacy;
  const type = rawType === 'leslam' || rawType === 'club' ? 'reviews' :
    Object.prototype.hasOwnProperty.call(categories, rawType) ? rawType as Category : 'all';
  const item = params.get('item') || (rawType === 'leslam' || rawType === 'club' ? 'leslam-club' : id);
  const format = params.get('format');
  const tab = params.get('tab');
  const group = params.get('group');
  // Old links: the Douban tab became the 回家过年 and 书评 tabs.
  const writingTab = isWritingTab(tab) ? tab : tab === 'douban' ? (group === 'book-reviews' ? 'reviews' : 'home') : undefined;
  return { type, item, q: params.get('q') || '',
    articleTab: format === 'article' || format === 'non-original' || format === 'answer' ? format : undefined,
    writingTab,
    videoTab: type === 'video' && (tab === 'room' || tab === 'gigs') ? tab : undefined };
}

function hrefFor(address: Address) {
  const params = new URLSearchParams();
  if (address.type !== 'all') params.set('type', address.type);
  if (address.item) params.set('item', address.item);
  if (address.q) params.set('q', address.q);
  if (address.type === 'articles' && address.articleTab) params.set('format', address.articleTab);
  if (address.type === 'writing' && address.writingTab) params.set('tab', address.writingTab);
  if (address.type === 'video' && address.videoTab) params.set('tab', address.videoTab);
  const query = params.toString();
  return '#/works' + (query ? '?' + query : '');
}

function orderWorks(works: WorksFile, articles: Entry[]) {
  const groups: Record<Kind, Work[]> = { reviews: [], podcast: [], articles: [], video: [], github: [], club: [] };
  for (const kind of Object.keys(groups) as Kind[]) {
    groups[kind] = (kind === 'articles' ? articles : works[kind] || []).map(entry => ({ ...entry, kind }));
  }
  // Show each pursuit in the first few rows, and keep each source's ordering within its category.
  const keys = Object.keys(groups) as Kind[];
  return [...keys.flatMap(k => groups[k].slice(0, 1)), ...keys.flatMap(k => groups[k].slice(1))];
}

function ReviewedBook({ title, en }: { title: string; en: boolean }) {
  return <span className="ex-reviewed-book">{en ? `Review of ${title}` : `评《${title}》`}</span>;
}

// In the phone layout long text opens as a fading excerpt, so the list stays easy to scan.
const excerptHeight = 224;
// Text that is only a little longer than the excerpt is shown whole.
const excerptSlack = 112;

function Excerpt({ en, children }: { en: boolean; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);
  const measure = () => { if (box.current) setLong(box.current.scrollHeight > excerptHeight + excerptSlack); };
  // Text that arrives with a render is measured before it paints; images and rotation reflow it later.
  useLayoutEffect(measure);
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    observer.observe(box.current!);
    return () => observer.disconnect();
  }, []);
  const clipped = long && !open;
  function toggle() {
    flushSync(() => setOpen(!open));
    // Folding from the end of a long text would otherwise leave the reader far below it.
    if (open) (box.current!.closest('.ex-row') || box.current!).scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
  // Keyboard focus or find-in-page can land in the hidden part: unroll it instead of scrolling it out of sight.
  function reveal() {
    flushSync(() => setOpen(true));
    const focused = document.activeElement;
    if (focused && box.current!.contains(focused)) focused.scrollIntoView({ block: 'nearest' });
  }
  return <>
    <div ref={box} className={clipped ? 'ex-excerpt' : undefined} style={clipped ? { maxHeight: excerptHeight } : undefined}
      onScroll={clipped ? reveal : undefined}>{children}</div>
    {long && <button type="button" className="ex-unfold" aria-expanded={open} onClick={toggle}>
      {open ? (en ? 'Show less' : '收起') : (en ? 'Continue reading' : '展开全文')}
      {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
    </button>}
  </>;
}

function Reader({ item, small, children }: { item: Work; small: boolean; children?: React.ReactNode }) {
  const { language } = useLanguage();
  const en = language === 'en';
  const article = useQuery({
    queryKey: ['acoustics-body', item.contentPath],
    queryFn: ({ signal }) => loadJSON<Article>(articleURL(item.contentPath!), signal),
    enabled: Boolean(item.contentPath),
    staleTime: Infinity,
  });
  const richText = useMemo(() => article.data?.html && item.contentPath
    ? articleMarkup(article.data.html, articleURL(item.contentPath).href) : undefined, [article.data, item.contentPath]);
  const Icon = iconFor(item);
  const paragraphs = article.data?.body || (item.body?.length ? item.body : item.summary ? [item.summary] : []);
  const text = paragraphs.map((p, index) => <p key={index}>{p}</p>);
  const intro = richText ? <div className="ex-format" dangerouslySetInnerHTML={{ __html: richText.head }} /> : text[0];
  const rest = richText?.rest ? <div className="ex-format" dangerouslySetInnerHTML={{ __html: richText.rest }} /> :
    !richText && text.length > 1 ? text.slice(1) : null;
  const originalLinks = item.links?.length ? item.links : item.url ? [{ url: item.url, label: en ? 'Original' : '原文' }] : [];
  const audio = webURL(item.audio);
  const videoFile = webURL(item.videoFile);
  const embed = webURL(item.embed);
  const sources = item.kind === 'video' ? videoSources(item) : [];
  const links = item.kind === 'video' ? originalLinks.filter(link =>
    webURL(link.url) !== videoFile && !videoSources({ id: item.id, title: item.title, url: link.url }).length) : originalLinks;
  const cover = item.projectCover;
  const meta = item.kind === 'video' ? videoMetadata(item) : item.meta;
  const player = embed ? new URL(embed) : undefined;
  const embedAllowed = player && ['embed.podcasts.apple.com','open.spotify.com','player.bilibili.com','www.youtube.com','www.youtube-nocookie.com','www.xiaoyuzhoufm.com'].includes(player.hostname);
  if (player?.hostname === 'player.bilibili.com') player.searchParams.set('autoplay', '0');
  return (
    <article id="ex-reader" className="ex-reader" aria-label={item.title}>
      <div className="ex-reading">
        {cover && <img className="ex-project-cover" src={import.meta.env.BASE_URL + cover.src}
          alt={cover.alt[Number(en)]} width={832} height={468} decoding="async" />}
        <div className="ex-kicker"><Icon aria-hidden="true" />{labelForWork(item, en)}{categoryOf(item) === 'writing'
          ? ' · ' + writingLabel(item, en)
          : item.kind === 'articles' ? ' · ' + articleTabs[articleTabFor(item)][Number(en)] : ''}</div>
        <h3>{item.title}</h3>
        {item.bookTitle && <ReviewedBook title={item.bookTitle} en={en} />}
        {meta && <p className="ex-meta">{meta}</p>}
        {audio ? <div className="ex-media"><audio controls preload="none" src={audio} /></div> :
          videoFile ? <div className="ex-media"><video title={item.title} controls playsInline preload="none" src={videoFile} poster={webURL(item.videoPoster)} /></div> :
          sources.length > 0 || item.archive ? <VideoPlayer key={item.id} sources={sources} title={item.title} en={en}
            archive={item.archive} poster={item.thumbnail && import.meta.env.BASE_URL + item.thumbnail} /> :
          embedAllowed && <div className="ex-media"><iframe title={item.title} src={player.href} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>}
        <div className="ex-body empty:hidden">
          {(intro || rest) && (small ? <Excerpt en={en}>{intro}{rest}</Excerpt> : <>{intro}{rest}</>)}
          {item.contentPath && article.isPending && <p role="status">{en ? 'Loading article…' : '正在加载正文…'}</p>}
          {item.contentPath && article.isError && <div className="ex-status" role="status">{en ? 'The article could not be loaded. ' : '正文暂未载入。'}<button onClick={() => article.refetch()}>{en ? 'Retry' : '重新加载'}</button></div>}
        </div>
        {links.length > 0 && <div className="ex-actions">{links.map(link => {
          const url = webURL(link.url);
          return url && <a key={url} href={url} target="_blank" rel="noopener noreferrer">{link.label}</a>;
        })}</div>}
        {!!item.chapters?.length && <section className="ex-chapters">
          <h4>{en ? 'Episode chapters' : '本期时间轴'}</h4>
          {item.chapters.map((chapter, i) => <p key={i}><time>{Math.floor(chapter.seconds / 60)}:{String(chapter.seconds % 60).padStart(2, '0')}</time>{chapter.title}</p>)}
        </section>}
        {children}
      </div>
    </article>
  );
}

function ProjectGallery({ projects, address, en }: { projects: Work[]; address: Address; en: boolean }) {
  const selected = projects.find(project => project.id === address.item);
  if (selected) {
    return <div className="ex-project-detail">
      <a className="ex-project-back" href={hrefFor({ ...address, item: '' })}>
        {en ? 'Back to all projects' : '返回项目网格'}
      </a>
      <Reader key={selected.id} item={selected} small={false} />
    </div>;
  }

  return <div className="ex-project-grid" role="group" aria-label={categories.github[Number(en)]}>
    {projects.map(project => {
      const cover = project.projectCover;
      const base = import.meta.env.BASE_URL;
      return <a key={project.id} className="ex-project-card" href={hrefFor({ ...address, item: project.id })}>
        <span className="ex-project-art">
          {cover ? <img alt="" src={base + cover.src}
            srcSet={`${base + cover.thumbnail} 256w, ${base + cover.src} 832w`}
            sizes="(min-width: 1248px) 285px, (min-width: 960px) 24vw, 48vw"
            width={832} height={468} decoding="async" /> : <Code2 aria-hidden="true" />}
        </span>
        <h3>{project.title}</h3>
        {project.summary && <p>{project.summary}</p>}
      </a>;
    })}
  </div>;
}

export default function WorksExplorer() {
  const { language } = useLanguage();
  const en = language === 'en';
  const [address, setAddress] = useState(readAddress);
  const [folded, setFolded] = useState(false);
  const [small, setSmall] = useState(() => window.matchMedia('(max-width: 759px)').matches);
  const list = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const requestedScroll = useRef(Boolean(location.hash.match(/^#\/?works\?/)));
  const labels = (type: Category) => categories[type][Number(en)];
  const works = useQuery({
    queryKey: ['work-index', worksIndexUrl],
    queryFn: async ({ signal }) => withPublishedVideos(await loadJSON<WorksFile>(worksIndexUrl, signal), dataRoot, signal),
    staleTime: Infinity,
  });
  const articles = useQuery({
    queryKey: ['acoustics-index', articleIndexUrl],
    queryFn: ({ signal }) => loadJSON<Entry[]>(articleIndexUrl, signal),
    staleTime: Infinity,
  });
  const entries = useMemo(() => orderWorks(works.data || {}, articles.data || []), [works.data, articles.data]);
  const terms = address.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // Preserve published article links whose topic now belongs in another section.
  const linkedArticle = address.type !== 'all' && entries.find(item => item.kind === 'articles' && item.id === address.item);
  const activeType = linkedArticle ? categoryOf(linkedArticle) : address.type;
  const browsingArticles = activeType === 'articles';
  const activeArticleTab = browsingArticles && linkedArticle
    ? articleTabFor(linkedArticle) : address.articleTab || 'article';
  // Sub-tabs with nothing in them (文学, until a work is published) stay hidden.
  const shownWritingTabs = (Object.keys(writingTabs) as WritingTab[]).filter(tab =>
    entries.some(item => categoryOf(item) === 'writing' && writingTabFor(item) === tab));
  const activeWritingTab: WritingTab = linkedArticle && categoryOf(linkedArticle) === 'writing'
    ? writingTabFor(linkedArticle) : address.writingTab || shownWritingTabs[0] || 'home';
  // A direct link to a video opens in the sub-tab the video belongs to.
  const linkedVideo = activeType === 'video' && entries.find(item => item.kind === 'video' && item.id === address.item);
  const activeVideoTab: VideoTab = linkedVideo ? videoTabFor(linkedVideo) : address.videoTab || 'room';
  const visible = entries.filter(item => {
    const category = categoryOf(item);
    if (activeType !== 'all' && category !== activeType) return false;
    if (browsingArticles && articleTabFor(item) !== activeArticleTab) return false;
    if (activeType === 'video' && videoTabFor(item) !== activeVideoTab) return false;
    const writingTab = category === 'writing' ? writingTabFor(item) : undefined;
    if (activeType === 'writing' && writingTab !== activeWritingTab) return false;
    const source = item.links?.map(link => link.label + ' ' + link.url).join(' ');
    const searchable = [item.id, item.title, item.bookTitle, item.alternateTitle, item.publishedAt, item.meta, item.topic, item.summary, source,
      writingTab ? writingTabs[writingTab].join(' ') : item.format === 'answer' ? '知乎回答 Zhihu answer' : '',
      labelForWork(item, false), labelForWork(item, true)].join(' ').toLowerCase();
    return terms.every(term => searchable.includes(term));
  });
  if (activeType === 'reviews') {
    visible.sort((a, b) => Number(b.id === 'leslam-club') - Number(a.id === 'leslam-club'));
  }
  const current = visible.find(item => item.id === address.item);

  useEffect(() => {
    const breakpoint = window.matchMedia('(max-width: 759px)');
    const resize = () => { setSmall(breakpoint.matches); setFolded(false); };
    const restore = () => {
      const next = readAddress();
      const withinGallery = next.type === 'video' && section.current?.querySelector('.video-gallery');
      requestedScroll.current = !withinGallery && /^#\/?works\?/.test(location.hash);
      setFolded(false);
      setAddress(next);
    };
    breakpoint.addEventListener('change', resize);
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => {
      breakpoint.removeEventListener('change', resize);
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
    };
  }, []);

  useEffect(() => { if (list.current) list.current.scrollTop = 0; }, [address.q, address.type, activeArticleTab, address.writingTab]);
  useEffect(() => {
    if (works.isPending || articles.isPending || !requestedScroll.current) return;
    requestedScroll.current = false;
    section.current?.scrollIntoView({ block: 'start' });
    const chosen = list.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (chosen && list.current && !small) {
      const delta = chosen.getBoundingClientRect().top - list.current.getBoundingClientRect().top;
      if (delta < 0 || delta + chosen.offsetHeight > list.current.clientHeight) list.current.scrollTop += delta;
    }
    if (chosen && small) chosen.scrollIntoView({ block: 'start' });
  }, [works.isPending, articles.isPending, small, address]);

  function navigate(next: Address, replace = false) {
    setFolded(false);
    setAddress(next);
    const href = hrefFor(next);
    if (href !== location.hash) history[replace ? 'replaceState' : 'pushState'](history.state, '', href);
  }
  function search(q: string, replace = false) {
    navigate({
      // The career page has nothing to search, so a search there looks through all works.
      type: activeType === 'career' ? 'all' : activeType, item: '', q,
      writingTab: activeType === 'writing' ? activeWritingTab : undefined,
      articleTab: browsingArticles ? activeArticleTab : undefined,
      videoTab: activeType === 'video' ? activeVideoTab : undefined,
    }, replace);
  }
  function choose(item: Work) {
    if (small && current?.id === item.id) { setFolded(!folded); return; }
    navigate({ ...address, type: activeType, item: item.id });
    requestAnimationFrame(() => {
      if (small) {
        const selected = list.current?.querySelector<HTMLElement>('[aria-expanded="true"]');
        if (selected && selected.getBoundingClientRect().top < 65) selected.scrollIntoView({ block: 'start' });
      } else if ((list.current?.parentElement?.getBoundingClientRect().top ?? 0) < -65) {
        section.current?.scrollIntoView({ block: 'start' });
      }
    });
  }
  const needsArticles = activeType === 'writing' || browsingArticles;
  const indexes = activeType === 'all' ? [articles, works] : [needsArticles ? articles : works];
  const loading = indexes.some(index => index.isPending);
  const failedIndexes = indexes.filter(index => index.isError);
  const writingCount = !loading && !failedIndexes.length &&
    <span role="status">{en ? visible.length + ' results' : '共 ' + visible.length + ' 篇'}</span>;
  const related = current?.kind === 'club' ? entries.filter(x => x.kind === 'reviews' && /乐咔|LeSlam/i.test(x.title + (x.topic || ''))).slice(0, 3) :
    current?.kind === 'reviews' && /乐咔|LeSlam/i.test(current.title + (current.topic || '')) ? entries.filter(x => x.kind === 'club') : [];
  const reader = current && <Reader key={current.id} item={current} small={small}>
    {related.length > 0 && <div className="ex-related">{related.map(row => <button type="button" key={row.id}
      onClick={() => navigate({ type: 'reviews', item: row.id, q: '' })}>{row.title}</button>)}</div>}
  </Reader>;

  return <section id="works" className="explorer" ref={section} aria-labelledby="ex-heading">
    <div className="ex-wrap">
      <div className="ex-heading">
        <h2 id="ex-heading">{en ? 'Works' : '作品'}</h2>
        <div className="ex-tools">
          <CreationStats />
          <label className="ex-search"><Search aria-hidden="true" /><input type="search" maxLength={180}
            placeholder={en ? 'Search works' : '搜索作品'} aria-label={en ? 'Search works' : '搜索作品'}
            value={address.q} onChange={e => search(e.target.value, true)} /></label>
        </div>
      </div>
      <nav className="ex-filters" aria-label={en ? 'Filter by type' : '按栏目筛选'}>
        {(Object.keys(categories) as Category[]).map(type => <button type="button" key={type}
          className={type === 'all' ? 'ex-home' : undefined}
          aria-pressed={activeType === type} onClick={() => navigate({ type, item: '', q: address.q })}>
          {labels(type)}</button>)}
      </nav>
      {activeType === 'writing' && <div className="ex-subfilters flex-wrap" role="group" aria-label={en ? 'Writing categories' : '写作分类'}>
        {shownWritingTabs.map(tab => <button key={tab} type="button"
          aria-pressed={activeWritingTab === tab}
          onClick={() => navigate({ type: 'writing', item: '', q: '', writingTab: tab })}>
          {writingTabs[tab][Number(en)]}
        </button>)}
        {writingCount}
      </div>}
      {browsingArticles && <div className="ex-subfilters flex-wrap" role="group" aria-label={en ? 'Acoustics categories' : '声学科普分类'}>
        {(Object.keys(articleTabs) as ArticleTab[]).map(tab => <button key={tab} type="button"
          aria-pressed={activeArticleTab === tab}
          onClick={() => navigate({ type: 'articles', item: '', q: address.q, articleTab: tab })}>
          {articleTabs[tab][Number(en)]}
        </button>)}
        <span role="status">{en ? visible.length + ' results' : '共 ' + visible.length + ' 篇'}</span>
      </div>}
      {activeType === 'video' && <div className="ex-subfilters flex-wrap" role="group" aria-label={en ? 'Video categories' : '视频分类'}>
        {(Object.keys(videoTabs) as VideoTab[]).map(tab => <button key={tab} type="button"
          aria-pressed={activeVideoTab === tab}
          onClick={() => navigate({ type: 'video', item: '', q: address.q, videoTab: tab })}>
          {videoTabs[tab][Number(en)]}
        </button>)}
        {works.data?.videoChannels?.map(link => <a key={link.url} href={webURL(link.url)} target="_blank" rel="noopener noreferrer"
          className="mr-2 text-primary underline-offset-4 hover:underline">{!en && link.label === 'Bilibili' ? 'B 站' : link.label}</a>)}
        <span role="status">{en ? visible.length + (visible.length === 1 ? ' video' : ' videos') : '共 ' + visible.length + ' 个视频'}</span>
      </div>}
      {!browsingArticles && activeType !== 'writing' && activeType !== 'video' && activeType !== 'career' && <p className="sr-only" aria-live="polite">{en ? visible.length + ' results' : '显示 ' + visible.length + ' 条作品'}</p>}
      {activeType === 'career' ? <CareerTimeline en={en} /> : <>
      {failedIndexes.length > 0 && <div className="ex-status" role="status">{en ? 'Some works could not be loaded. ' : '部分作品暂未载入。'}
        <button type="button" onClick={() => failedIndexes.forEach(index => { void index.refetch(); })}>{en ? 'Retry' : '重新加载'}</button>
      </div>}
      {!visible.length && loading && <p className="ex-empty" role="status">{en ? 'Loading works…' : '正在载入作品…'}</p>}
      {!visible.length && !loading && !failedIndexes.length && <div className="ex-empty">
        {address.q.trim() ? <>{en ? `No works match “${address.q.trim()}”. ` : `没有与“${address.q.trim()}”匹配的作品。`}
          <button type="button" onClick={() => search('')}>{en ? 'Clear search' : '清除搜索'}</button></>
          : <>{en ? 'No works found. ' : '没有匹配的作品。'}<button type="button" onClick={() => navigate({ type: 'all', item: '', q: '' })}>{en ? 'Clear filters' : '清除筛选'}</button></>}
      </div>}
      {activeType === 'github' && visible.length > 0 && <ProjectGallery projects={visible} address={address} en={en} />}
      {activeType === 'video' && visible.length > 0 && <VideoGallery videos={visible} en={en} selectedId={address.item}
        hrefForVideo={id => hrefFor({ type: 'video', q: address.q, item: id, videoTab: activeVideoTab })}
        closeDirectLink={() => navigate({ type: 'video', q: address.q, item: '', videoTab: activeVideoTab }, true)}>
        {reader}
      </VideoGallery>}
      {activeType !== 'video' && activeType !== 'github' && visible.length > 0 &&
        <div className="ex-split">
          <div className="ex-list" role="group" aria-label={en ? 'Work index' : '作品目录'} ref={list}>
            {visible.map(item => {
              const active = current?.id === item.id, Icon = iconFor(item);
              const cover = item.projectCover;
              const thumbnail = cover?.thumbnail || artwork[item.kind];
              const category = labelForWork(item, en);
              const extra = item.kind === 'video' ? videoMetadata(item) :
                item.kind === 'podcast' ? item.meta?.split(' · ').slice(1,3).join(' · ') :
                item.kind === 'reviews' ? item.meta?.match(/\d{4}-\d\d-\d\d/)?.[0] :
                item.kind === 'articles' ? (categoryOf(item) === 'writing' ? writingLabel(item, en)
                  : item.format === 'answer' ? (en ? 'Zhihu answer' : '知乎回答') : item.meta?.split(' · ')[0]) : item.topic;
              return <div className="ex-row" key={item.kind + ':' + item.id}>
                <button type="button" className={cover ? 'ex-select ex-select--project' : 'ex-select'} data-key={item.id} aria-pressed={active}
                  aria-expanded={small ? active && !folded : undefined} aria-controls={active && (!small || !folded) ? 'ex-reader' : undefined} onClick={() => choose(item)}>
                  <span className={'ex-row-icon tone-' + item.kind}>{thumbnail
                    ? <img alt="" src={import.meta.env.BASE_URL + thumbnail} loading="lazy" decoding="async" />
                    : <Icon aria-hidden="true" />}</span>
                  <span className="ex-row-text"><small>{[category, extra !== category && extra].filter(Boolean).join(' · ')}</small>
                    <strong>{item.title}</strong>
                    {item.bookTitle && <ReviewedBook title={item.bookTitle} en={en} />}
                    {item.summary && <span className="ex-row-summary">{item.summary}</span>}</span>
                </button>
                {small && active && !folded && reader}
              </div>;
            })}
          </div>
          {!small && current && <div id="ex-pane" className="ex-pane">{reader}</div>}
        </div>}
      </>}
    </div>
  </section>;
}
