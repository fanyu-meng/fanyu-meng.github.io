import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { repo, workflow } from '../../public/studio/github.js';

const origin = 'http://127.0.0.1:8784', host = new URL(origin).host;
const publicDir = new URL('../../public/studio/', import.meta.url);
const types = { 'index.html': 'text/html', 'studio.js': 'text/javascript', 'github.js': 'text/javascript', 'studio.css': 'text/css' };
const token = spawnSync('gh', ['auth', 'token', '--hostname', 'github.com'], { encoding: 'utf8' }).stdout?.trim();
if (!token) {
  console.error('请先运行 gh auth login 连接你的 GitHub 账号。');
  process.exit(1);
}
const server = createServer(async (req, res) => {
  try {
    if (req.headers.host !== host || req.headers.origin && req.headers.origin !== origin) {
      res.writeHead(403).end();
      return;
    }
    const u = new URL(req.url, origin);
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/studio')) {
      res.writeHead(302, { Location: '/studio/' }).end();
      return;
    }
    if (req.method === 'GET' && u.pathname.startsWith('/studio/')) {
      const file = u.pathname.slice(8) || 'index.html';
      if (!Object.hasOwn(types, file)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': types[file] + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
      res.end(await readFile(new URL(file, publicDir)));
      return;
    }
    if (req.headers['x-studio-local'] !== '1') {
      res.writeHead(403).end();
      return;
    }
    const route = u.pathname.slice('/local-api'.length), method = req.method;
    let upstream;
    if (u.pathname.startsWith('/local-api') && (
      method === 'GET' && /^(?:\/?|\/releases(?:\/[0-9]+(?:\/assets)?)?|\/contents\/studio-config\.json)$/.test(route) ||
      method === 'POST' && (route === '/releases' || route === '/actions/workflows/' + workflow + '/dispatches') ||
      method === 'DELETE' && /^\/releases\/assets\/[0-9]+$/.test(route) ||
      method === 'PATCH' && /^\/releases\/[0-9]+$/.test(route))) upstream = 'https://api.github.com/repos/' + repo + route + u.search;
    if (method === 'POST' && /^\/local-upload\/[0-9]+$/.test(u.pathname) && /^[a-z0-9.]{1,100}$/.test(u.searchParams.get('name') || '')) upstream = 'https://uploads.github.com/repos/' + repo + '/releases/' + u.pathname.split('/').pop() + '/assets?name=' + encodeURIComponent(u.searchParams.get('name'));
    if (!upstream) {
      res.writeHead(404).end();
      return;
    }
    const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    for (const key of ['content-type', 'content-length']) if (req.headers[key]) headers[key] = req.headers[key];
    const r = await fetch(upstream, { method, headers, ...(['POST', 'PATCH'].includes(method) ? { body: Readable.toWeb(req), duplex: 'half' } : {}) });
    res.writeHead(r.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    if (r.body) Readable.fromWeb(r.body).pipe(res); else res.end();
  } catch {
    if (!res.headersSent) res.writeHead(502);
    res.end();
  }
});
server.headersTimeout = 60000;
server.requestTimeout = 0;
server.on('error', e => {
  console.error(e.code === 'EADDRINUSE' ? '本地发布台已在 ' + origin + '/studio/ 运行。' : '本地发布台未能启动：' + e.code);
  process.exitCode = 1;
});
server.listen(8784, '127.0.0.1', () => {
  const url = origin + '/studio/';
  console.log('发布台 ' + url + ' · 上传入队后可关闭此窗口。');
  const p = spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { detached: true, stdio: 'ignore' });
  p.on('error', () => { });
  p.unref();
});
