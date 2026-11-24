"""Publish a literary manuscript to the site's writing archive.

Usage: python3 scripts/publish-writing.py writing/<work-id>

Reads writing/<work-id>/README.md: front matter (date, optional genre, summary,
book, douban, zhihu), one ``# title`` and the body. Writes the site article, its
index entry and writing/<work-id>/平台正文.html, the copy pasted into Douban and Zhihu.
Rerun after every manuscript change, and after adding the douban/zhihu links.
"""

import hashlib
import html
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'public/content'
INDEX = CONTENT / 'acoustics-index.json'
SITE = 'https://fanyu-meng.github.io'
AUTHOR = '子鱼'
TOPIC = '文学'
LINK = r'\[([^\]]+)\]\((https://[^\s)"]+)\)'


def inline(text):
    text = html.escape(text, quote=False)
    text = re.sub(LINK, r'<a href="\2">\1</a>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    return re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)


def render(lines, image):
    """Blank lines separate paragraphs; a line break inside one is kept, as verse needs."""
    blocks, paragraph, quote = [], [], []

    def flush():
        if paragraph:
            blocks.append('<p>' + '<br>'.join(map(inline, paragraph)) + '</p>')
        if quote:
            blocks.append('<blockquote><p>' + '<br>'.join(map(inline, quote)) + '</p></blockquote>')
        paragraph.clear()
        quote.clear()

    for line in map(str.strip, lines):
        heading = re.fullmatch(r'(#{2,4})\s+(.+)', line)
        picture = re.fullmatch(r'!\[(.*)\]\((.+)\)', line)
        if not line:
            flush()
        elif heading:
            flush()
            blocks.append(f'<h{len(heading[1])}>{inline(heading[2])}</h{len(heading[1])}>')
        elif re.fullmatch(r'([-*])(\s*\1){2,}', line):
            flush()
            blocks.append('<hr>')
        elif picture:
            flush()
            alt = html.escape(picture[1], quote=True)
            caption = f'<figcaption>{alt}</figcaption>' if alt else ''
            blocks.append(f'<figure><img src="{html.escape(image(picture[2]), quote=True)}" alt="{alt}">{caption}</figure>')
        elif line.startswith('>'):
            if paragraph:
                flush()
            quote.append(line.lstrip('>').strip())
        else:
            if quote:
                flush()
            paragraph.append(line)
    flush()
    return '\n'.join(blocks)


def wording(text):
    # Layout may change between manuscript and page; the characters may not.
    return re.sub(r'[\s#>*-]', '', text)


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1]).resolve()
    work = folder.name
    if folder.parent != ROOT / 'writing' or not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', work):
        raise SystemExit('Expected writing/<work-id> with a lowercase work id such as writing/first-snow')
    source = (folder / 'README.md').read_text(encoding='utf-8')
    matter = re.match(r'---\n(.*?)\n---\n', source, re.S)
    if not matter:
        raise SystemExit('README.md must start with front matter between --- lines')
    fields = {}
    for line in filter(None, map(str.strip, matter[1].splitlines())):
        pair = re.fullmatch(r'(date|genre|summary|book|douban|zhihu):\s*(.*)', line)
        if not pair:
            raise SystemExit(f'Front matter line not understood: {line}')
        fields[pair[1]] = pair[2]
    date = fields.get('date', '')
    if not re.fullmatch(r'\d{4}-\d\d-\d\d', date):
        raise SystemExit('Front matter needs date: YYYY-MM-DD')
    lines = source[matter.end():].strip().splitlines()
    if not lines or not lines[0].startswith('# '):
        raise SystemExit('The manuscript must open with "# title"')
    title, lines = lines[0][2:].strip(), lines[1:]

    def media(prefix):
        def path(name):
            if not (CONTENT / 'writing-media' / work / name).is_file():
                raise SystemExit(f'Missing picture public/content/writing-media/{work}/{name}')
            return f'{prefix}/writing-media/{work}/{name}'
        return path

    body = render(lines, media('..'))
    text = html.unescape(re.sub(r'<figure>.*?</figure>|<[^>]+>', '', body.replace('<br>', '\n')))
    kept = re.sub(LINK, r'\1', '\n'.join(line for line in lines if not line.strip().startswith('![')))
    if not text.strip():
        raise SystemExit('The manuscript has no body')
    if wording(kept) != wording(text):
        raise SystemExit('The rendered text differs from the manuscript; nothing was written')

    plain = ' '.join(text.split())
    entry = {
        'id': work, 'title': title,
        'meta': ' · '.join(filter(None, [AUTHOR, date, fields.get('genre')])),
        'summary': fields.get('summary') or plain[:105].rstrip() + ('…' if len(plain) > 105 else ''),
        'topic': TOPIC,
        # The version makes a revised text replace the cached one as soon as it deploys.
        'contentPath': f'/content/articles/{work}.json?v=' + hashlib.sha256(body.encode('utf-8')).hexdigest()[:12],
        'publishedAt': date, 'section': 'writing', 'format': 'article',
    }
    if fields.get('book'):
        entry['bookTitle'] = fields['book']
    links = [{'label': label, 'url': fields[key]} for key, label in (('douban', '豆瓣'), ('zhihu', '知乎')) if fields.get(key)]
    if links:
        entry['links'] = links

    index = json.loads(INDEX.read_text(encoding='utf-8'))
    position = next((i for i, item in enumerate(index) if item['id'] == work), None)
    if position is None:
        # The index runs newest first.
        position = next((i for i, item in enumerate(index) if item.get('publishedAt', '') <= date), len(index))
        index.insert(position, entry)
    elif index[position].get('topic') != TOPIC:
        raise SystemExit(f'{work} is already the id of another work on the site')
    else:
        index[position] = entry

    (CONTENT / 'articles' / f'{work}.json').write_text(
        json.dumps({'html': body}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    INDEX.write_text(json.dumps(index, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (folder / '平台正文.html').write_text(
        f'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>{html.escape(title)}</title>'
        '<style>body{font:17px/1.85 -apple-system,BlinkMacSystemFont,"Hiragino Sans GB",sans-serif;max-width:700px;'
        'margin:2em auto;padding:0 1em}img{max-width:100%;height:auto}figcaption{font-size:14px;color:#5e6764}</style>'
        f'<body>\n{render(lines, media(SITE + "/content"))}\n', encoding='utf-8')
    print(f'{title}: {len("".join(text.split()))} characters')
    print(f'{SITE}/#/works?type=writing&item={work}')


if __name__ == '__main__':
    main()
