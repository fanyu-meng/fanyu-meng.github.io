import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Code2, Guitar, Headphones, Mic, PenLine, Search, Ticket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import articleIndexUrl from '../../public/content/acoustics-index.json?url';
import { VideoPlayer, videoSources, withPublishedVideos } from './PublishedVideos';
import './works-explorer.css';

const categories = {
  all: ['全部', 'All'],
  reviews: ['脱口秀', 'Stand-up'],
  podcast: ['播客', 'Podcast'],
  articles: ['声学科普', 'Acoustics'],
  writing: ['文字', 'Writing'],
  video: ['吉他🎸&音乐🎵', 'Guitar 🎸 & music 🎵'],
  github: ['我开发的项目', 'Projects I built'],
} as const;

type Category = keyof typeof categories;
type Kind = Exclude<Category, 'all' | 'writing'> | 'club';
const articleFormats = { article: ['文章', 'Articles'], answer: ['知乎回答', 'Zhihu answers'] } as const;
type ArticleFormat = keyof typeof articleFormats;
type WritingTab = 'writing' | 'zhihu' | 'douban';
const doubanGroups = {
  northeast: ['东北回家过年', 'New Year in Northeast China'],
  'book-reviews': ['书评', 'Book reviews'],
} as const;
type DoubanGroup = keyof typeof doubanGroups;
type Link = { url: string; label: string };
type Entry = {
  id: string;
  title: string;
  alternateTitle?: string;
  publishedAt?: string;
  duration?: string;
  meta?: string;
  topic?: string;
  section?: 'articles' | 'writing';
  format?: ArticleFormat;
  featured?: boolean;
  summary?: string;
  url?: string;
  links?: Link[];
  body?: string[];
  contentPath?: string;
  audio?: string;
  embed?: string;
  videoFile?: string;
  chapters?: { seconds: number; title: string }[];
};
type Work = Entry & { kind: Kind };
type WorksFile = Partial<Record<Exclude<Kind, 'articles'>, Entry[]>> & { videoChannels?: Link[] };
type Article = { body?: string[]; html?: string };
type Address = {
  type: Category; item: string; q: string;
  format?: ArticleFormat; writingTab?: WritingTab; doubanGroup?: DoubanGroup;
};

// Curated writing selection. Other non-acoustics entries appear under 知乎创作.
const writingIds = new Set([
  'answer-499222686', 'answer-510079266', 'answer-814774540', 'answer-850209799',
  'answer-625250053', 'answer-652610384', 'answer-883511002', 'answer-974363858',
  'answer-962373050', 'answer-986565730', 'answer-1095657294', 'answer-1584623872',
  'answer-1059104737', 'zhihu-17943190775',
]);
const writingTabs = { writing: ['写作', 'Writing'], zhihu: ['知乎创作', 'Zhihu creations'], douban: ['豆瓣', 'Douban'] } as const;

function writingTabFor(item: Work): WritingTab {
  if (item.id.startsWith('douban-')) return 'douban';
  return writingIds.has(item.id) ? 'writing' : 'zhihu';
}

function doubanGroupFor(item: Entry): DoubanGroup {
  return /^东北(?:回家|老家)过年/.test(item.title) ? 'northeast' : 'book-reviews';
}

function writingLabel(item: Work, en: boolean) {
  const tab = writingTabFor(item);
  const label = writingTabs[tab][Number(en)];
  return tab === 'douban' ? label + ' · ' + doubanGroups[doubanGroupFor(item)][Number(en)] : label;
}

const dataRoot = new URL(import.meta.env.BASE_URL + 'content/', window.location.origin);
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
const omitTags = new Set('script style template iframe object embed svg noscript form video audio'.split(' '));
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
  return { type, item, q: params.get('q') || '', format: format === 'answer' || format === 'article' ? format : undefined,
    writingTab: tab === 'writing' || tab === 'zhihu' || tab === 'douban' ? tab : undefined,
    doubanGroup: tab === 'douban' && (group === 'northeast' || group === 'book-reviews') ? group : undefined };
}

