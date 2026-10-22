# zeze49024 · 个人网站

个人介绍、公开项目展示与博客，以及仅站长可登录的内容管理后台。

- 云端主页：<https://zeze49024.com/>
- 云端后台：<https://admin.zeze49024.com/>（原 `/admin` 自动跳转）

2026-10-22 已部署至独立 Ubuntu 云服务器，并分离后台子域名。**域名正在备案，后台浏览器登录已验证，但部分网络请求仍遭阿里云备案拦截，稳定公网访问需在审核通过后复验。** 后续正式内容在云端后台维护；本机和云端数据库各自独立，不自动同步。

前端使用 Vite、JavaScript、Tailwind CSS 4、Lucide 和 Simple Icons，沿用已确认的第一版 UI；后端使用 Node.js、Express 和 SQLite。

## 本机运行

要求 Node.js **24.13 或更高版本**。此工作区已初始化站长账号：

```powershell
npm ci
npm run build
npm start
```

- 主页：<http://127.0.0.1:5180/>
- 后台：<http://127.0.0.1:5180/admin>
- 账号：`zeze49024`，使用站长指定的密码。密码明文与哈希都不包含在仓库里。

开发模式运行 `npm run dev`，打开 <http://127.0.0.1:5173/> 或 <http://127.0.0.1:5173/admin>。它同时启动 Vite、API 和同源代理。勿与 `npm start` 同时占用 5180 端口。

## 新服务器初始化

克隆仓库不包含本机数据库，必须单独初始化。PowerShell 7 下可使用隐藏输入，避免密码字面量进入命令历史：

```powershell
$sitePassword = Read-Host '站长密码' -MaskInput
$sitePassword | npm run admin:init
Remove-Variable sitePassword
```

命令只允许固定账号 `zeze49024`。密码用随机盐和 scrypt 哈希存入服务端 `DATA_DIR/site.sqlite`。没有注册入口。重复初始化会拒绝，显式加 `--reset` 可重设并撤销全部会话。

生产模式强制 HTTPS、安全 Cookie 和配置的同源来源。Linux/容器操作见 [部署说明](docs/DEPLOYMENT.md)。

## 功能

- 主页：个人介绍、项目展示与类型筛选、已发布博客阅读、深浅主题、滚动与悬浮动效、SVG 社交入口。
- 概览：项目、已发布文章、草稿的真实数量与最近操作。
- 项目管理：新建/编辑/删除、分类标签、排序、配色、GitHub 仓库和补充入口、草稿/发布。
- 博客管理：新建/编辑/删除、正文段落、摘要、分类、日期、阅读时间、图标、草稿/发布。
- 站点资料：昵称、所在地、个人介绍、B 站主页、页脚文字。

后台保存立即持久化，公开主页下次加载读取最新已发布内容，不用重新构建。初始三篇原型文章为私有草稿；正文为纯文本，用 `## 标题` 分段，不执行 HTML。

## 目录与命令

| 目录 | 用途 |
| --- | --- |
| `web/` | 正式主页与后台前端 |
| `server/` | 鉴权、内容接口、校验、SQLite、初始内容 |
| `data/` | 本机私有数据库，已忽略，不进入 Git |
| `tests/` | 鉴权与内容工作流测试 |
| `deploy/` | 独立 Docker Compose、Nginx 配置 |
| `docs/` | 实现、部署、验收说明与截图 |
| `ui-design/` | 保留最初确认的设计原型 |

```powershell
npm test
npm run format
```

`npm run build:design` 仅更新原始设计的单文件预览。正式主页和后台需要服务端，不能以双击 HTML 的方式运行。

## 数据与部署

数据库、环境配置和 SSH 私钥不进入 GitHub。详情见 [实现说明](docs/ARCHITECTURE.md)、[部署说明](docs/DEPLOYMENT.md) 与 [实际验收范围](docs/VALIDATION.md)。

本机实现与云服务器部署均已完成。公网首轮 HTTPS、登录、写入、退出和访问控制检查通过后，云平台因备案审核中阻断访问；最终公网验收需等待备案通过。运行记录和部署方式见上述说明。
