"""Show a Xiaohongshu video made from a site article on that article's page.

Usage: python3 scripts/publish-xhs-video.py <work-id> <video> --url <note link>
           [--cover <image>] [--large-files <path>] [--replace]

The video is re-encoded for the web (H.264 + AAC, long side at most 1280 px)
and stored in the largeFiles repository as acoustics-media/<work-id>/xiaohongshu.mp4
with a poster xiaohongshu.webp, taken from --cover or from the video itself.
The work's entry in public/content/acoustics-index.json gets videoFile and
videoPoster, so the video plays under the title, and a 小红书视频笔记 link.
Push largeFiles main before deploying the site; the deployment publishes it at /largeFiles/.
"""

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / 'public/content/acoustics-index.json'
SITE = 'https://fanyu-meng.github.io'
WEB_ROOT = '/largeFiles/'
FOLDER = 'acoustics-media'
NAME = 'xiaohongshu'
LABEL = '小红书视频笔记'
HOSTS = {'www.xiaohongshu.com', 'xiaohongshu.com', 'xhslink.com'}
LIMIT = 95 * 1024 * 1024          # GitHub refuses files over 100 MB
FIT = "scale='if(gte(iw,ih),min(1280,iw),-2)':'if(gte(iw,ih),-2,min(1280,ih))',scale=trunc(iw/2)*2:trunc(ih/2)*2"


def fail(message):
    sys.exit('publish-xhs-video: ' + message)


def large_files(path):
    candidates = [Path(path)] if path else [ROOT.parent / 'largeFiles', ROOT.parent / 'largefiles']
    for candidate in candidates:
        readme = candidate / 'README.md'
        if readme.is_file() and readme.read_text(encoding='utf-8').startswith('# largeFiles'):
            return candidate.resolve()
    fail('找不到 largeFiles 仓库。把 https://github.com/fanyu-meng/largeFiles 克隆到本仓库旁边，或用 --large-files 指定。')


def probe(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration',
                             '-of', 'json', str(path)], capture_output=True, text=True)
    info = json.loads(result.stdout or '{}')
    streams = info.get('streams', [])
    video = next((s for s in streams if s.get('codec_type') == 'video'), None)
    if not video:
        fail(f'{path} 里没有视频画面。')
    return {'width': video['width'], 'height': video['height'], 'duration': float(info['format']['duration']),
            'audio': any(s.get('codec_type') == 'audio' for s in streams)}


def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)


def encode(source, target):
    """Re-encode, stepping the quality down until the file fits under GitHub's size limit."""
    temporary = target.with_suffix('.tmp.mp4')
    for crf in (23, 26, 29):
        ffmpeg('-i', source, '-map', '0:v:0', '-map', '0:a:0?', '-vf', FIT, '-c:v', 'libx264', '-preset', 'slow',
               '-crf', crf, '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ac', '2',
               '-map_metadata', '-1', '-movflags', '+faststart', temporary)
        if temporary.stat().st_size <= LIMIT:
            temporary.replace(target)
            return crf
    temporary.unlink()
    fail('压缩后仍超过 95 MB，视频太长。请先剪短或分段。')


def main():
    parser = argparse.ArgumentParser(description='把由网站文章改编的小红书视频挂到这篇文章上。')
    parser.add_argument('work_id', help='网站作品 ID，见 public/content/acoustics-index.json')
    parser.add_argument('video', type=Path, help='上传到小红书的那个视频文件')
    parser.add_argument('--url', required=True, help='小红书笔记的公开链接')
    parser.add_argument('--cover', type=Path, help='封面图；省略时取视频第 1 秒的画面')
    parser.add_argument('--large-files', help='largeFiles 仓库路径，默认是本仓库旁边的 largeFiles')
    parser.add_argument('--replace', action='store_true', help='这篇已有视频版时替换它')
    args = parser.parse_args()

    for tool in ('ffmpeg', 'ffprobe'):
        if not shutil.which(tool):
            fail(f'需要先安装 {tool}。')
    link = urlparse(args.url)
    if link.scheme not in ('https', 'http') or link.hostname not in HOSTS:
        fail('--url 要填小红书笔记链接（xiaohongshu.com 或 xhslink.com）。')
    if not args.video.is_file():
        fail(f'找不到视频文件 {args.video}。')
    if args.cover and not args.cover.is_file():
        fail(f'找不到封面图 {args.cover}。')

    index = json.loads(INDEX.read_text(encoding='utf-8'))
    entry = next((row for row in index if row.get('id') == args.work_id), None)
    if entry is None:
        fail(f'网站索引里没有作品 {args.work_id}。')
    store = large_files(args.large_files)
    folder = store / FOLDER / args.work_id
    video, poster = folder / f'{NAME}.mp4', folder / f'{NAME}.webp'
    if (entry.get('videoFile') or video.exists()) and not args.replace:
        fail(f'{args.work_id} 已有视频版（{entry.get("videoFile") or video}）。确认要换掉就加 --replace。')

    source = probe(args.video)
    if not source['audio']:
        print('提示：这个视频没有声音轨。', file=sys.stderr)
    folder.mkdir(parents=True, exist_ok=True)
    crf = encode(args.video, video)
    stored = probe(video)
    if args.cover:
        ffmpeg('-i', args.cover, '-vf', FIT, '-frames:v', 1, '-c:v', 'libwebp', '-quality', 80, poster)
    else:
        ffmpeg('-ss', min(1.0, stored['duration'] / 2), '-i', video, '-vf', FIT, '-frames:v', 1,
               '-c:v', 'libwebp', '-quality', 80, poster)

    web = f'{WEB_ROOT}{FOLDER}/{args.work_id}/{NAME}'
    entry['videoFile'], entry['videoPoster'] = web + '.mp4', web + '.webp'
    # Keep the original-source button: without a links list the page falls back to the url field.
    links = entry.get('links') or ([{'label': '原文', 'url': entry['url']}] if entry.get('url') else [])
    entry['links'] = [row for row in links if row.get('label') != LABEL] + [{'label': LABEL, 'url': args.url}]
    INDEX.write_text(json.dumps(index, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    print(f'视频：{video}（{stored["width"]}×{stored["height"]}，{stored["duration"]:.0f} 秒，'
          f'{video.stat().st_size / 1e6:.1f} MB，CRF {crf}）')
    print(f'封面：{poster}')
    print(f'索引：{INDEX.relative_to(ROOT)} 已更新 {args.work_id}')
    print(f'上线后：{SITE}/#/works?type={entry.get("section") or "articles"}&item={args.work_id}')
    print('下一步：先在 largeFiles 提交并推送到 main，再提交本仓库并合并到 main。')


if __name__ == '__main__':
    main()
