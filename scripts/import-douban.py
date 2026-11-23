"""Import HTML-only saved Douban notes and reviews into the site's article index.

Save the account's individual pages as ``douban-note-ID.html`` or
``douban-review-ID.html`` in ``.douban-import/`` before running this script.
The importer reads only the author's own article body, not comments or page UI.
Article images are mirrored to public/content/douban-media and reused on reimport.
"""

import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / '.douban-import'
CONTENT = ROOT / 'public/content'
INDEX = CONTENT / 'acoustics-index.json'
AUTHOR = '弗-费尔南德斯'
TAGS = {'p', 'br', 'strong', 'b', 'em', 'i', 'blockquote', 'ul', 'ol', 'li',
        'h2', 'h3', 'h4', 'a', 'img', 'figure', 'figcaption', 'hr'}
VOID = {'br', 'img', 'hr'}


def article_image(src, kind, article_url):
    url = urlsplit(src)
    name = re.fullmatch(r'/view/(?:note|thing_review)/[^/]+/public/(p\d+)\.\w+', url.path)
    if not name or not re.fullmatch(r'img\d*\.doubanio\.com', url.hostname or ''):
        return src

    directory = CONTENT / 'douban-media'
    stem = f'{kind}-{name[1]}'
    for suffix in ('webp', 'jpg', 'png', 'gif'):
        cached = directory / f'{stem}.{suffix}'
        if cached.is_file():
            return f'../douban-media/{cached.name}'

    request = Request(src, headers={'Referer': article_url, 'Accept': 'image/webp,image/*'})
    with urlopen(request, timeout=30) as response:
        data = response.read()
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        suffix = 'webp'
    elif data.startswith(b'\xff\xd8\xff'):
        suffix = 'jpg'
    elif data.startswith(b'\x89PNG\r\n\x1a\n'):
        suffix = 'png'
    elif data[:6] in (b'GIF87a', b'GIF89a'):
        suffix = 'gif'
    else:
        raise ValueError(f'Expected an image at {src}')
    directory.mkdir(exist_ok=True)
    target = directory / f'{stem}.{suffix}'
    with TemporaryDirectory(dir=directory) as scratch:
        staged = Path(scratch) / target.name
        staged.write_bytes(data)
        staged.replace(target)
    return f'../douban-media/{target.name}'


class ArticleBody(HTMLParser):
    def __init__(self, kind, article_url):
        super().__init__(convert_charrefs=True)
        self.kind = kind
        self.article_url = article_url
        self.depth = 0
        self.body_depth = None
        self.in_report = False
        self.report_depth = None
        self.parts = []
        self.plain = []
        self.open_tags = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'div' and attrs.get('id') == 'link-report':
            self.in_report = True
            self.report_depth = self.depth + 1
        target = (self.kind == 'note' and tag == 'div' and self.in_report
                  and 'note' in attrs.get('class', '').split()
                  or self.kind == 'review' and tag == 'div'
                  and 'review-content' in attrs.get('class', '').split())
        if target and self.body_depth is None:
            self.body_depth = self.depth + 1
        elif self.body_depth is not None and tag in TAGS:
            safe = ''
            if tag == 'img' and attrs.get('src', '').startswith('https://'):
                src = article_image(attrs['src'], self.kind, self.article_url)
                safe = f' src="{html.escape(src, quote=True)}" alt="{html.escape(attrs.get("alt", ""), quote=True)}"'
            elif tag == 'a' and attrs.get('href', '').startswith('https://'):
                safe = f' href="{html.escape(attrs["href"], quote=True)}"'
            self.parts.append(f'<{tag}{safe}>')
            if tag not in VOID:
                self.open_tags.append((tag, self.depth + 1))
        if tag not in VOID and tag not in {'meta', 'link', 'input', 'source', 'wbr', 'area', 'base', 'embed'}:
            self.depth += 1

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.body_depth is not None:
            while self.open_tags and self.open_tags[-1][1] == self.depth:
                self.parts.append(f'</{self.open_tags.pop()[0]}>')
            if self.depth == self.body_depth:
                self.body_depth = None
        if self.depth == self.report_depth:
            self.in_report = False
        self.depth = max(0, self.depth - 1)

    def handle_data(self, data):
        if self.body_depth is not None:
            self.parts.append(html.escape(data))
            self.plain.append(data)


