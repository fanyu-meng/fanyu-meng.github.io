#!/usr/bin/env python3
"""把网站「吉他&音乐」里的视频下载下来，存进自己的 guitar-media-N 仓库。

在自己的电脑上运行（B 站会拦截机房 IP）。需要 git、yt-dlp、ffmpeg：

    brew install yt-dlp ffmpeg
    python3 archive-videos.py                                   # 存档网站上已有的全部视频
    python3 archive-videos.py --file 成片.mp4 --id <视频ID> --title 标题   # 存一条新视频


- 视频列表取自网站仓库 main 分支的 public/content/works.json。
- 画质：取平台上最高的 H.264 + AAC，只拆合封装，不重新编码。
- 单个文件超过 95 MB 的，切成 HLS 分段（同样不重新编码），绕开 GitHub 单文件 100 MB 的限制。
- 每个仓库装到约 800 MB 就换下一个：guitar-media-1、guitar-media-2……
  下一个仓库还不存在时脚本会停下，提示你去 GitHub 新建。
- 新视频用 --file 直接存本地成片，同样不重新编码，并截第 1 秒的画面作封面 cover.jpg。
- 每存好一条就提交并推送一次。中途断了，重新运行即可，已存的会跳过。
"""
import argparse, json, os, shutil, subprocess, sys, tempfile, time, urllib.request
from datetime import date
from pathlib import Path

OWNER = 'fanyu-meng'
REPO_PREFIX = 'guitar-media-'
GIT_BASE = os.environ.get('ARCHIVE_GIT_BASE', f'https://github.com/{OWNER}/')
WORKS_URL = f'https://raw.githubusercontent.com/{OWNER}/{OWNER}.github.io/main/public/content/works.json'
SINGLE_FILE_LIMIT = 95 * 1024 * 1024
FORMAT = 'bv*[vcodec^=avc1]+ba[acodec^=mp4a]/bv*[vcodec^=avc1]+ba/bv*+ba/b'

README = """# {name}

个人网站 [{owner}.github.io](https://{owner}.github.io/) 的视频存档，由网站仓库的
`scripts/archive-videos.py` 生成。开启了 GitHub Pages（`main` 分支、根目录），
文件地址是 `https://{owner}.github.io/{name}/<视频ID>/…`。

- `<视频ID>/video.mp4`：H.264 + AAC，平台上的最高画质，未重新编码。
- `<视频ID>/index.m3u8` 和 `seg-NNNN.ts`：超过 95 MB 的视频切成的 HLS 分段，同样未重新编码。
- `manifest.json`：每条视频的路径、大小、分辨率、时长和来源。网站据此生成 `public/content/video-media.json`。

本仓库控制在约 800 MB 以内（Pages 每个站点上限约 1 GB）。装满后新视频放进下一个仓库。
"""


def run(cmd, **kw):
    print('  $', ' '.join(str(c) for c in cmd), flush=True)
    return subprocess.run(cmd, check=True, **kw)


def need(tool):
    if not shutil.which(tool):
        sys.exit(f'缺少 {tool}。先运行：brew install yt-dlp ffmpeg')


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', str(path)],
                         check=True, capture_output=True, text=True).stdout
    info = json.loads(out)
    video = next(s for s in info['streams'] if s['codec_type'] == 'video')
    audio = next((s for s in info['streams'] if s['codec_type'] == 'audio'), None)
    return {
        'width': video.get('width'), 'height': video.get('height'),
        'videoCodec': video.get('codec_name'), 'audioCodec': audio and audio.get('codec_name'),
        'duration': round(float(info['format'].get('duration', 0)), 2),
    }


def source_url(entry):
    for raw in [entry.get('url'), *[l.get('url') for l in entry.get('links') or []], entry.get('embed')]:
        if not raw:
            continue
        if 'bilibili.com/video/' in raw or 'youtube.com/watch' in raw or 'youtu.be/' in raw:
            return raw
    if entry['id'].startswith('BV'):
        return f"https://www.bilibili.com/video/{entry['id']}/"
    return None


def dir_size(path):
    return sum(f.stat().st_size for f in Path(path).rglob('*') if f.is_file() and '.git' not in f.parts)


