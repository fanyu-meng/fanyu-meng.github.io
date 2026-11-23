import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { MediaRepo, uuidOK, mb, jsonBody, matchAssets } from '../../public/studio/github.js';
import { youtubeAPI, processYouTube, youtubeId } from './youtube.mjs';
import { biliClient, bvId, processBili, seal, unseal } from './bilibili.mjs';

const feedURL = new URL('../../public/content/published-videos.json', import.meta.url);
const finished = new Set(['public', 'private', 'unlisted', 'scheduled']);
export function validate(job) {
  const s = job.spec;
  if (job.schema !== 1 || !uuidOK(job.workId) || s?.version !== 1 || typeof s.title !== 'string' || !s.title.trim() || s.title.length > 100 || typeof s.description !== 'string' || s.description.length > 5000 || !Array.isArray(s.tags) || s.tags.some(t => typeof t !== 'string') || typeof s.showSite !== 'boolean' || !(s.youtube || s.bilibili)) throw new Error('投稿资料无效');
  const y = s.youtube, b = s.bilibili;
  if (y && (!['public', 'private', 'unlisted', 'scheduled'].includes(y.privacy) || y.privacy === 'scheduled' && !Number.isFinite(Date.parse(y.publishAt)))) throw new Error('YouTube 可见性无效');
  if (b && (!['api', 'manual'].includes(b.mode) || b.mode === 'api' && (!Number.isSafeInteger(b.tid) || b.tid < 1 || !s.tags.length))) throw new Error('B 站分区或标签无效');
}
export function publicRecord(job, state, createdAt) {
  const s = job.spec, yt = state.youtube, bi = state.bilibili;
  const youtube = s.youtube && yt?.live && youtubeId(yt.id) ? yt.id : undefined;
  const bilibili = s.bilibili && bi?.live && bvId(bi.id) ? bi.id : undefined;
  if (!s.showSite || !(youtube || bilibili)) return null;
  const cover = bilibili && typeof bi.publicCover === 'string'
    ? bi.publicCover.match(/^(?:https?:)?(\/\/i\d+\.hdslb\.com\/bfs\/[\w/.-]+)/i)?.[1] : undefined;
  return { id: 'video-' + job.workId, title: s.title, summary: s.description, createdAt,
    ...(youtube ? { youtube } : {}), ...(bilibili ? { bilibili } : {}), ...(cover ? { cover: 'https:' + cover } : {}) };
}
export function summary(state) {
  const out = {};
  for (const key of ['youtube', 'bilibili']) {
    const t = state[key];
    if (t) out[key] = { status: t.status || 'waiting', ...(t.message ? { message: t.message } : {}), ...(t.uncertain ? { uncertain: true } : {}) };
  }
  const values = Object.values(out);
  out.phase = values.length && values.every(t => finished.has(t.status)) ? 'done' : values.some(t => t.status === 'manual' || t.status === 'attention') ? 'action' : 'waiting';
  return out;
}
export async function processJob(ctx, job, state) {
  for (const [key, handler] of [['youtube', processYouTube], ['bilibili', processBili]]) {
    if (!job.spec[key]) continue;
    const target = state[key] ||= {}, manual = key === 'youtube' ? job.manualYT : job.manualBV;
    const retry = Boolean(job.retry && job.retry !== target.lastRetry);
    if (target.status === 'attention' && !(manual && manual !== target.id) && !retry) continue;
    if (retry) {
      target.failures = 0;
      target.lastRetry = job.retry;
    }
    try {
      if (key === 'youtube' && !ctx.google) throw new Error('请先用设置程序连接 YouTube 频道。');
      await handler({ ...ctx, spec: job.spec, manualYT: job.manualYT, manualBV: job.manualBV }, target);
      delete target.failures;
      delete target.message;
    } catch (e) {
      target.failures = (target.failures || 0) + 1;
      target.status = target.uncertain || target.failures >= 5 || (e.status >= 400 && e.status < 500 && ![401, 408, 429].includes(e.status)) || e.biliCode ? 'attention' : 'waiting';
      target.message = target.uncertain ? '投稿回执待确认，请到平台核对后关联已有视频。' : String(e.message || '平台连接失败').slice(0, 150);
    }
    await ctx.save();
  }
}
export async function run() {
  const store = new MediaRepo(process.env.GH_TOKEN), key = process.env.VIDEO_STATE_KEY;
  if (!key) throw new Error('缺少后台加密密钥');
  await store.verify(false);
  const all = await store.releases(), byTag = new Map(all.map(r => [r.tag_name, r]));
  const jobs = all.filter(r => r.tag_name.startsWith('studio-job-') && jsonBody(r).phase === 'queued');
  const credentials = JSON.parse(process.env.VIDEO_GOOGLE_CREDENTIALS || 'null');
  const google = credentials ? youtubeAPI(credentials) : null;
  const biliConfig = JSON.parse(process.env.VIDEO_BILI_CONFIG || 'null');
  const vault = biliConfig && byTag.get(biliConfig.vaultTag);
  const bili = vault ? biliClient({ read: async () => jsonBody(await store.get(vault.id)), write: data => store.update(vault.id, data) }, biliConfig) : null;
  const feed = new Map(JSON.parse(await readFile(feedURL, 'utf8')).map(row => [row.id, row]));
  let errors = 0;
  for (const release of jobs) {
    try {
      const job = jsonBody(release);
      validate(job);
      if (release.tag_name !== 'studio-job-' + job.workId) continue;
      const tag = 'studio-state-' + job.workId;
      const record = byTag.get(tag) || await store.create(tag, '分发进度 · ' + job.spec.title, {});
      const data = jsonBody(record), state = data.checkpoint ? unseal(data.checkpoint, key) : {};
      const save = () => store.update(record.id, { summary: summary(state), checkpoint: seal(state, key) });
      const controls = [job.manualBV, job.manualYT, job.retry].join('/');
      const mustCheck = !state.checkedAt || data.summary?.phase !== 'done' || state.controls !== controls || Date.now() - state.checkedAt > 24 * 3600000 || state.youtube?.status === 'scheduled';
      if (mustCheck) {
        const assets = await store.assets(release.id), video = matchAssets(job.video, assets), cover = job.cover && matchAssets(job.cover, assets);
        if (!video || job.cover && !cover || cover && cover.size > 2 * mb) throw new Error('原片或封面缺失');
        await processJob({ storage: store, google, bili, ownerChannel: credentials?.channelId, video, cover, save }, job, state);
        state.checkedAt = Date.now();
        state.controls = controls;
        await save();
      }
      const row = publicRecord(job, state, release.created_at);
      if (row) feed.set(row.id, row); else feed.delete('video-' + job.workId);
    } catch {
      errors++;
    }
  }
  await writeFile(feedURL, JSON.stringify([...feed.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)), null, 2) + '\n');
  console.log('检查了 ' + jobs.length + ' 条投稿。');
  if (errors) console.warn('其中 ' + errors + ' 条尚待处理，进度已保留。');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run().catch(e => {
  console.error('视频分发未完成。' + e.message);
  process.exitCode = 1;
});
