# 公众号二维码设置说明

## 如何添加公众号二维码

1. **准备二维码图片**
   - 从截图或微信公众平台下载你的公众号二维码
   - 建议使用 PNG 格式，尺寸至少 256x256 像素

2. **保存图片**
   - 将二维码图片保存为 `wechat-qrcode.png`
   - 放到 `public/` 目录下
   - 完整路径应该是：`public/wechat-qrcode.png`

3. **验证**
   - 运行 `npm run dev` 启动开发服务器
   - 访问网站，点击"科普文章"卡片中的"公众号"按钮
   - 应该会弹出对话框显示二维码

## 注意事项

- 图片文件名必须是 `wechat-qrcode.png`
- 图片必须放在 `public/` 目录下
- 如果图片不存在，会显示占位符图片
- 建议使用正方形图片，尺寸在 256x256 到 512x512 之间

## 文件结构

```
public/
  ├── wechat-qrcode.png  ← 将二维码图片放在这里
  ├── favicon.ico
  ├── placeholder.svg
  └── robots.txt
```

