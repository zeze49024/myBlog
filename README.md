# zeze49024 · 个人网站

个人介绍、公开项目展示与博客。计划域名：`zeze49024.com`。

## 已确认需求

- 简体中文、单页滚动，展示昵称 zeze49024、用户提供的头像与所在地山东省济南市，不展示职业。
- 黑白灰为主，少量彩色强调；默认浅色，支持手动切换深色；丰富且尊重减少动态效果设置的动效。
- 项目入口直接跳转 GitHub 仓库；整理全部公开仓库，私有仓库不公开披露。
- 第一期包含博客区。
- 使用 SVG 社交平台 Logo；接入 B 站主页并预留更多渠道。
- 根目录 `ui-design/` 保存第一版 Tailwind CSS 交互原型、设计说明与预览截图。

## 当前阶段

第一版 Tailwind CSS 交互原型已完成，源码位于 `ui-design/`。先进行 UI 评审，暂不部署服务器或修改 DNS。

用户提供的头像仅用于此个人网站。原型中项目界面与博客示例会明确标注为演示内容。

## 预览

直接用现代浏览器打开 [`ui-design/preview.html`](ui-design/preview.html)，无需安装依赖或联网加载资源。

开发和构建（Node.js 22.12+ 或受 Vite 支持的新版本）：

```powershell
npm ci
npm run dev
```

开发地址：<http://127.0.0.1:5173/>。

```powershell
npm run build
npm run preview
```

构建结果为 `dist/`，同时重新生成独立预览 `ui-design/preview.html`。正式网站构建不依赖 Tailwind CDN。

## 文件入口

- `ui-design/DESIGN.md`：视觉方向、设计规范与交互说明。
- `ui-design/CONTENT-SOURCES.md`：公开仓库与项目简介依据。
- `ui-design/QA.md`：实际验证范围与当前限制。
- `ui-design/previews/`：桌面浅色、桌面深色、手机与博客阅读截图。
- `ui-design/src/content.js`：项目和博客内容。
- `ui-design/src/main.js`：页面和交互。
- `ui-design/src/style.css`：Tailwind CSS 入口与自定义视觉样式。

博客目前为一篇设计草稿及两篇明确标注的示例，未接入后台、评论或文章发布服务。项目卡片跳转真实仓库；卡片内界面为 CSS 设计示意。GitHub Profile 作为辅助仓库展示，待办安装包仓库作为 myToDoList 的补充入口。
