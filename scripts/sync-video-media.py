#!/usr/bin/env python3
"""Rebuild public/content/video-media.json from the manifests of the guitar-media-N repositories.

    python3 scripts/sync-video-media.py [仓库所在文件夹，默认是本仓库旁边的 ..]

`repos` keeps each repository's address. It is the only place those addresses live:
moving the videos to another host means editing that table, nothing else.
"""
import json, sys
from pathlib import Path

site = Path(__file__).resolve().parent.parent
root = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else site.parent
target = site / 'public/content/video-media.json'
current = json.loads(target.read_text(encoding='utf-8')) if target.exists() else {'repos': {}, 'videos': {}}
works = {v['id'] for v in json.loads((site / 'public/content/works.json').read_text(encoding='utf-8'))['video']}

repos, videos = dict(current.get('repos', {})), {}
for manifest in sorted(root.glob('guitar-media-*/manifest.json'), key=lambda p: int(p.parent.name.rsplit('-', 1)[1])):
    name = manifest.parent.name
    repos.setdefault(name, f'/{name}/')
    for vid, row in json.loads(manifest.read_text(encoding='utf-8'))['videos'].items():
        if vid in videos:
            sys.exit(f'{vid} 同时出现在 {videos[vid]["repo"]} 和 {name}')
        videos[vid] = {'repo': name, 'path': row['path'], 'type': row['type'],
                       'width': row.get('width'), 'height': row.get('height')}

unknown = sorted(set(videos) - works)
missing = sorted(works - set(videos))
target.write_text(json.dumps({'repos': repos, 'videos': dict(sorted(videos.items()))}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(videos)} 条视频已登记到 {target.relative_to(site)}')
if missing:
    print('还没有存档：', ' '.join(missing))
if unknown:
    print('存档里有、works.json 里没有：', ' '.join(unknown))
