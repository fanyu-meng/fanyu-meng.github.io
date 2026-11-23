import test from 'node:test';
import assert from 'node:assert/strict';
import { assetPlan, matchAssets, MediaRepo, mb } from '../../public/studio/github.js';
import { validate, publicRecord, processJob } from './worker.mjs';
import { googleScopes, processYouTube } from './youtube.mjs';
import { seal, unseal } from './bilibili.mjs';

const id = 'e9c7b9a3-ee37-43af-9aa0-1767d50adf2e';
const yt = 'videoabc123', bv = 'BV1VWe56XEd6';
function job() {
  return { schema: 1, workId: id, spec: { version: 1, title: '演奏', description: '简介', tags: ['吉他'], showSite: true, youtube: { privacy: 'public' }, bilibili: { mode: 'manual', tid: 59 } } };
}
test('原片按 GitHub 附件上限拆分，只有完整对应的附件可以入队', async () => {
  const big = assetPlan({ name: 'solo.mov', size: 2048 * mb, type: 'video/quicktime' }, 'video');
  assert.deepEqual(big.pieces.map(p => p.size), Array(4).fill(512 * mb));
  const pieces = big.pieces.map((p, i) => ({ ...p, id: i + 10, state: 'uploaded' }));
  assert.equal(matchAssets(big, pieces.slice(0, 3)), null);
  assert.equal(matchAssets(big, pieces).size, big.size);
  const repo = new MediaRepo('unit-test');
  const src = { assets: [{ id: 1, size: 2 }, { id: 2, size: 3 }] };
  repo.sliceAsset = async (a, s, e) => Uint8Array.from(a.id === 1 ? [0, 1] : [2, 3, 4]).slice(s, e + 1);
  assert.deepEqual([...await repo.range(src, 1, 3)], [1, 2, 3]);
});
test('授权只涉及 YouTube；私享、不公开列出和审核中的链接不会进入首页', () => {
  assert.deepEqual(googleScopes.map(v => v.split('/').pop()), ['youtube.upload', 'youtube.readonly']);
  const j = job();
  validate(j);
  for (const status of ['private', 'unlisted', 'submitted', 'scheduled']) assert.equal(publicRecord(j, { youtube: { id: yt, status, live: false } }, 'now'), null);
  const row = publicRecord(j, { youtube: { id: yt, live: true }, bilibili: { id: bv, live: true } }, 'now');
  assert.deepEqual(Object.keys(row).sort(), ['bilibili', 'createdAt', 'id', 'summary', 'title', 'youtube']);
  j.spec.showSite = false;
  assert.equal(publicRecord(j, { youtube: { id: yt, live: true } }, 'now'), null);
});
test('YouTube 遇到丢失的最终回执先查会话；再次运行不会重复上传，B 站可独立等待手动投稿', async () => {
  const j = job(), s = {}, requests = [], source = { size: 4, mimeType: 'video/mp4' };
  let finalized = false, saves = 0;
  const google = {
    async request(url, opts) {
      requests.push([url, opts.headers['Content-Range']]);
      if (url.includes('/videos?')) return new Response(null, { headers: { Location: 'https://www.googleapis.com/upload/session' } });
      if (opts.headers['Content-Range'] === 'bytes */4') return finalized ? Response.json({ id: yt }) : new Response(null, { status: 308 });
      finalized = true;
      throw new TypeError('网络中断');
    },
    async json() {
      return { items: [{ status: { privacyStatus: 'public', uploadStatus: 'processed' } }] };
    }
  };
  const ctx = {
google, ownerChannel: 'C', storage: { range: async () => new Uint8Array(4) }, video: source, cover: null, bili: null, save: async () => {
      saves++;
    }
};
  await processJob(ctx, j, s);
  assert.equal(s.bilibili.status, 'manual');
  assert.equal(s.youtube.status, 'waiting');
  await processJob(ctx, j, s);
  await processJob(ctx, j, s);
  assert.equal(s.youtube.id, yt);
  assert.equal(s.youtube.live, true);
  assert.ok(saves > 2);
  assert.equal(requests.filter(([u]) => u.includes('uploadType=resumable')).length, 1);
  assert.equal(requests.filter(([, r]) => r === 'bytes 0-3/4').length, 1);
});
test('过期的最终回执必须人工关联；B 站断点加密后能在下一次后台任务恢复', async () => {
  const target = { session: 'https://www.googleapis.com/upload/session', finalSent: true };
  await assert.rejects(processYouTube({ google: { request: async () => new Response(null, { status: 410 }) }, video: { size: 8 }, save: async () => { } }, target));
  assert.equal(target.uncertain, true);
  const original = { bilibili: { uploadToken: 'fixture-token', parts: 12 } };
  const encrypted = seal(original, 'test secret');
  assert.ok(!JSON.stringify(encrypted).includes('fixture-token'));
  assert.deepEqual(unseal(encrypted, 'test secret'), original);
});
