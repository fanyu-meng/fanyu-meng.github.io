import type { Plugin } from 'vite';

// GitHub Pages serves /en/ from en/index.html: the same app, with English metadata for search engines and link previews.
const title = 'Fanyu Meng | Audio algorithm engineer';
const description = 'Fanyu Meng is an audio algorithm engineer and acoustician in Munich. Writing on acoustics, stand-up comedy, the Pobicast podcast, guitar and AI projects.';

function replaceOnce(html: string, pattern: RegExp, replacement: string) {
  if (!pattern.test(html)) throw new Error(`english-page: ${pattern} not found in index.html`);
  return html.replace(pattern, replacement);
}

export function englishPagePlugin(): Plugin {
  return {
    name: 'english-page',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const page = bundle['index.html'];
      if (!page || page.type !== 'asset') throw new Error('english-page: index.html was not built');
      let html = String(page.source);
      html = replaceOnce(html, /<html lang="[^"]*">/, '<html lang="en">');
      html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
      html = replaceOnce(html, /<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`);
      html = replaceOnce(html, /<meta name="author" content="[^"]*"/, '<meta name="author" content="Fanyu Meng"');
      html = replaceOnce(html, /<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`);
      html = replaceOnce(html, /<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`);
      html = replaceOnce(html, /<link rel="canonical" href="[^"]*"/, '<link rel="canonical" href="https://fanyu-meng.github.io/en/"');
      this.emitFile({ type: 'asset', fileName: 'en/index.html', source: html });
    },
  };
}