def extract(path):
    kind, article_id = re.fullmatch(r'douban-(note|review)-(\d+)\.html', path.name).groups()
    source = path.read_text(encoding='utf-8')
    container = re.search(r'<div\s+id="(?:note-|review-)' + article_id + r'"[\s\S]*?data-author="([^"]+)"', source)
    # Review pages put data-author on the body rather than the outer container.
    if kind == 'review':
        container = re.search(r'class="review-content[^\"]*"[^>]*data-author="([^"]+)"', source)
    if not container or html.unescape(container.group(1)) != AUTHOR:
        raise ValueError(f'{path.name}: article author is not {AUTHOR}')
    title_match = re.search(r'<h1[^>]*>(.*?)</h1>', source, re.S)
    if not title_match:
        raise ValueError(f'{path.name}: no title')
    title = html.unescape(re.sub(r'<[^>]+>', '', title_match.group(1))).strip()
    date_area = source[title_match.end():]
    date = re.search(r'20\d\d-\d\d-\d\d(?:\s+\d\d:\d\d:\d\d)?', date_area)
    if not date:
        raise ValueError(f'{path.name}: no publication date')
    url = f'https://www.douban.com/note/{article_id}/' if kind == 'note' else f'https://book.douban.com/review/{article_id}/'
    parser = ArticleBody(kind, url)
    parser.feed(source)
    body = ''.join(parser.parts).strip()
    plain = re.sub(r'\s+', ' ', ''.join(parser.plain)).strip()
    if len(plain) < 30:
        raise ValueError(f'{path.name}: body missing or too short')
    content_path = f'/content/articles/douban-{kind}-{article_id}.json'
    if '<img ' in body:
        content_path += '?v=' + hashlib.sha256(body.encode('utf-8')).hexdigest()[:12]
    entry = {
        'id': f'douban-{kind}-{article_id}', 'title': title,
        'meta': f'豆瓣{ "日记" if kind == "note" else "书评" } · {date.group()[:10]}',
        'summary': plain[:105] + ('…' if len(plain) > 105 else ''),
        'topic': '豆瓣日记' if kind == 'note' else '豆瓣书评',
        'url': url, 'links': [{'label': '豆瓣原文', 'url': url}],
        'contentPath': content_path,
        'publishedAt': date.group()[:10], 'section': 'writing', 'format': 'article',
    }
    return entry, {'html': body}, date.group()


def main():
    paths = sorted(SOURCE.glob('douban-*.html'))
    if not paths:
        raise SystemExit('No saved Douban pages found in .douban-import/')
    extracted = [extract(path) for path in paths]
    index = json.loads(INDEX.read_text(encoding='utf-8'))
    ids = {entry['id'] for entry, _, _ in extracted}
    # Reimports replace only the matching Douban entries; all other work stays put.
    index = [entry for entry in index if entry['id'] not in ids]
    index.extend(entry for entry, _, _ in sorted(extracted, key=lambda pair: pair[2], reverse=True))
    for entry, body, _ in extracted:
        target = CONTENT / urlsplit(entry['contentPath']).path.removeprefix('/content/')
        target.write_text(json.dumps(body, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    INDEX.write_text(json.dumps(index, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'Imported {len(extracted)} articles ({sum(e[0]["id"].startswith("douban-note") for e in extracted)} notes, '
          f'{sum(e[0]["id"].startswith("douban-review") for e in extracted)} reviews).')


if __name__ == '__main__':
    main()
