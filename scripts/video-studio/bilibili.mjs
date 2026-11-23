import { createHash, createHmac, randomUUID, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { checked, mb } from '../../public/studio/github.js';

export const bvId = value => typeof value === 'string' && /^BV[0-9A-Za-z]{10}$/.test(value);
const base = 'https://member.bilibili.com/arcopen/fn/archive/';
function tokenKey(secret) {
  return createHash('sha256').update('video-studio/bili-tokens/v1\0' + secret).digest();
}
export function seal(tokens, secret) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', tokenKey(secret), iv);
  const bytes = Buffer.concat([cipher.update(JSON.stringify(tokens), 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: bytes.toString('base64') };
}
export function unseal(value, secret) {
  const dec = createDecipheriv('aes-256-gcm', tokenKey(secret), Buffer.from(value.iv, 'base64'));
  dec.setAuthTag(Buffer.from(value.tag, 'base64'));
  return JSON.parse(Buffer.concat([dec.update(Buffer.from(value.data, 'base64')), dec.final()]).toString());
}
async function result(response) {
  const body = await (await checked(response)).json();
  if (body.code !== 0) {
    const e = new Error('B 站接口错误 ' + Number(body.code));
    e.biliCode = body.code;
    throw e;
  }
  return body.data || {};
}
export async function biliToken(config, grant) {
  const path = grant.grant_type === 'refresh_token' ? 'refresh_token' : 'token';
  const params = new URLSearchParams({ client_id: config.client_id, client_secret: config.client_secret, ...grant });
  const token = await result(await fetch('https://api.bilibili.com/x/account-oauth2/v1/' + path, { method: 'POST', body: params }));
  if (!token.access_token || !token.refresh_token) throw new Error('B 站授权缺少令牌');
  const expiry = Number(token.expires_in), now = Date.now() / 1000;
  return { ...token, expiresAt: 1000 * (expiry > 1e9 ? expiry : now + expiry) };
}
export function biliClient(vault, config) {
  if (!config) return null;
  let cached;
  async function access() {
    if (!cached) cached = unseal(await vault.read(), config.client_secret);
    if (cached.expiresAt < Date.now() + 120000) {
      const next = await biliToken(config, { grant_type: 'refresh_token', refresh_token: cached.refresh_token });
      await vault.write(seal(next, config.client_secret));
      cached = next;
    }
    return cached.access_token;
  }
  return async function call(path, { query = {}, method = 'POST', body } = {}) {
    const payload = body && !(body instanceof FormData) ? JSON.stringify(body) : body;
    const headers = {
'x-bili-accesskeyid': config.client_id, 'x-bili-content-md5': createHash('md5').update(typeof payload === 'string' ? payload : '').digest('hex'),
      'x-bili-signature-method': 'HMAC-SHA256', 'x-bili-signature-nonce': randomUUID(), 'x-bili-signature-version': '2.0', 'x-bili-timestamp': String(Math.floor(Date.now() / 1000))
};
    const signing = Object.keys(headers).sort().map(k => k + ':' + headers[k]).join('\n');
    headers.Authorization = createHmac('sha256', config.client_secret).update(signing).digest('hex');
    headers['Access-Token'] = await access();
    if (typeof payload === 'string') headers['Content-Type'] = 'application/json';
    return result(await fetch(base + path + '?' + new URLSearchParams(query), { method, headers, body: payload }));
  };
}
async function publicBV(id) {
  const url = 'https://api.bilibili.com/x/web-interface/view?bvid=' + id;
  const response = await checked(await fetch(url, { headers: { Referer: 'https://www.bilibili.com/' } }));
  const data = await response.json();
  if (data.code === -404 || data.code === 62002) return null;
  if (data.code !== 0) throw new Error('B 站公开状态暂时无法核实（' + Number(data.code) + '）');
  return data.data?.bvid === id && data.data?.state === 0 ? data.data : null;
}
async function submit(ctx, target) {
  const { storage, video, cover, save, bili, spec } = ctx, query = () => ({ upload_token: target.uploadToken });
  if (!target.uploadToken) {
    const init = await bili('video/init', { body: { name: video.name, utype: '0' } });
    if (!init.upload_token) throw new Error('B 站未返回上传凭证');
    target.uploadToken = init.upload_token;
    target.parts = 0;
    await save();
  }
  const size = Number(video.size), chunk = 10 * mb;
  if (!target.merged) {
    while (target.parts * chunk < size) {
      const start = target.parts * chunk, end = Math.min(start + chunk, size);
      const bytes = await storage.range(video, start, end - 1);
      const params = new URLSearchParams({ ...query(), part_number: String(target.parts + 1) });
      await result(await fetch('https://openupos.bilivideo.com/video/v2/part/upload?' + params, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: bytes }));
      target.parts++;
      await save();
    }
    await bili('video/complete', { query: query() });
    target.merged = true;
    await save();
  }
  if (cover && !target.coverURL) {
    const data = new FormData(), image = await storage.range(cover, 0, Number(cover.size) - 1);
    data.set('file', new Blob([image], { type: cover.mimeType }), cover.name);
    const res = await bili('cover/upload', { body: data });
    if (!res.url) throw new Error('B 站未确认封面上传');
    target.coverURL = res.url;
    await save();
  }
  // A missing receipt after a successful submission must never trigger a second post.
  target.uncertain = true;
  await save();
  let posted;
  try {
    posted = await bili('add-by-utoken', { query: query(), body: { title: spec.title, desc: spec.description, tag: spec.tags.join(','), tid: spec.bilibili.tid, copyright: 1, ...(target.coverURL ? { cover: target.coverURL } : {}) } });
  }
  catch (e) {
    if (e.biliCode && e.biliCode !== 123015) target.uncertain = false;
    throw e;
  }
  if (!bvId(posted.resource_id)) throw new Error('B 站未返回可识别的 BV 号，请在发布记录中关联。');
  target.id = posted.resource_id;
  target.apiPost = true;
  delete target.uncertain;
  delete target.uploadToken;
  await save();
}
export async function processBili(ctx, target) {
  const manual = ctx.manualBV;
  if (manual && manual !== target.id) {
    if (!bvId(manual)) throw new Error('BV 号无效');
    target.id = manual;
    target.apiPost = false;
    delete target.publicCover;
    delete target.uncertain;
    delete target.uploadToken;
  }
  if (!target.id) {
    if (target.uncertain) throw new Error('投稿回执不确定，请在创作中心核对后关联 BV 号。');
    if (!ctx.bili || ctx.spec.bilibili.mode !== 'api') {
      target.status = 'manual';
      return;
    }
    await submit(ctx, target);
  }
  if (target.apiPost && ctx.bili) {
    const data = await ctx.bili('view', { method: 'GET', query: { resource_id: target.id } });
    const code = data.addit_info?.state;
    target.live = data.resource_id === target.id && code === 0;
    if (target.live) target.publicCover = data.cover || target.coverURL;
    if (data.addit_info?.reject_reason && !target.live) throw new Error('B 站审核未通过，请到创作中心查看原因。');
  } else {
    const video = await publicBV(target.id);
    target.live = Boolean(video);
    if (video) target.publicCover = video.pic;
  }
  target.status = target.live ? 'public' : 'submitted';
}