function hrefFor(address: Address) {
  const params = new URLSearchParams();
  if (address.type !== 'all') params.set('type', address.type);
  if (address.item) params.set('item', address.item);
  if (address.q) params.set('q', address.q);
  if (address.format) params.set('format', address.format);
  if (address.type === 'writing' && address.writingTab) {
    params.set('tab', address.writingTab);
    if (address.writingTab === 'douban' && address.doubanGroup) params.set('group', address.doubanGroup);
  }
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
  const links = item.links?.length ? item.links : item.url ? [{ url: item.url, label: en ? 'Original' : '原文' }] : [];
  const audio = webURL(item.audio);
  const videoFile = webURL(item.videoFile);
  const embed = webURL(item.embed);
  const sources = item.kind === 'video' ? videoSources(item) : [];
  const meta = item.kind === 'video' ? videoMetadata(item) : item.meta;
  const player = embed ? new URL(embed) : undefined;
  const embedAllowed = player && ['embed.podcasts.apple.com','open.spotify.com','player.bilibili.com','www.youtube.com','www.youtube-nocookie.com','www.xiaoyuzhoufm.com'].includes(player.hostname);
  if (player?.hostname === 'player.bilibili.com') player.searchParams.set('autoplay', '0');
  return (
    <article id="ex-reader" className="ex-reader" aria-label={item.title}>
      <div className="ex-reading">
        <div className="ex-kicker"><Icon aria-hidden="true" />{labelForWork(item, en)}{categoryOf(item) === 'writing'
          ? ' · ' + writingLabel(item, en)
          : item.format === 'answer' ? (en ? ' · Zhihu answer' : ' · 知乎回答') : ''}</div>
        <h3>{item.title}</h3>
        {meta && <p className="ex-meta">{meta}</p>}
        {audio ? <div className="ex-media"><audio controls preload="none" src={audio} /></div> :
          (sources.length > 1 || (sources.length && !embedAllowed && !videoFile)) ? <VideoPlayer key={item.id} sources={sources} title={item.title} en={en} /> :
          videoFile ? <div className="ex-media"><video title={item.title} controls playsInline preload="none" src={videoFile} /></div> :
          embedAllowed && <div className="ex-media"><iframe title={item.title} src={player.href} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>}
        <div className="ex-body empty:hidden">
          {intro}
          {rest && (small ? <details className="ex-more"><summary>{en ? 'Continue reading' : '继续阅读'}</summary>{rest}</details> : rest)}
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

export default function WorksExplorer() {
  const { language, t } = useLanguage();
  const en = language === 'en';
  const [address, setAddress] = useState(readAddress);
  const [folded, setFolded] = useState(false);
  const [small, setSmall] = useState(() => window.matchMedia('(max-width: 759px)').matches);
  const list = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const requestedScroll = useRef(Boolean(location.hash.match(/^#\/?works\?/)));
  const labels = (type: Category) => categories[type][Number(en)];
  const works = useQuery({ queryKey: ['work-index'], queryFn: async ({ signal }) => withPublishedVideos(await loadJSON<WorksFile>(new URL('works.json', dataRoot), signal), dataRoot, signal), staleTime: Infinity });
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
  const activeWritingTab = linkedArticle && categoryOf(linkedArticle) === 'writing'
    ? writingTabFor(linkedArticle) : address.writingTab || 'writing';
  const browsingDouban = activeType === 'writing' && activeWritingTab === 'douban';
  const activeDoubanGroup = browsingDouban && address.doubanGroup
    ? (linkedArticle ? doubanGroupFor(linkedArticle) : address.doubanGroup) : undefined;
  const visible = entries.filter(item => {
    const category = categoryOf(item);
    if (activeType !== 'all' && category !== activeType) return false;
    if (browsingArticles && address.format && (item.format || 'article') !== address.format) return false;
    const writingTab = category === 'writing' ? writingTabFor(item) : undefined;
    if (activeType === 'writing' && writingTab !== activeWritingTab) return false;
    const group = writingTab === 'douban' ? doubanGroupFor(item) : undefined;
    if (activeDoubanGroup && group !== activeDoubanGroup) return false;
    const source = item.links?.map(link => link.label + ' ' + link.url).join(' ');
    const searchable = [item.id, item.title, item.alternateTitle, item.publishedAt, item.meta, item.topic, item.summary, source,
      writingTab ? writingTabs[writingTab].join(' ') : item.format === 'answer' ? '知乎回答 Zhihu answer' : '',
      group && doubanGroups[group].join(' '),
      labelForWork(item, false), labelForWork(item, true)].join(' ').toLowerCase();
    return terms.every(term => searchable.includes(term));
  });
  if (activeType === 'reviews') {
    visible.sort((a, b) => Number(b.id === 'leslam-club') - Number(a.id === 'leslam-club'));
  }
  const current = visible.find(item => item.id === address.item) || visible[0];

  useEffect(() => {
    const breakpoint = window.matchMedia('(max-width: 759px)');
    const resize = () => { setSmall(breakpoint.matches); setFolded(false); };
    const restore = () => {
      requestedScroll.current = /^#\/?works\?/.test(location.hash);
      setFolded(false);
      setAddress(readAddress());
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

  useEffect(() => { if (list.current) list.current.scrollTop = 0; }, [address.q, address.type, address.format, address.writingTab, address.doubanGroup]);
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
      type: activeType, item: '', q, doubanGroup: activeDoubanGroup,
      writingTab: activeType === 'writing' ? activeWritingTab : undefined,
      format: browsingArticles ? address.format : undefined,
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
        <h2 id="ex-heading">{t('projects.title')}</h2>
        <label className="ex-search"><Search aria-hidden="true" /><input type="search" maxLength={180}
          placeholder={en ? 'Search work' : '搜索作品'} aria-label={en ? 'Search work' : '搜索作品'}
          value={address.q} onChange={e => search(e.target.value, true)} /></label>
      </div>
      <nav className="ex-filters" aria-label={en ? 'Filter by type' : '按栏目筛选'}>
        {(Object.keys(categories) as Category[]).map(type => <button type="button" key={type}
          aria-pressed={activeType === type} onClick={() => navigate({ type, item: '', q: address.q })}>{labels(type)}</button>)}
      </nav>
      {activeType === 'writing' && <div className="ex-subfilters" role="group" aria-label={en ? 'Writing categories' : '文字分类'}>
        {(Object.keys(writingTabs) as WritingTab[]).map(tab => <button key={tab} type="button"
          aria-pressed={activeWritingTab === tab}
          onClick={() => navigate({ type: 'writing', item: '', q: '', writingTab: tab })}>
          {writingTabs[tab][Number(en)]}
        </button>)}
        {!browsingDouban && writingCount}
      </div>}
      {browsingDouban && <div className="ex-subfilters flex-wrap border-l-2 border-border pl-3" role="group" aria-label={en ? 'Douban categories' : '豆瓣分类'}>
        {(Object.keys(doubanGroups) as DoubanGroup[]).map(group => <button key={group} type="button"
          aria-pressed={activeDoubanGroup === group}
          onClick={() => navigate({ type: 'writing', writingTab: 'douban', item: '', q: '',
            doubanGroup: group === activeDoubanGroup ? undefined : group })}>
          {doubanGroups[group][Number(en)]}
        </button>)}
        {writingCount}
      </div>}
      {browsingArticles && <div className="ex-subfilters" role="group" aria-label={en ? 'Filter by format' : '按作品形式筛选'}>
        {(Object.keys(articleFormats) as ArticleFormat[]).map(format => {
          const selected = address.format === format;
          return <button key={format} type="button" aria-pressed={selected}
            onClick={() => navigate({ ...address, type: activeType, item: '', format: selected ? undefined : format })}>
            {articleFormats[format][Number(en)]}
          </button>;
        })}
        <span role="status">{en ? visible.length + ' results' : '共 ' + visible.length + ' 篇'}</span>
      </div>}
      {activeType === 'video' && <div className="ex-subfilters">
        {works.data?.videoChannels?.map(link => <a key={link.url} href={webURL(link.url)} target="_blank" rel="noopener noreferrer"
          className="mr-2 text-primary underline-offset-4 hover:underline">{!en && link.label === 'Bilibili' ? 'B 站' : link.label}</a>)}
        <span role="status">{en ? visible.length + (visible.length === 1 ? ' video' : ' videos') : '共 ' + visible.length + ' 个视频'}</span>
      </div>}
      {!browsingArticles && activeType !== 'writing' && activeType !== 'video' && <p className="sr-only" aria-live="polite">{en ? visible.length + ' results' : '显示 ' + visible.length + ' 条作品'}</p>}
      {failedIndexes.length > 0 && <div className="ex-status" role="status">{en ? 'Some works could not be loaded. ' : '部分作品暂未载入。'}
        <button type="button" onClick={() => failedIndexes.forEach(index => { void index.refetch(); })}>{en ? 'Retry' : '重新加载'}</button>
      </div>}
      {!visible.length && loading && <p className="ex-empty" role="status">{en ? 'Loading works…' : '正在载入作品…'}</p>}
      {!visible.length && !loading && !failedIndexes.length && <div className="ex-empty">
        {address.q.trim() ? <>{en ? `No works match “${address.q.trim()}”. ` : `没有与“${address.q.trim()}”匹配的作品。`}
          <button type="button" onClick={() => search('')}>{en ? 'Clear search' : '清除搜索'}</button></>
          : <>{en ? 'No works found. ' : '没有匹配的作品。'}<button type="button" onClick={() => navigate({ type: 'all', item: '', q: '' })}>{en ? 'Clear filters' : '清除筛选'}</button></>}
      </div>}
      {visible.length > 0 &&
        <div className="ex-split">
          <div className="ex-list" role="group" aria-label={en ? 'Work index' : '作品目录'} ref={list}>
            {visible.map(item => {
              const active = current.id === item.id, Icon = iconFor(item), cover = artwork[item.kind];
              const category = labelForWork(item, en);
              const rowLabel = activeType === 'video' ? (item.featured ? (en ? 'Pinned' : '置顶') : '') : category;
              const extra = item.kind === 'video' ? videoMetadata(item) :
                item.kind === 'podcast' ? item.meta?.split(' · ').slice(1,3).join(' · ') :
                item.kind === 'reviews' ? item.meta?.match(/\d{4}-\d\d-\d\d/)?.[0] :
                item.kind === 'articles' ? (categoryOf(item) === 'writing' ? writingLabel(item, en)
                  : item.format === 'answer' ? (en ? 'Zhihu answer' : '知乎回答') : item.meta?.split(' · ')[0]) : item.topic;
              return <div className="ex-row" key={item.kind + ':' + item.id}>
                <button type="button" className="ex-select" data-key={item.id} aria-pressed={active}
                  aria-expanded={small ? active && !folded : undefined} aria-controls={active && (!small || !folded) ? 'ex-reader' : undefined} onClick={() => choose(item)}>
                  <span className={'ex-row-icon tone-' + item.kind}>{cover ? <img alt="" src={import.meta.env.BASE_URL + cover} /> : <Icon aria-hidden="true" />}</span>
                  <span className="ex-row-text"><small>{[rowLabel, extra !== rowLabel && extra].filter(Boolean).join(' · ')}</small>
                    <strong>{item.title}</strong>{item.summary && <span>{item.summary}</span>}</span>
                </button>
                {small && active && !folded && reader}
              </div>;
            })}
          </div>
          {!small && <div id="ex-pane" className="ex-pane">{reader}</div>}
        </div>}
    </div>
  </section>;
}