class Repo:
    def __init__(self, root, n):
        self.n, self.name = n, f'{REPO_PREFIX}{n}'
        self.path = root / self.name

    def ensure(self):
        if not (self.path / '.git').exists():
            url = f'{GIT_BASE}{self.name}.git'
            if subprocess.run(['git', 'ls-remote', url], capture_output=True).returncode != 0:
                return False
            run(['git', 'clone', url, str(self.path)])
        else:
            subprocess.run(['git', '-C', str(self.path), 'pull', '--ff-only', '-q'], check=False)
        subprocess.run(['git', '-C', str(self.path), 'config', 'http.postBuffer', '524288000'], check=True)
        if not (self.path / 'README.md').exists():
            (self.path / 'README.md').write_text(README.format(name=self.name, owner=OWNER), encoding='utf-8')
            (self.path / '.nojekyll').write_text('')
        return True

    @property
    def manifest_path(self):
        return self.path / 'manifest.json'

    def manifest(self):
        if self.manifest_path.exists():
            return json.loads(self.manifest_path.read_text(encoding='utf-8'))
        return {'repo': self.name, 'videos': {}}

    def save(self, manifest, message):
        self.manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        run(['git', '-C', str(self.path), 'add', '-A'])
        run(['git', '-C', str(self.path), 'commit', '-q', '-m', message])
        for attempt in range(4):
            if subprocess.run(['git', '-C', str(self.path), 'push', '-u', 'origin', 'HEAD:main']).returncode == 0:
                return
            time.sleep(5 * 2 ** attempt)
        sys.exit(f'推送 {self.name} 失败。检查网络后重新运行脚本，已提交的内容不会丢。')


def download(entry, url, work, cookies):
    out = work / entry['id']
    cmd = ['yt-dlp', '--no-playlist', '--no-warnings', '-f', FORMAT, '-S', 'res,fps,br',
           '--merge-output-format', 'mp4', '--remux-video', 'mp4',
           '--postprocessor-args', 'ffmpeg:-movflags +faststart',
           '--retries', '10', '-o', f'{out}.%(ext)s', url]
    if cookies:
        cmd[1:1] = ['--cookies-from-browser', cookies]
    run(cmd)
    return out.with_suffix('.mp4')


