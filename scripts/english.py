#!/usr/bin/env python3
"""English versions of the site's content. See 英文版.md.

  python3 scripts/english.py lint <draft.html>...      check English drafts of articles before import
  python3 scripts/english.py import <draft.html>...    write them to public/content/en/
  python3 scripts/english.py import-works <file.json>  merge English entries for works.json items
  python3 scripts/english.py export <id> <folder>      write an article's current English version as a draft
  python3 scripts/english.py check                     list missing, stale and broken English entries
  python3 scripts/english.py show <id>                 print an article's Chinese fields and body

The English files only add wording by ID. Sections, links and media stay in the Chinese files.
"""
import argparse
import hashlib
import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
CONTENT = PUBLIC / 'content'
INDEX = CONTENT / 'acoustics-index.json'
WORKS = CONTENT / 'works.json'
EN = CONTENT / 'en'
EN_INDEX = EN / 'acoustics-index.json'
EN_WORKS = EN / 'works.json'
EN_ARTICLES = EN / 'articles'

# Han characters, CJK punctuation and full-width forms.
CJK = re.compile(r'[　-〿㐀-䶿一-鿿豈-﫿＀-￯]')
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
MODES = {'translation', 'summary'}
FIELDS = ('title', 'summary', 'meta', 'bookTitle')
WORK_FIELDS = ('title', 'summary', 'meta', 'body', 'chapters', 'topic')


def fingerprint(value):
    return hashlib.sha1(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:12]


def read_json(path, default=None):
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else default


def site_path(content_path):
    """'/content/articles/x.json?v=1' -> ('/content/articles/x.json', Path)."""
    url = content_path.split('?')[0]
    return url, PUBLIC / url.lstrip('/')


def chinese_html(entry):
    if not entry.get('contentPath'):
        return None, None
    url, path = site_path(entry['contentPath'])
    return url, json.loads(path.read_text(encoding='utf-8')).get('html', '')


def article_source(entry):
    _, html = chinese_html(entry)
    return fingerprint([entry.get(k) for k in FIELDS] + [html])


def work_source(entry):
    return fingerprint([entry.get('title'), entry.get('summary'), entry.get('meta'), entry.get('body'),
                        [c.get('title') for c in entry.get('chapters') or []], entry.get('topic')])


def resolve(url, base):
    url = url.strip().replace('&amp;', '&')
    if re.match(r'^(?:[a-z]+:|//|#)', url, re.I):
        return url
    resolved = urljoin(base, url)
    # Links to the Chinese works index count the same as their English counterpart.
    return re.sub(r'^/en/(?=#)', '/', resolved)


