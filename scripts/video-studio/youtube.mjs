import { checked, nextOffset, sessionURL, mb } from '../../public/studio/github.js';

export const youtubeId = value => typeof value === 'string' && /^[\w-]{11}$/.test(value);
export const googleScopes = ['youtube.upload', 'youtube.readonly'].map(s => 'https://www.googleapis.com/auth/' + s);
export function googleAccess(credentials) {
  let token = '', until = 0;
  return async () => {
    if (Date.now() < until) return token;
    const body = new URLSearchParams({ grant_type: 'refresh_token', client_id: credentials.client_id, client_secret: credentials.client_secret, refresh_token: credentials.refresh_token });
    const response = await checked(await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body }));
    const result = await response.json();
    if (!result.access_token) throw new Error('需要重新授权 Google 账号');
    token = result.access_token;

    until = Date.now() + (result.expires_in - 60) * 1000;

    return token;
  };
}
export function youtubeAPI(credentials) {
  const token = googleAccess(credentials);
  const request = async (url, opts = {}) => {
    const headers = new Headers(opts.headers);
    headers.set('Authorization', 'Bearer ' + await token());
    return fetch(url, { ...opts, headers });
  };
  return { request, json: async url => (await checked(await request(url))).json() };
}
export async function channelId(google) {
  const response = await google.json('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true');
  if (!response.items?.[0]?.id) throw new Error('授权的 Google 账号没有可用的 YouTube 频道');
  return response.items[0].id;
}
export function publicStatus(item) {
  const status = item?.status;
  if (!status) return 'missing';
  if (['failed', 'rejected', 'deleted'].includes(status.uploadStatus)) return 'rejected';
  if (status.uploadStatus !== 'processed') return 'submitted';
  if (status.privacyStatus === 'private' && status.publishAt && new Date(status.publishAt) > new Date()) return 'scheduled';
  return ['public', 'private', 'unlisted'].includes(status.privacyStatus) ? status.privacyStatus : 'submitted';
}
async function upload(ctx, target) {
  const { storage, google, video, spec, save } = ctx, size = Number(video.size);
  if (!target.session) {
    const choice = spec.youtube;
    const status = { privacyStatus: choice.privacy === 'scheduled' ? 'private' : choice.privacy, selfDeclaredMadeForKids: Boolean(choice.kids) };
    if (choice.privacy === 'scheduled') status.publishAt = choice.publishAt;
    const response = await checked(await google.request('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Upload-Content-Type': video.mimeType, 'X-Upload-Content-Length': String(size) },
      body: JSON.stringify({ snippet: { title: spec.title, description: spec.description, tags: spec.tags, categoryId: '10' }, status })
    }));
    target.session = sessionURL(response.headers.get('Location'));
    target.finalSent = false;
    await save();
  }
  const url = sessionURL(target.session);
  let response = await google.request(url, { method: 'PUT', headers: { 'Content-Range': 'bytes */' + size }, body: new Uint8Array(0) });
  while (response.status === 308) {
    const offset = nextOffset(response);
    if (offset >= size) throw new Error('YouTube 返回的上传进度异常');
    const end = Math.min(offset + 8 * mb, size);
    const bytes = await storage.range(video, offset, end - 1);
    if (end === size && !target.finalSent) {
      target.finalSent = true;
      await save();
    }
    response = await google.request(url, { method: 'PUT', headers: { 'Content-Type': video.mimeType, 'Content-Range': 'bytes ' + offset + '-' + (end - 1) + '/' + size }, body: bytes });
    if (response.status === 308 && nextOffset(response) <= offset) throw new Error('YouTube 尚未确认分片，将从已确认位置继续');
  }
  if ([404, 410].includes(response.status)) {
    if (target.finalSent) {
      target.uncertain = true;
      throw new Error('最后一个分片的回执已过期，请在发布记录中关联已有视频。');
    }
    delete target.session;
    await save();
  }
  const receipt = await (await checked(response)).json();
  if (!youtubeId(receipt.id)) {
    target.uncertain = true;
    throw new Error('请到 YouTube Studio 确认视频编号并关联。');
  }
  target.id = receipt.id;
  delete target.session;
  delete target.finalSent;
  await save();
}
export async function processYouTube(ctx, target) {
  const { storage, google, cover, ownerChannel, manualYT, save } = ctx;
  if (manualYT && manualYT !== target.id) {
    if (!youtubeId(manualYT)) throw new Error('YouTube 视频编号无效');
    const found = await google.json('https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + manualYT);
    if (!ownerChannel || found.items?.[0]?.snippet?.channelId !== ownerChannel) throw new Error('这个视频不属于已授权频道。');
    target.id = manualYT;
    delete target.uncertain;
    delete target.session;
    await save();
  }
  if (!target.id) {
    if (target.uncertain) throw new Error('请在发布记录中关联 YouTube 视频。');
    await upload(ctx, target);
  }
  const data = await google.json('https://www.googleapis.com/youtube/v3/videos?part=status&id=' + target.id);
  const visible = publicStatus(data.items?.[0]);
  target.live = visible === 'public';
  target.status = visible;
  if (visible === 'rejected' || visible === 'missing') throw new Error('视频已移除、被拒绝或无法读取，请到 YouTube Studio 核对。');
  if (cover && !target.coverDone) {
    const bytes = await storage.range(cover, 0, Number(cover.size) - 1);
    await checked(await google.request('https://www.googleapis.com/upload/youtube/v3/thumbnails/set?uploadType=media&videoId=' + target.id, { method: 'POST', headers: { 'Content-Type': cover.mimeType }, body: bytes }));
    target.coverDone = true;
  }
}