def place(file, dest):
    """Move the download into dest/, splitting it into HLS segments when it is too big for GitHub."""
    dest.mkdir(parents=True, exist_ok=True)
    if file.stat().st_size <= SINGLE_FILE_LIMIT:
        shutil.move(str(file), dest / 'video.mp4')
        return 'mp4', 'video.mp4'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(file), '-map', '0:v:0', '-map', '0:a:0?', '-c', 'copy',
         '-f', 'hls', '-hls_time', '6', '-hls_playlist_type', 'vod', '-hls_flags', 'independent_segments',
         '-hls_segment_filename', str(dest / 'seg-%04d.ts'), str(dest / 'index.m3u8')])
    biggest = max(f.stat().st_size for f in dest.glob('seg-*.ts'))
    if biggest > SINGLE_FILE_LIMIT:
        sys.exit(f'{dest.name} 有分段超过 95 MB，停止。请把这条的情况告诉 Claude。')
    file.unlink()
    return 'hls', 'index.m3u8'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dir', default='~/guitar-media', help='存放各个 guitar-media-N 仓库的文件夹')
    ap.add_argument('--limit-mb', type=int, default=800, help='每个仓库的容量上限（MB）')
    ap.add_argument('--cookies-from-browser', metavar='BROWSER',
                    help='用浏览器里的登录状态下载，例如 chrome、safari。B 站登录后能拿到更高画质')
    ap.add_argument('--works', default=WORKS_URL, help='works.json 的地址或本地路径')
    ap.add_argument('--only', nargs='*', help='只处理这些视频 ID')
    ap.add_argument('--file', help='存一条本地成片，不从平台下载。要同时给 --id 和 --title')
    ap.add_argument('--id', help='新视频的 ID：小写英文加连字符，例如 2026-11-blackbird')
    ap.add_argument('--title', help='新视频的标题')
    args = ap.parse_args()
    if args.file and not (args.id and args.title):
        ap.error('--file 需要同时给 --id 和 --title')
    for tool in ('git', 'yt-dlp', 'ffmpeg', 'ffprobe'):
        need(tool)

    root = Path(args.dir).expanduser()
    root.mkdir(parents=True, exist_ok=True)
    limit = args.limit_mb * 1024 * 1024

    if args.file:
        works = {'video': [{'id': args.id, 'title': args.title, 'file': str(Path(args.file).expanduser())}]}
    elif os.path.exists(args.works):
        works = json.loads(Path(args.works).read_text(encoding='utf-8'))
    else:
        works = json.load(urllib.request.urlopen(args.works))
    videos = sorted(works['video'], key=lambda v: (v.get('publishedAt') or '', v['id']))
    if args.only:
        videos = [v for v in videos if v['id'] in args.only]

    repos, done = [], {}
    n = 1
    while True:
        repo = Repo(root, n)
        if not repo.ensure():
            break
        repos.append(repo)
        for vid in repo.manifest()['videos']:
            done[vid] = repo.name
        n += 1
    if not repos:
        sys.exit(f'找不到 github.com/{OWNER}/{REPO_PREFIX}1。先在 GitHub 新建这个仓库（可以是空的），再运行。')

    todo = [v for v in videos if v['id'] not in done]
    print(f'共 {len(videos)} 条，已存 {len(videos) - len(todo)} 条，待处理 {len(todo)} 条。\n')
    failed = []
    with tempfile.TemporaryDirectory(prefix='archive-videos-') as tmp:
        work = Path(tmp)
        for i, entry in enumerate(todo, 1):
            url = entry.get('file') or source_url(entry)
            print(f"[{i}/{len(todo)}] {entry['id']} {entry['title']}")
            if entry.get('file'):
                if not Path(url).is_file():
                    sys.exit(f'找不到文件 {url}')
                file = work / f"{entry['id']}.mp4"
                run(['ffmpeg', '-v', 'error', '-y', '-i', url, '-map', '0:v:0', '-map', '0:a:0?', '-c', 'copy',
                     '-movflags', '+faststart', str(file)])
                url = 'local:' + Path(url).name
            elif not url:
                print('  没有可下载的来源链接，跳过。')
                failed.append((entry['id'], '没有来源链接'))
                continue
            else:
                try:
                    file = download(entry, url, work, args.cookies_from_browser)
                except subprocess.CalledProcessError:
                    failed.append((entry['id'], '下载失败'))
                    continue
            size = file.stat().st_size
            repo = next((r for r in repos if dir_size(r.path) + size <= limit), None)
            if not repo:
                repo = Repo(root, repos[-1].n + 1)
                if not repo.ensure():
                    sys.exit(f'{repos[-1].name} 已经装满。先在 GitHub 新建 {repo.name} 仓库并开启 Pages，再重新运行脚本。')
                repos.append(repo)
            meta = probe(file)
            if meta['videoCodec'] != 'h264':
                print(f"  注意：视频编码是 {meta['videoCodec']}，不是 H.264，部分浏览器可能放不了。按要求不转码，照存。")
            if entry.get('file'):
                (repo.path / entry['id']).mkdir(parents=True, exist_ok=True)
                run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-i', str(file), '-frames:v', '1', '-q:v', '2',
                     str(repo.path / entry['id'] / 'cover.jpg')])
            kind, name = place(file, repo.path / entry['id'])
            manifest = repo.manifest()
            manifest['videos'][entry['id']] = {
                'path': f"{entry['id']}/{name}", 'type': kind, 'bytes': size, **meta,
                'title': entry['title'], 'source': url, 'archivedAt': date.today().isoformat(),
            }
            repo.save(manifest, f"存档 {entry['id']}：{entry['title']}")
            print(f"  已存入 {repo.name}（{size / 1e6:.0f} MB，{meta['height']}p，{kind}）\n")

    print('\n完成。')
    for repo in repos:
        print(f'  {repo.name}: {len(repo.manifest()["videos"])} 条，{dir_size(repo.path) / 1e6:.0f} MB')
    if failed:
        print('\n以下没有存成，请把这段发给 Claude：')
        for vid, why in failed:
            print(f'  {vid}  {why}')
    print('\n下一步：确认每个仓库都开启了 Pages（Settings → Pages → main / root），然后告诉 Claude「视频存档好了」。')


if __name__ == '__main__':
    main()
