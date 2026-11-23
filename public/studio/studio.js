import { MediaRepo, repoURL, mb, assetPlan, matchAssets, jsonBody, uuidOK } from './github.js';
const local = location.origin === 'http://127.0.0.1:8784';
const el = id => document.getElementById(id);
const note = (id, text, error = false) => {
  const n = el(id);
  n.textContent = text;
  n.classList.toggle('error', error);
};
const states = { queued: '已入队', uploading: '待完成上传', waiting: '等待平台处理', action: '需要你处理', done: '已完成', manual: '待在创作中心投稿', submitted: '平台审核或处理中', public: '已公开', private: '私享', unlisted: '不公开列出', scheduled: '已安排公开', attention: '需要处理' };
let storage, biliAPI = false, ready = false, youtubeReady = false, busy = false, activeRelease = null;
const text = (tag, value, cls) => {
  const n = document.createElement(tag);
  n.textContent = value || '';
  if (cls) n.className = cls;
  return n;
};
function link(url, label) {
  const a = text('a', label);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function button(label, fn) {
  const n = text('button', label, 'outline');
  n.type = 'button';
  n.onclick = async () => {
    n.disabled = true;
    try {
      await fn();
    } catch (e) {
      note('list-message', explain(e), true);
    } finally {
      n.disabled = false;
    }
  };
  return n;
}
function explain(e) {
  if (e.status === 401 || e.status === 403) return 'GitHub 拒绝了连接，请检查令牌是否能读写原片私库的 Contents 和 Actions。';
  if (e.status === 404) return '找不到私有仓库或后台工作流，请检查首次设置及令牌授权。';
  return e.message || '连接失败，请重试。';
}
function optionsUI() {
  el('yt-options').hidden = !el('youtube').checked;
  el('bili-options').hidden = !el('bilibili').checked;
  el('time-wrap').hidden = el('privacy').value !== 'scheduled';
  el('time').required = el('youtube').checked && !el('time-wrap').hidden;
  el('yt-note').hidden = youtubeReady;
  el('yt-note').textContent = '频道尚未连接。你可以先存入原片，完成 YouTube 授权后开始分发。';
  el('tid-wrap').hidden = el('original-wrap').hidden = !biliAPI;
  el('bili-note').textContent = biliAPI ? '通过 B 站开放平台投稿。' : '使用创作中心手动投稿。发布记录里可以复制文案、打开原片、填写 BV 号。';
}
for (const id of ['youtube', 'bilibili', 'privacy']) el(id).onchange = optionsUI;
el('video').onchange = () => {
  if (!el('title').value && el('video').files[0]) el('title').value = el('video').files[0].name.replace(/\.[^.]+$/, '').slice(0, 79);
};
function readForm() {
  const video = el('video').files[0], cover = el('cover').files[0], yt = el('youtube').checked, bi = el('bilibili').checked;
  const title = el('title').value.trim(), description = el('description').value.trim(), tags = el('tags').value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  const privacy = el('privacy').value, time = yt && privacy === 'scheduled' ? new Date(el('time').value) : null;
  if (!video?.size || !title || !(yt || bi)) throw new Error('请选择视频、填写标题，并选择至少一个平台。');
  if (yt && /[<>]/.test(title + description)) throw new Error('YouTube 标题和简介不能含尖括号');
  if (time && !(time > Date.now())) throw new Error('请选择将来的公开时间');
  if (cover && (!['image/jpeg', 'image/png'].includes(cover.type) || !cover.size || cover.size > 2 * mb)) throw new Error('请选择 2 MB 以内的 JPG 或 PNG 封面');
  const tid = Number(el('tid').value);
  if (bi && biliAPI && (Array.from(title).length > 79 || Array.from(description).length > 249 || !tags.length || Array.from(tags.join(',')).length > 199 || !Number.isSafeInteger(tid) || tid < 1 || !el('original').checked)) throw new Error('B 站自动投稿需要分区、自制确认及标签，标题最多 79 字，简介最多 249 字，标签总长最多 199 字。');
  const spec = { version: 1, title, description, tags, showSite: el('show-site').checked, youtube: yt ? { privacy, publishAt: time?.toISOString() || '', kids: el('kids').checked } : null, bilibili: bi ? { mode: biliAPI ? 'api' : 'manual', tid } : null };
  return { files: { video, cover }, request: { schema: 1, phase: 'uploading', workId: crypto.randomUUID(), spec, video: assetPlan(video, 'video'), cover: cover ? assetPlan(cover, 'cover') : null } };
}
async function dispatch() {
  if (!ready) return '原片已保存在 GitHub 私库，可以关闭页面。完成首次设置后，后台会处理已入队的视频。';
  try {
    await storage.dispatch();
    return '后台已启动，可以关闭页面。';
  } catch {
    return '已安全入队。可点「立即处理」，或等后台下一次检查。';
  }
}
async function enqueue(release, request) {
  const assets = await storage.assets(release.id);
  if (!matchAssets(request.video, assets) || request.cover && !matchAssets(request.cover, assets)) throw new Error('原片或封面尚未完整上传，请核对附件。');
  await storage.update(release.id, { ...request, phase: 'queued' });
  return dispatch();
}
function nativeLink(release) {
  const url = new URL(release.html_url);
  return url.origin === 'https://github.com' && url.pathname.startsWith('/fanyu-meng/video-publishing-studio/') ? url.href : repoURL + '/releases';
}
async function submit(e) {
  e.preventDefault();
  if (!storage || busy) return;
  let release;
  try {
    const { request, files } = readForm();
    busy = true;
    el('send').disabled = true;
    el('progress').hidden = false;
    el('progress').value = 0;
    note('message', '正在保存私有投稿草稿…');
    release = await storage.create('studio-job-' + request.workId, request.spec.title, request);
    activeRelease = release;
    const total = request.video.size + (request.cover?.size || 0);
    let sent = 0;
    for (const role of ['video', 'cover']) {
      const plan = request[role], file = files[role];
      if (!plan) continue;
      let cursor = 0;
      for (const part of plan.pieces) {
        await storage.upload(release.id, part.name, file.slice(cursor, cursor + part.size, plan.mimeType), n => {
          const pct = Math.floor((sent + n) / total * 100);
          el('progress').value = pct;
          note('message', '上传到 GitHub ' + pct + '% · 入队前请保持页面打开');
        });
        cursor += part.size;
        sent += part.size;
      }
    }
    note('message', await enqueue(release, request));
    activeRelease = null;
    el('publish').reset();
    optionsUI();
  } catch (err) {
    note('message', release ? '已保留私有草稿。打开下方发布记录，可上传缺少的附件或核对后入队。' : explain(err), true);
  } finally {
    busy = false;
    el('send').disabled = false;
    el('progress').hidden = true;
    if (storage) await list().catch(err => note('list-message', explain(err), true));
  }
}
el('publish').onsubmit = submit;
window.addEventListener('beforeunload', e => {
  if (busy) {
    e.preventDefault();
    e.returnValue = '';
  }
});
function statusText(v) {
  return states[v] || v || '等待处理';
}
async function details(release, panel, progress) {
  if (panel.childElementCount) {
    panel.replaceChildren();
    return;
  }
  const request = jsonBody(await storage.get(release.id)), s = request.spec;
  const area = text('textarea');
  area.readOnly = true;
  area.rows = 3;
  area.setAttribute('aria-label', '投稿文案');
  area.value = [s.title, s.description, s.tags.join('，')].filter(Boolean).join('\n\n');
  panel.append(area);
  const actions = text('div', '', 'actions');
  panel.append(actions);
  for (const [label, value] of [['复制标题', s.title], ['复制简介', s.description], ['复制标签', s.tags.join(',')]]) if (value) actions.append(button(label, () => navigator.clipboard.writeText(value)));
  actions.append(link(nativeLink(release), '打开 GitHub 原片与封面'));
  if (request.phase === 'uploading') {
    panel.append(text('p', '浏览器上传中断时，在 GitHub 草稿里用 Edit 上传缺少的附件并保存草稿，再回来核对。需要的附件名：' + [...request.video.pieces, ...(request.cover?.pieces || [])].map(x => x.name).join('、'), 'hint'));
    for (const [role, caption] of [['video', '原片'], ['cover', '封面']]) {
      const plan = request[role];
      if (!plan) continue;
      const label = text('label', '继续上传' + caption), input = text('input');
      input.type = 'file';
      label.append(input);
      panel.append(label);
      panel.append(button('补传' + caption + '缺少的分片', async () => {
        const file = input.files[0];
        if (!file || file.size !== plan.size || file.name !== plan.name) throw new Error('请选回本次投稿的同一个文件');
        const known = await storage.assets(release.id);
        if (matchAssets(plan, known)) {
          note('list-message', caption + '已经完整上传');
          return;
        }
        let cursor = 0;
        busy = true;
        try {
          for (const piece of plan.pieces) {
            const exists = known.find(a => a.name === piece.name);
            if (exists?.state === 'uploaded' && exists.size !== piece.size) throw new Error('同名附件大小不同，请先到 GitHub 草稿中核对。');
            if (exists?.state === 'starter' && exists.size === 0) await storage.removeFailedAsset(exists.id);
            if (exists?.state !== 'uploaded') await storage.upload(release.id, piece.name, file.slice(cursor, cursor + piece.size, plan.mimeType), n => note('list-message', '补传 ' + Math.floor((cursor + n) / plan.size * 100) + '%'));
            cursor += piece.size;
          }
          note('list-message', caption + '已补齐，可以核对并入队。');
        } finally {
          busy = false;
        }
      }));
    }
    panel.append(button('核对附件并入队', async () => {
      const message = await enqueue(release, request);
      await list();
      note('list-message', message);
    }));
    return;
  }
  if (s.bilibili) actions.append(link('https://member.bilibili.com/platform/upload/video/frame', '打开 B 站创作中心'));
  for (const [k, name, field] of [['bilibili', 'B 站', 'manualBV'], ['youtube', 'YouTube', 'manualYT']]) {
    const t = progress[k];
    if (t?.message) panel.append(text('p', name + ' · ' + t.message, 'hint'));
    if (!s[k] || k === 'youtube' && t?.status !== 'attention' || t?.status === 'public') continue;
    const input = text('input');
    input.placeholder = k === 'bilibili' ? 'BV 号或完整 B 站视频链接' : 'YouTube 视频 ID 或链接';
    input.setAttribute('aria-label', input.placeholder);
    panel.append(input, button('关联' + name + '视频', async () => {
      const value = input.value.trim();
      const id = k === 'bilibili' ? value.match(/^(?:https?:\/\/(?:www\.)?bilibili\.com\/video\/)?(BV[0-9a-zA-Z]{10})(?:[/?#].*)?$/)?.[1] : value.match(/^(?:https:\/\/(?:(?:www\.)?youtube\.com\/watch\?v=|youtu\.be\/))?([\w-]{11})(?:[?&#].*)?$/)?.[1];
      if (!id) throw new Error('请输入有效的视频编号或完整链接');
      const latest = jsonBody(await storage.get(release.id));
      await storage.update(release.id, { ...latest, [field]: id });
      note('list-message', await dispatch());
    }));
  }
  actions.append(button('立即处理', async () => {
    const latest = jsonBody(await storage.get(release.id));
    await storage.update(release.id, { ...latest, retry: crypto.randomUUID() });
    note('list-message', await dispatch());
  }));
}
async function list() {
  const all = await storage.releases(), jobs = all.filter(r => r.tag_name?.startsWith('studio-job-') && uuidOK(jsonBody(r).workId));
  const statesByTag = new Map(all.map(r => [r.tag_name, jsonBody(r).summary || {}]));
  el('jobs').replaceChildren();
  note('list-message', jobs.length ? '' : '暂无投稿。');
  for (const r of jobs) {
    const j = jsonBody(r), p = statesByTag.get('studio-state-' + j.workId) || {}, row = text('article', '', 'job'), panel = text('div');
    row.append(text('h3', j.spec.title), text('p', new Date(r.created_at).toLocaleString() + ' · ' + statusText(p.phase || j.phase), 'hint'));
    for (const [k, label] of [['youtube', 'YouTube'], ['bilibili', 'B 站']]) if (p[k]) row.append(text('p', label + ' · ' + statusText(p[k].status)));
    row.append(button('投稿资料与进度', () => details(r, panel, p)), panel);
    el('jobs').append(row);
    if (activeRelease?.id === r.id) await details(r, panel, p);
  }
}
el('refresh').onclick = () => list().catch(e => note('list-message', explain(e), true));
el('signin').onclick = async () => {
  if (storage) {
    if (busy) return;
    storage = null;
    el('jobs').replaceChildren();
    el('desk').hidden = true;
    el('token-label').hidden = false;
    el('signin').textContent = '连接私有仓库';
    note('connect-note', '已退出发布台');
    return;
  }
  const value = el('token').value.trim();
  if (!local && !value) {
    el('token').focus();
    return;
  }
  const client = new MediaRepo(value, local);
  el('signin').disabled = true;
  try {
    await client.verify();
    const cfg = await client.call('/contents/studio-config.json');
    const settings = JSON.parse(atob(cfg.content));
    biliAPI = settings.bili === true;
    ready = settings.ready === true;
    youtubeReady = settings.youtube === true;
    storage = client;
    el('token').value = '';
    el('token-label').hidden = true;
    el('desk').hidden = false;
    el('signin').textContent = '断开连接';
    note('connect-note', local ? '已通过此 Mac 的 GitHub 登录连接原片私库。' : '已连接原片私库。令牌仅在当前页面内存中使用。');
    optionsUI();
    await list();
  } catch (err) {
    note('connect-note', explain(err), true);
  } finally {
    el('signin').disabled = false;
  }
};
optionsUI();

if (local) {
  el('token-label').hidden = true;
  el('signin').click();
}
