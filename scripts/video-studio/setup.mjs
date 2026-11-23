import { spawnSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { repo, workflow } from '../../public/studio/github.js';
import { channelId, youtubeAPI, googleScopes } from './youtube.mjs';
import { biliToken, seal } from './bilibili.mjs';

const site = 'fanyu-meng/fanyu-meng.github.io';
const redirect = 'http://127.0.0.1:8765/oauth2callback';
function cli(cmd, args, input) {
  const r = spawnSync(cmd, args, { input, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (r.status !== 0) {
    const e = new Error(cmd + ' 执行失败' + (r.stderr?.includes('HTTP 404') ? '（404）' : '，请检查网络、登录状态和仓库权限'));
    e.notFound = r.stderr?.includes('HTTP 404');
    throw e;
  }
  return r.stdout.trim();
}
const gh = (...args) => cli('gh', args);
function api(path, method = 'GET', body) {
  const value = cli('gh', ['api', path, '--method', method, ...(body === undefined ? [] : ['--input', '-'])], body === undefined ? undefined : JSON.stringify(body));
  return value ? JSON.parse(value) : null;
}
function maybe(path) {
  try {
    return api(path);
  } catch (e) {
    if (e.notFound) return null;
    throw e;
  }
}
function secret(name, value) {
  cli('gh', ['secret', 'set', name, '--repo', repo], value);
}
async function putFile(path, content) {
  const endpoint = 'repos/' + repo + '/contents/' + path, old = maybe(endpoint);
  if (old && Buffer.from(old.content, 'base64').toString() === content) return;
  api(endpoint, 'PUT', { message: 'Configure video studio', content: Buffer.from(content).toString('base64'), ...(old ? { sha: old.sha } : {}) });
}
function openURL(url) {
  const app = process.platform === 'darwin' ? 'open' : 'xdg-open';
  const child = spawn(app, [url], { stdio: 'ignore', detached: true });
  child.on('error', () => { });
  child.unref();
}
async function authorize(endpoint, params) {
  const state = randomBytes(30).toString('base64url'), url = new URL(endpoint);
  for (const [k, v] of Object.entries({ ...params, state })) url.searchParams.set(k, v);
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1:8765');
      if (req.headers.host !== '127.0.0.1:8765' || u.pathname !== '/oauth2callback' || u.searchParams.get('state') !== state) {
        res.writeHead(404).end();
        return;
      }
      const code = u.searchParams.get('code');
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }).end(code ? '已收到授权，可以关闭此页。' : '授权未完成，可以关闭此页。');
      clearTimeout(timer);
      server.close();
      code ? resolve(code) : reject(new Error('账号授权未完成'));
    });
    const timer = setTimeout(() => {
      server.close();
      reject(new Error('登录已超时'));
    }, 10 * 60 * 1000);
    server.on('error', err => {
      clearTimeout(timer);
      reject(new Error('本地授权回调不可用：' + err.code));
    });
    server.listen(8765, '127.0.0.1', () => {
      console.log('请在浏览器里选择账号并授权。');
      openURL(url.href);
    });
  });
}
async function configureGoogle(path) {
  if (!path) {
    const Downloads = join(homedir(), 'Downloads'), matches = (await readdir(Downloads)).filter(n => /^client_secret.*\.json$/i.test(n));
    if (matches.length !== 1) throw new Error('请执行 node scripts/video-studio/setup.mjs <下载的客户端 JSON 路径>');
    path = join(Downloads, matches[0]);
  }
  const json = JSON.parse(await readFile(path, 'utf8')), client = json.installed || json.web;
  if (!client?.client_id || !client?.client_secret) throw new Error('请选择 Google 的桌面或 Web OAuth 客户端 JSON');
  if (json.web && !client.redirect_uris?.includes(redirect)) throw new Error('请给 Web 客户端登记回调 ' + redirect);
  const verifier = randomBytes(40).toString('base64url');
  const code = await authorize('https://accounts.google.com/o/oauth2/v2/auth', { client_id: client.client_id, redirect_uri: redirect, response_type: 'code', scope: googleScopes.join(' '), access_type: 'offline', prompt: 'consent', code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url') });
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, redirect_uri: redirect, grant_type: 'authorization_code', code, code_verifier: verifier }) });
  const token = await response.json();
  if (!response.ok || !token.refresh_token || googleScopes.some(s => !(token.scope || '').split(' ').includes(s))) throw new Error('Google 授权不完整，请勾选 YouTube 上传和读取频道的权限');
  const creds = { client_id: client.client_id, client_secret: client.client_secret, refresh_token: token.refresh_token };
  creds.channelId = await channelId(youtubeAPI(creds));
  secret('VIDEO_GOOGLE_CREDENTIALS', JSON.stringify(creds));
  console.log('YouTube 频道已连接：' + creds.channelId);
}
async function configureBili(path) {
  if (!path) throw new Error('请提供仅保存在本机的 B 站应用 JSON，字段为 client_id 和 client_secret');
  const cfg = JSON.parse(await readFile(path, 'utf8'));
  if (!cfg.client_id || !cfg.client_secret) throw new Error('缺少 B 站应用凭证');
  const code = await authorize('https://account.bilibili.com/pc/account-pc/auth/oauth', { client_id: cfg.client_id, gourl: redirect });
  const tokens = await biliToken(cfg, { grant_type: 'authorization_code', code });
  if (tokens.scopes && !tokens.scopes.includes('ARC_BASE')) throw new Error('请在 B 站开放平台先开通 ARC_BASE 投稿权限，再重新授权');
  const vaultTag = 'studio-bili-' + randomUUID();
  api('repos/' + repo + '/releases', 'POST', { tag_name: vaultTag, name: 'B 站授权', draft: true, body: JSON.stringify(seal(tokens, cfg.client_secret)) });
  secret('VIDEO_BILI_CONFIG', JSON.stringify({ client_id: cfg.client_id, client_secret: cfg.client_secret, vaultTag }));
}
async function syncKey() {
  const dir = await mkdtemp(join(tmpdir(), 'video-studio-key-')), key = join(dir, 'key');
  let added;
  try {
    cli('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-f', key, '-C', 'video-studio-homepage']);
    added = api('repos/' + site + '/keys', 'POST', { title: 'Video studio homepage sync', key: (await readFile(key + '.pub', 'utf8')).trim(), read_only: false });
    secret('VIDEO_SITE_DEPLOY_KEY', await readFile(key, 'utf8'));
  } catch (e) {
    if (added) api('repos/' + site + '/keys/' + added.id, 'DELETE');
    throw e;
  }
  finally {
    await rm(dir, { recursive: true, force: true });
  }
}
async function main() {
  const viewer = api('user').login;
  if (viewer !== 'fanyu-meng') throw new Error('请先用 fanyu-meng 登录 GitHub CLI');
  const details = maybe('repos/' + repo) || api('user/repos', 'POST', { name: 'video-publishing-studio', private: true, auto_init: true, description: 'Private video masters and publishing queue' });
  if (!details.private || details.owner.login !== viewer) throw new Error('原片仓库必须归当前账号所有，并设为 Private');
  const names = new Set(JSON.parse(gh('secret', 'list', '--repo', repo, '--json', 'name')).map(s => s.name));
  if (!names.has('VIDEO_STATE_KEY')) secret('VIDEO_STATE_KEY', randomBytes(32).toString('base64'));
  if (!names.has('VIDEO_SITE_DEPLOY_KEY')) await syncKey();
  const [mode, path] = process.argv.slice(2);
  if (mode === '--bilibili') await configureBili(path);
  else if (mode !== '--github-only') await configureGoogle(mode);
  await putFile('studio-config.json', JSON.stringify({ ready: true, youtube: (mode !== '--github-only' && mode !== '--bilibili') || names.has('VIDEO_GOOGLE_CREDENTIALS'), bili: mode === '--bilibili' || names.has('VIDEO_BILI_CONFIG') }) + '\n');
  await putFile('.github/workflows/' + workflow, await readFile(new URL('./distribute-videos.yml', import.meta.url), 'utf8'));
  gh('variable', 'set', 'VIDEO_STUDIO_READY', '--repo', repo, '--body', 'true');
  gh('workflow', 'run', workflow, '--repo', repo, '--ref', details.default_branch);
  console.log('GitHub 私有原片仓库已就绪。发布页 https://fanyu-meng.github.io/studio/');
}
main().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
