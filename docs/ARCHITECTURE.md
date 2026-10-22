# 实现说明

## 技术栈与目录

公开主页与管理后台使用相同的 Vite、原生 JavaScript、Tailwind CSS 4、Lucide 与 Simple Icons。沿用确认的 UI；`ui-design/` 保留最初的独立设计，`web/` 为正式前端。后端使用 Node.js 24.13+、Express 5、Helmet 与 Node 内置 SQLite。

| 入口 | 用途 |
| --- | --- |
| `/` | 个人主页、项目展示、已发布博客与阅读弹窗 |
| `/admin` | 管理员登录、概览、项目、博客、个人资料 |
| `/api/site` | 只读公开内容，只返回已发布内容 |
| `/api/auth/*` | 登录、会话检查、退出 |
| `/api/admin/*` | 服务端验证登录后的内容管理 |

数据库位于 `DATA_DIR/site.sqlite`，默认 `data/site.sqlite`。仅 `dist/` 可以静态访问；数据库、配置文件与服务器源码均不在 Web 根目录。数据库及环境配置已加入 Git 忽略列表。

## 账号和会话

只有一个站长账号 `zeze49024`。数据库约束只允许一条管理员记录；没有注册、找回密码或额外用户创建 API。

初始化命令仅通过标准输入接收密码。密码用 scrypt（N=131072、r=8、p=1、随机 32 字节盐、64 字节派生密钥）计算哈希。服务器数据库只保存算法参数、盐和哈希，不保存明文，也不把哈希发送到浏览器。校验使用常量时间比较。

登录成功后生成随机会话，浏览器通过 HttpOnly、SameSite=Strict Cookie 携带，服务端只保存会话令牌的 SHA-256 摘要。有效期为 12 小时，退出立即撤销；重置密码时撤销所有会话。生产模式强制 HTTPS Origin 与 Secure `__Host-` Cookie。

写入请求必须匹配配置的 APP_ORIGIN，并附带当前会话的 CSRF Token；没有跨站 CORS 授权。失败登录按 IP 进行 15 分钟 5 次限制，另有总量和同时哈希数量限制；计数存储在 SQLite。生产环境依赖仅监听回环地址的反向代理，Nginx 覆写客户端转发头。

参考：[Node scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback)、[OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)、[OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)。

## 内容工作流

- 项目：新建、编辑、排序、标签、分类、配色、卡片概念视觉、GitHub 仓库与补充仓库、发布和取消发布、删除。
- 博客：新建、编辑、分类、摘要、日期、阅读时间、图标配色、段落正文、草稿/发布、删除。
- 正文使用纯文本和 `## 标题` 段落格式，前端将内容转义后显示，不执行 HTML，也不加载任意脚本。
- 个人资料：昵称、所在地、简介、B 站主页、页脚。GitHub 账号固定为站长账号，头像沿用已提供的图片。
- 保存立即进入 SQLite；公开页面下次加载时读取最新已发布内容，无需重建前端。后台有搜索、状态筛选、概览统计和实际操作记录。
- 所有修改携带 revision，其他窗口已经保存时拒绝覆盖，返回 409，避免静默丢失内容。
- 初始化时项目公开，三篇原型文章为私有草稿，不将示例文字冒充正式发表文章。没有已发表文章时显示博客空状态。

## 不在本次实现范围

图片上传、富文本/Markdown 扩展渲染、评论、访客账号、访问统计、自动抓取 GitHub、在线修改密码。当前管理界面不提供这些入口。可由拥有服务器权限的站长通过初始化脚本的 `--reset` 重设密码。
