# GitHub Pages 空白页问题排查指南

## 可能的原因和解决方案

### 1. 确认 GitHub Pages 部署源设置

**问题**: GitHub Pages 可能还在使用 "Deploy from a branch" 而不是 "GitHub Actions"

**解决步骤**:
1. 进入仓库 Settings → Pages
2. 在 "Build and deployment" 部分
3. 确保 "Source" 选择的是 **"GitHub Actions"**（不是 "Deploy from a branch"）
4. 保存设置

### 2. 检查 GitHub Actions 部署状态

**步骤**:
1. 进入仓库的 "Actions" 标签页
2. 查看 "Deploy to GitHub Pages" workflow
3. 确认部署是否成功（绿色 ✓）
4. 如果失败，查看错误日志

### 3. 检查浏览器控制台错误

**步骤**:
1. 打开网站 `https://fanyu-meng.github.io/`
2. 按 F12 打开开发者工具
3. 查看 Console 标签页是否有错误
4. 查看 Network 标签页，确认资源是否加载成功

**常见错误**:
- `404 Not Found` - 资源路径问题
- `CORS error` - 跨域问题
- `SyntaxError` - JavaScript 语法错误
- `Module not found` - 模块导入问题

### 4. 验证构建输出

**本地测试**:
```bash
npm run build
npm run preview
```

访问 `http://localhost:4173` 查看本地预览是否正常

### 5. 检查资源路径

构建后的 HTML 中资源路径应该是：
- `/assets/index-xxx.js`
- `/assets/index-xxx.css`

如果路径不正确，检查 `vite.config.ts` 中的 `base` 配置

### 6. 清除浏览器缓存

有时浏览器缓存可能导致问题：
- 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新
- 或在开发者工具中右键刷新按钮选择 "清空缓存并硬性重新加载"

### 7. 检查 GitHub Pages 部署日志

在 GitHub Actions 的部署日志中查找：
- 构建是否成功
- 是否有错误信息
- 部署的文件列表

## 快速诊断命令

```bash
# 本地构建测试
npm run build

# 本地预览
npm run preview

# 检查构建输出
ls -la dist/
ls -la dist/assets/
```

## 如果以上都正常但仍空白

1. **检查 JavaScript 控制台**: 可能有运行时错误
2. **检查网络请求**: 确认所有资源都成功加载
3. **检查 React 组件**: 可能有组件渲染错误
4. **查看 GitHub Actions 日志**: 确认部署过程没有错误

## 联系支持

如果问题仍然存在，请提供：
1. 浏览器控制台的错误信息
2. GitHub Actions 的部署日志
3. Network 标签页的资源加载情况

