import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { mergePublishedVideos, type PublishedVideo, type VideoEntry } from '../src/lib/video-catalog';

type Entry = { id: string };
type WrittenEntry = Entry & { format?: 'article' | 'answer'; sameWorkAs?: string };
type Works = { video?: VideoEntry[]; podcast?: Entry[]; reviews?: Entry[]; github?: Entry[] };

function countEntries(entries: Entry[] = []) {
  return new Set(entries.map(entry => entry.id)).size;
}

export function creationCounts(articles: WrittenEntry[], works: Works, published: PublishedVideo[]) {
  const writing = new Map<string, 'article' | 'answer'>();
  for (const entry of articles) {
    const id = entry.sameWorkAs || entry.id;
    // An essay also published as a Zhihu answer belongs in the article count.
    if (!writing.has(id) || entry.format !== 'answer') {
      writing.set(id, entry.format ?? 'article');
    }
  }
  const answers = [...writing.values()].filter(format => format === 'answer').length;
  const catalog = mergePublishedVideos(works, published);
  const counts = {
    articles: writing.size - answers,
    answers,
    videos: countEntries(catalog.video),
    episodes: countEntries(works.podcast),
    reviews: countEntries(works.reviews),
    projects: countEntries(works.github),
  };
  return { ...counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
}

export type CreationCounts = ReturnType<typeof creationCounts>;

export function creationStatsPlugin(): Plugin {
  const fileName = 'content/creation-stats.json';
  let directory: string;
  function snapshot() {
    const read = (file: string) => JSON.parse(readFileSync(resolve(directory, file), 'utf8'));
    return JSON.stringify(creationCounts(read('acoustics-index.json'), read('works.json'), read('published-videos.json')));
  }
  return {
    name: 'creation-stats',
    configResolved(config) {
      directory = resolve(config.publicDir, 'content');
    },
    configureServer(server) {
      server.middlewares.use('/' + fileName, (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(snapshot());
      });
    },
    transformIndexHtml() {
      return [{ tag: 'script', attrs: { id: 'creation-stats', type: 'application/json' }, children: snapshot(), injectTo: 'head' }];
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName, source: snapshot() });
    },
  };
}
