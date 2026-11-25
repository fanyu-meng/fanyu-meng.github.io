#!/usr/bin/env python3
"""Refresh only aggregate profile counters. Uses Python 3's standard library."""
import argparse
import concurrent.futures
import datetime as dt
import http.client
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
FILE = Path("public/content/profile-stats.json")
WORKS = Path("public/content/works.json")
FEED = "https://anchor.fm/s/1063042b8/podcast/rss"
PAGES = "https://fanyu-meng.github.io/content/profile-stats.json"
TODAY = dt.datetime.now(dt.timezone.utc).date().isoformat()
NUMBER = re.compile(r"(?:Open\s*Mic\s*#?\s*|开放麦\s*#\s*)(\d+)(?:\s*[-–—至]\s*(\d+))?", re.I)
PERSONAL_NOTES = Path.home() / "Library/Mobile Documents/iCloud~md~obsidian/Documents/Apple Notes Backup/iCloud/脱口秀/复盘/我的复盘"
KEYS = ("standupShows", "podcastEpisodes", "acousticsArticles", "zhihuFollowers", "wechatFollowers")


def fetch(url, data=None):
    headers = {"User-Agent": "FanyuMeng-Portfolio/1.0", "Accept": "*/*"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    body = json.dumps(data).encode() if data is not None else None
    request = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(request, timeout=6) as response:
        return response.read(16 * 1024 * 1024)


def number(value):
    if type(value) is not int or value < 0:
        raise ValueError("missing counter")
    return value


def verified(value, source, date=TODAY):
    return {"value": number(value), "asOf": date, "status": "verified", "source": source}


def previous(data, key):
    metric = data.get(key, {})
    if not isinstance(metric, dict) or type(metric.get("value")) is not int or not metric.get("asOf"):
        return {"value": None, "asOf": None, "status": "unavailable"}
    date = dt.date.fromisoformat(metric["asOf"]).isoformat()
    return {**verified(metric["value"], metric.get("source", ""), date), "status": "last-known"}


def documented_shows(staged):
    titles = []
    if staged:
        source = subprocess.run(["git", "show", f":{WORKS.as_posix()}"], cwd=ROOT, capture_output=True)
        if source.returncode == 0:
            titles += [note["title"] for note in json.loads(source.stdout)["reviews"] if note.get("body")]
    elif (ROOT / WORKS).exists():
        titles += [note["title"] for note in json.loads((ROOT / WORKS).read_text())["reviews"] if note.get("body")]
    # The numbering is the author's cumulative performance ordinal. Rehearsal scripts
    # can include future shows, so only completed written retrospectives are used.
    local_dir = Path(os.environ.get("STANDUP_REVIEWS_DIR", str(PERSONAL_NOTES)))
    if local_dir.is_dir():
        for path in local_dir.glob("*.md"):
            if NUMBER.search(path.stem) and len(path.read_text(encoding="utf-8").strip().splitlines()) > 1:
                titles.append(path.stem)
    ordinals = [int(end or start) for title in titles for start, end in NUMBER.findall(title)]
    if not ordinals:
        raise ValueError("no numbered show notes")
    return verified(max(ordinals), "numbered-show-notes")


def acoustics_articles():
    # Acoustics-science articles on the site, excluding Zhihu answers.
    entries = json.loads((ROOT / "public/content/acoustics-index.json").read_text(encoding="utf-8"))
    ids = {e.get("sameWorkAs") or e["id"] for e in entries if e.get("section") == "articles" and e.get("format") == "article"}
    return verified(len(ids), "acoustics-index.json")


def published_episodes():
    cursor = FEED
    pages = set()
    episodes = set()
    while cursor:
        if cursor in pages or len(pages) >= 50:
            raise ValueError("incomplete feed pagination")
        pages.add(cursor)
        channel = ET.fromstring(fetch(cursor)).find("channel")
        if channel is None or (channel.findtext("title") or "").strip() != "破壁圆桌":
            raise ValueError("unexpected feed")
        for item in channel.findall("item"):
            guid = item.findtext("guid") or item.findtext("link")
            if not guid:
                raise ValueError("episode without identifier")
            episodes.add(guid.strip())
        next_link = channel.find("{http://www.w3.org/2005/Atom}link[@rel='next']")
        cursor = urllib.parse.urljoin(cursor, next_link.get("href")) if next_link is not None and next_link.get("href") else None
        if cursor and urllib.parse.urlsplit(cursor).scheme != "https":
            raise ValueError("unsupported feed link")
    if not episodes:
        raise ValueError("empty feed")
    return verified(len(episodes), FEED)


def zhihu_followers():
    # Use the author's account, not followers of just the column. A published
    # article identifies the account even if its public profile handle changes.
    handle = os.environ.get("ZHIHU_PROFILE_HANDLE", "")
    if not handle:
        article = json.loads(fetch("https://www.zhihu.com/api/v4/articles/55749374"))
        if str(article.get("id")) != "55749374":
            raise ValueError("wrong article")
        handle = article["author"]["url_token"]
    if not isinstance(handle, str) or not handle:
        raise ValueError("no Zhihu profile")
    path = urllib.parse.quote(handle, safe="")
    profile = json.loads(fetch("https://www.zhihu.com/api/v4/members/" + path + "?include=follower_count"))
    if profile.get("url_token") != handle:
        raise ValueError("wrong Zhihu account")
    return verified(profile["follower_count"], "https://www.zhihu.com/people/" + path)


def wechat_followers():
    appid, secret = os.getenv("WECHAT_APP_ID"), os.getenv("WECHAT_APP_SECRET")
    if not appid or not secret:
        raise ValueError("WeChat account credentials unavailable")
    # Stable tokens do not invalidate the publisher's existing token.
    response = json.loads(fetch("https://api.weixin.qq.com/cgi-bin/stable_token", {
        "grant_type": "client_credential", "appid": appid, "secret": secret, "force_refresh": False,
    }))
    token = urllib.parse.quote(response["access_token"], safe="")
    response = json.loads(fetch("https://api.weixin.qq.com/cgi-bin/user/get?access_token=" + token))
    # Only the aggregate is retained. No openids or server responses are logged.
    return verified(response["total"], "WeChat Official Account API")


def save_atomically(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as temp:
        json.dump(data, temp, ensure_ascii=False, indent=2)
        temp.write("\n")
    os.chmod(temp.name, 0o644)
    os.replace(temp.name, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / FILE, help="destination for the refreshed snapshot")
    parser.add_argument("--staged", action="store_true", help="derive published notes from the commit index")
    args = parser.parse_args()
    path = ROOT / FILE
    baseline = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    jobs = {"standupShows": lambda: documented_shows(args.staged), "podcastEpisodes": published_episodes,
            "acousticsArticles": acoustics_articles, "zhihuFollowers": zhihu_followers, "wechatFollowers": wechat_followers}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        tasks = {key: pool.submit(job) for key, job in jobs.items()}
        # The previous deployment may contain fresher measurements than the
        # last local commit. This also survives skipped CI jobs and cache expiry.
        if os.getenv("GITHUB_ACTIONS") == "true":
            old = pool.submit(lambda: json.loads(fetch(PAGES)))
            try:
                published = old.result()
                for key in KEYS:
                    candidate = previous(published, key)
                    if (candidate["asOf"] or "") > (previous(baseline, key)["asOf"] or ""):
                        baseline[key] = candidate
            except (OSError, http.client.HTTPException, KeyError, TypeError, ValueError):
                pass
        stats = {}
        for key, task in tasks.items():
            try:
                stats[key] = task.result()
            except (OSError, http.client.HTTPException, KeyError, IndexError, TypeError, ValueError, ET.ParseError):
                stats[key] = previous(baseline, key)
                print(f"{key}: {stats[key]['status']}", file=sys.stderr)
    # A checkout without local iCloud can know fewer documented performances
    # than a previous local commit. An observed cumulative ordinal never falls.
    old_show = previous(baseline, "standupShows")
    if old_show["value"] is not None and old_show["value"] > (stats["standupShows"]["value"] or 0):
        stats["standupShows"] = old_show
    zh, wx = stats["zhihuFollowers"], stats["wechatFollowers"]
    if zh["value"] is None or wx["value"] is None:
        stats["followers"] = {"value": None, "asOf": None, "status": "unavailable"}
    else:
        stats["followers"] = verified(zh["value"] + wx["value"], "Zhihu + WeChat", min(zh["asOf"], wx["asOf"]))
        if zh["status"] != "verified" or wx["status"] != "verified" or zh["asOf"] != wx["asOf"]:
            stats["followers"]["status"] = "last-known"
    save_atomically(args.output, stats)


if __name__ == "__main__":
    main()