class Scan(HTMLParser):
    def __init__(self, base):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.media = Counter()
        self.links = set()
        self.math = 0
        self.text = []
        self.stack = []
        self.problems = []

    def handle_starttag(self, tag, attrs):
        self.start(tag, attrs)
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.start(tag, attrs)

    def start(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('img', 'video', 'audio', 'source'):
            for name in ('src', 'poster'):
                if attrs.get(name):
                    self.media[resolve(attrs[name], self.base)] += 1
        if tag == 'a' and attrs.get('href'):
            self.links.add(resolve(attrs['href'], self.base))
        if tag == 'math':
            self.math += 1
        for name in ('alt', 'aria-label', 'title'):
            if attrs.get(name):
                self.text.append(attrs[name])

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if tag not in self.stack:
            self.problems.append(f'stray </{tag}>')
            return
        while self.stack:
            open_tag = self.stack.pop()
            if open_tag == tag:
                break
            self.problems.append(f'<{open_tag}> is not closed before </{tag}>')

    def handle_data(self, data):
        self.text.append(data)


def scan(html, base):
    parser = Scan(base)
    parser.feed(html)
    parser.close()
    parser.problems += [f'<{tag}> is not closed' for tag in parser.stack]
    return parser


def cjk_snippets(text, limit=5):
    found = []
    for match in re.finditer(CJK.pattern + '+', text):
        found.append(text[max(0, match.start() - 15):match.end() + 15].replace('\n', ' '))
        if len(found) >= limit:
            break
    return found


def parse_draft(path):
    text = path.read_text(encoding='utf-8').lstrip('﻿')
    match = re.match(r'\s*<!--(.*?)-->', text, re.S)
    if not match:
        raise ValueError('the draft must start with a <!-- … --> header')
    fields = {}
    for line in match.group(1).strip().splitlines():
        if not line.strip():
            continue
        key, sep, value = line.partition(':')
        if not sep:
            raise ValueError(f'header line without “key: value”: {line.strip()}')
        fields[key.strip()] = value.strip()
    return fields, text[match.end():].strip()


def load_index():
    return {entry['id']: entry for entry in read_json(INDEX)}


def lint(path, index):
    """Return (errors, warnings, parsed draft)."""
    errors, warnings = [], []
    try:
        fields, html = parse_draft(path)
    except (OSError, ValueError) as e:
        return [str(e)], [], None
    work_id = fields.get('id') or path.stem
    entry = index.get(work_id)
    if not entry:
        return [f'unknown work ID {work_id}'], [], None
    unknown = set(fields) - set(FIELDS) - {'id', 'mode'}
    if unknown:
        errors.append('unknown header fields: ' + ', '.join(sorted(unknown)))
    mode = fields.get('mode')
    if mode not in MODES:
        errors.append('mode must be translation or summary')
    if mode == 'summary' and entry.get('originality') != 'non-original':
        errors.append('summary mode is only for sourced articles; write a full translation')
    for key in FIELDS:
        if entry.get(key) and not fields.get(key):
            errors.append(f'missing {key}')
        value = fields.get(key, '')
        if CJK.search(value):
            (warnings if key == 'summary' else errors).append(f'Chinese characters in {key}: {value}')
    base, source = chinese_html(entry)
    if source is None:
        if html:
            warnings.append('the Chinese entry has no body, so the English body is ignored')
        return errors, warnings, (work_id, fields, None)
    if not html:
        errors.append('the body is empty')
        return errors, warnings, (work_id, fields, html)
    zh, en = scan(source, base), scan(html, base)
    errors += en.problems[:10]
    if mode == 'translation':
        if zh.media != en.media:
            missing = zh.media - en.media
            extra = en.media - zh.media
            if missing:
                errors.append('missing media: ' + ', '.join(sorted(missing)))
            if extra:
                errors.append('media not in the Chinese version: ' + ', '.join(sorted(extra)))
        if zh.math != en.math:
            errors.append(f'{zh.math} formulas in Chinese, {en.math} in English')
        lost = sorted(zh.links - en.links)
        if lost:
            warnings.append('links not carried over: ' + ', '.join(lost[:8]))
        zh_chars = len(CJK.findall(''.join(zh.text)))
        en_words = len(re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*", ''.join(en.text)))
        if zh_chars > 200 and en_words < zh_chars * 0.3:
            warnings.append(f'looks shortened: {en_words} English words for {zh_chars} Chinese characters')
    else:
        extra = en.media - zh.media
        if extra:
            errors.append('media not in the Chinese version: ' + ', '.join(sorted(extra)))
    left = CJK.findall(''.join(en.text))
    if left:
        warnings.append(f'{len(left)} Chinese characters left in the body: ' + ' | '.join(cjk_snippets(''.join(en.text))))
    return errors, warnings, (work_id, fields, html)


def site_html(html, base):
    """Resolve relative URLs against the Chinese file, and point site links at the English pages."""
    def fix(match):
        name, quote, value = match.group(1), match.group(2), match.group(3)
        url = value.strip()
        if not re.match(r'^(?:[a-z]+:|//|#)', url, re.I):
            url = urljoin(base, url)
        url = re.sub(r'^(?:https://fanyu-meng\.github\.io)?/(?=#/)', '/en/', url)
        return f'{name}={quote}{url}{quote}'
    return re.sub(r'\b(src|href|poster)=(["\'])(.*?)\2', fix, html)


def write_overlay(path, overlay, order):
    rank = {key: i for i, key in enumerate(order)}
    keys = sorted(overlay, key=lambda key: (rank.get(key, len(rank)), key))
    lines = [json.dumps(key, ensure_ascii=False) + ':' + json.dumps(overlay[key], ensure_ascii=False, separators=(',', ':'))
             for key in keys]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('{\n' + ',\n'.join(lines) + '\n}\n', encoding='utf-8')


def report(path, errors, warnings):
    for message in errors:
        print(f'{path}: error: {message}')
    for message in warnings:
        print(f'{path}: warning: {message}')


def command_lint(paths):
    index = load_index()
    failed = 0
    for path in map(Path, paths):
        errors, warnings, _ = lint(path, index)
        report(path, errors, warnings)
        failed += bool(errors)
        if not errors and not warnings:
            print(f'{path}: ok')
    return 1 if failed else 0


def command_import(paths, force=False):
    index = load_index()
    overlay = read_json(EN_INDEX, {})
    failed = 0
    for path in map(Path, paths):
        errors, warnings, draft = lint(path, index)
        report(path, errors, warnings)
        if errors and not force or not draft:
            failed += 1
            continue
        work_id, fields, html = draft
        entry = index[work_id]
        record = {key: fields[key] for key in FIELDS if fields.get(key)}
        record['mode'] = fields['mode']
        if html is not None:
            base, _ = chinese_html(entry)
            body = json.dumps({'html': site_html(html, base)}, ensure_ascii=False, separators=(',', ':'))
            EN_ARTICLES.mkdir(parents=True, exist_ok=True)
            (EN_ARTICLES / f'{work_id}.json').write_text(body, encoding='utf-8')
            record['contentPath'] = f'/content/en/articles/{work_id}.json?v={hashlib.sha1(body.encode()).hexdigest()[:12]}'
        record['source'] = article_source(entry)
        overlay[work_id] = record
    write_overlay(EN_INDEX, overlay, list(index))
    print(f'{len(paths) - failed} imported, {failed} skipped')
    return 1 if failed else 0


def all_works():
    works = read_json(WORKS)
    return {entry['id']: entry for kind, entries in works.items() if kind != 'videoChannels' for entry in entries}


def lint_work(work_id, record, entry):
    errors = []
    unknown = set(record) - set(WORK_FIELDS) - {'source'}
    if unknown:
        errors.append('unknown fields: ' + ', '.join(sorted(unknown)))
    for key in ('title', 'summary', 'meta', 'body', 'chapters'):
        if entry.get(key) and not record.get(key):
            errors.append(f'missing {key}')
    if entry.get('body') and record.get('body') is not None and not (
            isinstance(record['body'], list) and all(isinstance(p, str) and p.strip() for p in record['body'])):
        errors.append('body must be a list of paragraphs')
    chapters = entry.get('chapters') or []
    if record.get('chapters') is not None and (
            not isinstance(record['chapters'], list) or len(record['chapters']) != len(chapters)
            or not all(isinstance(c, str) and c.strip() for c in record['chapters'])):
        errors.append(f'chapters must list {len(chapters)} titles in order')
    text = json.dumps({k: v for k, v in record.items() if k != 'source'}, ensure_ascii=False)
    if CJK.search(text):
        errors.append('Chinese characters left: ' + ' | '.join(cjk_snippets(text)))
    return errors


def command_import_works(path):
    works = all_works()
    drafts = read_json(Path(path))
    overlay = read_json(EN_WORKS, {})
    failed = 0
    for work_id, record in drafts.items():
        entry = works.get(work_id)
        errors = [f'unknown work ID {work_id}'] if not entry else lint_work(work_id, record, entry)
        report(work_id, errors, [])
        if errors:
            failed += 1
            continue
        overlay[work_id] = {**{k: record[k] for k in WORK_FIELDS if record.get(k)}, 'source': work_source(entry)}
    write_overlay(EN_WORKS, overlay, list(works))
    print(f'{len(drafts) - failed} imported, {failed} skipped')
    return 1 if failed else 0


def command_export(work_id, folder):
    entry = load_index().get(work_id)
    record = read_json(EN_INDEX, {}).get(work_id)
    if not entry or not record:
        print(f'no English version of {work_id}')
        return 1
    header = [f'{key}: {record[key]}' for key in FIELDS if record.get(key)] + [f'mode: {record["mode"]}']
    html = ''
    if record.get('contentPath'):
        # Stored paths are site-absolute, so the draft imports again unchanged.
        _, path = site_path(record['contentPath'])
        html = json.loads(path.read_text(encoding='utf-8'))['html']
    target = Path(folder) / f'{work_id}.html'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text('<!--\n' + '\n'.join(header) + '\n-->\n' + html + '\n', encoding='utf-8')
    print(target)
    return 0


def command_show(work_id):
    entry = load_index().get(work_id)
    if not entry:
        print(f'unknown work ID {work_id}')
        return 1
    for key in FIELDS + ('topic', 'format', 'originality', 'theme', 'sameWorkAs'):
        if entry.get(key):
            print(f'{key}: {entry[key]}')
    for link in entry.get('links') or []:
        print(f'link: {link["label"]} {link["url"]}')
    _, html = chinese_html(entry)
    print('-----')
    print(html if html is not None else '(no body)')
    return 0


def command_check():
    index = load_index()
    overlay = read_json(EN_INDEX, {})
    works = all_works()
    work_overlay = read_json(EN_WORKS, {})
    missing, stale, broken = [], [], []
    for work_id, entry in index.items():
        record = overlay.get(work_id)
        if not record:
            missing.append(work_id)
            continue
        if record.get('source') != article_source(entry):
            stale.append(work_id)
        base, source = chinese_html(entry)
        if source is None:
            continue
        if not record.get('contentPath'):
            broken.append(f'{work_id}: no English body')
            continue
        url, path = site_path(record['contentPath'])
        if not path.exists():
            broken.append(f'{work_id}: {url} does not exist')
            continue
        html = json.loads(path.read_text(encoding='utf-8')).get('html', '')
        en, zh = scan(html, url), scan(source, base)
        if record.get('mode') == 'translation' and (en.media != zh.media or en.math != zh.math):
            broken.append(f'{work_id}: media or formulas differ from the Chinese version')
        if en.problems:
            broken.append(f'{work_id}: ' + '; '.join(en.problems[:3]))
    for work_id in sorted(set(overlay) - set(index)):
        broken.append(f'{work_id}: English entry for a work that no longer exists')
    for work_id, entry in works.items():
        record = work_overlay.get(work_id)
        if not record:
            missing.append(work_id)
        elif record.get('source') != work_source(entry):
            stale.append(work_id)
        else:
            broken += [f'{work_id}: {e}' for e in lint_work(work_id, record, entry)]
    for label, rows in (('missing', missing), ('stale', stale), ('error', broken)):
        for row in rows:
            print(f'{label}: {row}')
    total = len(index) + len(works)
    print(f'{total - len(missing)} of {total} works have an English version; {len(stale)} stale, {len(broken)} errors')
    return 1 if missing or stale or broken else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('lint').add_argument('drafts', nargs='+')
    imp = sub.add_parser('import')
    imp.add_argument('drafts', nargs='+')
    imp.add_argument('--force', action='store_true', help='import drafts that have errors')
    sub.add_parser('import-works').add_argument('file')
    exp = sub.add_parser('export')
    exp.add_argument('id')
    exp.add_argument('folder')
    sub.add_parser('check')
    sub.add_parser('show').add_argument('id')
    args = parser.parse_args()
    if args.command == 'show':
        return command_show(args.id)
    if args.command == 'lint':
        return command_lint(args.drafts)
    if args.command == 'import':
        return command_import(args.drafts, args.force)
    if args.command == 'import-works':
        return command_import_works(args.file)
    if args.command == 'export':
        return command_export(args.id, args.folder)
    return command_check()


if __name__ == '__main__':
    sys.exit(main())
