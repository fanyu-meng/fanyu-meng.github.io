# 视频发布台

打开 [网站发布台](https://fanyu-meng.github.io/studio/)。原片和封面保存在 [GitHub 私有原片仓库](https://github.com/fanyu-meng/video-publishing-studio/releases)。即使平台分发完成，原片仍然保留。网站首页只展示你勾选展示且已经公开的视频。

## 第一次连接

1. 在 [Google Auth Platform](https://console.cloud.google.com/auth/overview) 点 **Get started**。应用名可填「子鱼视频发布台」，支持邮箱和联系邮箱填自己的，个人账号的 Audience 选 **External**。若应用处于 Testing，在 **Audience → Test users** 加入自己的 YouTube 登录邮箱。
2. 启用 [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com)。在 **Clients → Create client → Desktop app** 下载客户端 JSON 到 Mac 的「下载」目录。已有 Web 客户端也支持，给它登记回调 `http://127.0.0.1:8765/oauth2callback`。授权范围为 YouTube 上传和读取频道。测试模式下 Google 的离线授权通常七天到期，长期自用可到 Audience 切换为 In production。
3. 在本机网站仓库的 `scripts/video-studio` 目录双击 **Connect.command**，用自己的 YouTube 频道完成授权。程序使用已登录的 GitHub CLI 建立或复用原片私库，在里面安装后台任务，并为个人网站配置一把仓库专用部署密钥以更新公开播放入口。它会把平台凭证写入私有仓库的 Actions Secrets。如果下载目录里有多个客户端文件，可以运行 `node scripts/video-studio/setup.mjs "/完整路径/client_secret.json"` 选择指定文件。
4. 在 Mac 上双击 **Studio.command** 就能通过 GitHub CLI 登录并打开发布页。也可以直接在网站打开「视频发布台」，使用仅授权给 `video-publishing-studio`、具有 **Contents** 和 **Actions** 读写权限的细粒度令牌。网页仅在本次页面会话的内存中使用令牌。[创建 GitHub 细粒度令牌](https://github.com/settings/personal-access-tokens/new?name=Video+Studio&target_name=fanyu-meng&contents=write&actions=write)

两个启动器需要 Node.js 22 或以上及已登录的 GitHub CLI。`node scripts/video-studio/setup.mjs --github-only` 可先开通 GitHub 原片存储和 B 站手动投稿。

## 发布一条视频

选视频和可选的 JPG/PNG 封面，写标题、简介、标签，选平台，点「上传并加入发布队列」。显示入队后即可关闭浏览器。YouTube 默认私享，也可以选择公开、不公开列出或定时公开。后台先核对平台状态，然后更新首页。各平台的回执独立保存，出现网络问题时按已确认的位置继续。GitHub 上传服务在浏览器中不可用时，可用 Mac 启动器继续，或从发布记录进入同一份 GitHub 草稿补齐附件。

GitHub 要求单个 Release 附件小于 2 GiB。较小的原片作为单个附件保存，更大的原片按 512 MiB 拆分，分别下载后按 part 编号拼接即可还原原文件。后台按字节读取这些附件。每次投稿会立即触发后台，另有每 6 小时一次的状态核对。需要提前刷新审核结果时，在发布记录里点「立即处理」。

B 站默认提供原片、封面、文案和创作中心入口。投稿后在发布记录里填入 BV 号，后台确认公开后自动加入同一条作品。拥有 B 站开放平台的 `ARC_BASE` 权限后，可为应用登记相同的本机回调，将 `client_id`、`client_secret` 保存到本机 JSON，然后运行 `node scripts/video-studio/setup.mjs --bilibili "/完整路径/bili.json"` 完成账号授权。后续新稿可在发布页选择分区并自动投递。
