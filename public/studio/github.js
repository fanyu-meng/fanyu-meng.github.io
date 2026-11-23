export const repo = 'fanyu-meng/video-publishing-studio';
export const repoURL = 'https://github.com/' + repo;
export const mb = 1024 * 1024;
export const workflow = 'distribute-videos.yml';
export const uuidOK = value => typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value);
const api = 'https://api.github.com/repos/' + repo;
export class RemoteError extends Error {
  constructor(status, reason = '') {
    super('HTTP ' + status + (reason ? ' · ' + reason : ''));
    this.status = status;
  }
}
export async function checked(res) {
  if (!res.ok) {
    const v = await res.json().catch(() => null);
    const reason = v?.error?.errors?.[0]?.reason || v?.error?.status || '';
    throw new RemoteError(res.status, String(reason).replace(/[^a-z0-9_-]/gi, '').slice(0, 60));
  }
  return res;
}
export function sessionURL(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || !(u.hostname.endsWith('.googleapis.com') || u.hostname === 'upload.youtube.com') || u.username || u.password || u.port) throw new Error('YouTube 上传地址无效');
  return u.href;
}
export function nextOffset(response) {
  const range = response.headers.get('Range');
  if (!range) return 0;
  const m = /^bytes=0-(\d+)$/.exec(range);
  if (!m) throw new Error('YouTube 上传进度异常');
  return Number(m[1]) + 1;
}
function id(value) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('GitHub 编号无效');
  return value;
}
export function jsonBody(release) {
  try {
    return JSON.parse(release.body || '{}');
  } catch {
    return {};
  }
}
export class MediaRepo {
  constructor(token, local = false) {
    this.token = token;
    this.local = local;
  }
  headers() {
    if (this.local) return { 'X-Studio-Local': '1' };
    return { Authorization: 'Bearer ' + this.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  }
  async call(path, method = 'GET', body) {
    const headers = this.headers();
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const r = await checked(await fetch((this.local ? '/local-api' : api) + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }));
    return r.status === 204 ? null : r.json();
  }
  async verify(requirePush = true) {
    const r = await this.call('');
    if (!r.private || (requirePush && r.permissions?.push === false)) throw new Error('需要对指定的 GitHub 私有仓库有写入权限');
    this.branch = r.default_branch;
    return r;
  }
  async pages(path) {
    const all = [];
    for (let page = 1; ; page++) {
      const rows = await this.call(path + '?per_page=100&page=' + page);
      all.push(...rows);
      if (rows.length < 100) return all;
    }
  }
  releases() {
    return this.pages('/releases');
  }
  assets(releaseId) {
    return this.pages('/releases/' + id(releaseId) + '/assets');
  }
  removeFailedAsset(assetId) {
    return this.call('/releases/assets/' + id(assetId), 'DELETE');
  }
  get(releaseId) {
    return this.call('/releases/' + id(releaseId));
  }
  create(tag, name, value) {
    return this.call('/releases', 'POST', { tag_name: tag, target_commitish: this.branch || 'main', name, draft: true, body: JSON.stringify(value) });
  }
  update(releaseId, value) {
    return this.call('/releases/' + id(releaseId), 'PATCH', { body: JSON.stringify(value) });
  }
  dispatch() {
    return this.call('/actions/workflows/' + workflow + '/dispatches', 'POST', { ref: this.branch || 'main' });
  }
  async upload(releaseId, name, bytes, onProgress) {
    const url = (this.local ? '/local-upload/' + id(releaseId) : 'https://uploads.github.com/repos/' + repo + '/releases/' + id(releaseId) + '/assets') + '?name=' + encodeURIComponent(name);
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.open('POST', url);
      for (const [k, v] of Object.entries(this.headers())) req.setRequestHeader(k, v);
      req.setRequestHeader('Content-Type', bytes.type || 'application/octet-stream');
      req.upload.onprogress = e => onProgress(e.loaded);
      req.onerror = () => reject(new Error('浏览器未能连接 GitHub 上传服务'));
      req.onload = () => {
        if (req.status >= 200 && req.status < 300) resolve(); else reject(new RemoteError(req.status));
      };
      req.send(bytes);
    });
  }
  async sliceAsset(asset, start, end) {
    const headers = { ...this.headers(), Accept: 'application/octet-stream', Range: 'bytes=' + start + '-' + end };
    let r = await fetch(api + '/releases/assets/' + id(asset.id), { headers, redirect: 'manual' });
    if ([301, 302, 307, 308].includes(r.status)) {
      const url = new URL(r.headers.get('location'));
      if (url.protocol !== 'https:' || !(url.hostname.endsWith('.githubusercontent.com') || url.hostname.endsWith('.blob.core.windows.net'))) throw new Error('GitHub 附件地址无效');
      r = await fetch(url, { headers: { Range: headers.Range } });
    }
    await checked(r);
    if (r.status !== 206 && !(start === 0 && end + 1 === asset.size)) {
      await r.body?.cancel();
      throw new Error('GitHub 未返回请求的附件分片');
    }
    const data = new Uint8Array(await r.arrayBuffer());
    if (data.length !== end - start + 1) throw new Error('GitHub 附件分片不完整');
    return data;
  }
  async range(file, start, end) {
    const buffer = new Uint8Array(end - start + 1);
    let offset = 0, copied = 0;
    for (const asset of file.assets) {
      const next = offset + asset.size;
      if (start < next && end >= offset) {
        const part = await this.sliceAsset(asset, Math.max(0, start - offset), Math.min(asset.size - 1, end - offset));
        buffer.set(part, copied);
        copied += part.length;
      }
      if (next > end) break;
      offset = next;
    }
    if (copied !== buffer.length) throw new Error('原片附件缺失');
    return buffer;
  }
}
export function assetPlan(file, role) {
  const ext = file.name.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1].toLowerCase() || 'bin';
  const base = role === 'video' ? 'original' : 'cover';
  const split = file.size >= 2 * 1024 * mb, step = split ? 512 * mb : file.size;
  if (!file.size || Math.ceil(file.size / step) > 999) throw new Error('文件大小不受支持');
  const pieces = [];
  for (let start = 0; start < file.size; start += step) {
    const number = String(pieces.length + 1).padStart(4, '0');
    pieces.push({ name: base + '.' + ext + (split ? '.part' + number : ''), size: Math.min(step, file.size - start) });
  }
  return { name: file.name, mimeType: file.type || ({ mp4: 'video/mp4', mov: 'video/quicktime', mkv: 'video/x-matroska', webm: 'video/webm' }[ext]) || 'application/octet-stream', size: file.size, pieces };
}
export function matchAssets(plan, assets) {
  if (!plan || !Array.isArray(plan.pieces) || !plan.pieces.length) return null;
  const parts = plan.pieces.map(p => assets.find(a => a.state === 'uploaded' && a.name === p.name && a.size === p.size));
  // The native GitHub release form keeps the creator's original filename.
  if (parts.length === 1 && !parts[0]) parts[0] = assets.find(a => a.state === 'uploaded' && a.name === plan.name && a.size === plan.size);
  if (parts.some(a => !a) || parts.reduce((n, p) => n + p.size, 0) !== plan.size) return null;
  return { ...plan, assets: parts };
}
