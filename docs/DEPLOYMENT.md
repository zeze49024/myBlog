# 部署到 zeze49024.com

目标：Ubuntu 24.04，公网地址 `47.104.0.233`，SSH 用户 `admin`，端口 `22`。仅处理个人网站的这台新服务器，不覆盖其他网站或主机的配置。

## 当前实际部署 · 2026-10-22

**最终状态：服务器部署就绪，域名备案审核中，公网访问被阿里云阻断。** 最初公网 HTTPS 与后台功能检查曾通过，之后 HTTP 返回 `Non-compliance ICP Filing` 的 403 拦截页，HTTPS 连接也被重置。用户确认正在备案；保留服务与配置，等待备案完成后复验，不改变端口或绕过平台限制。

- 主页：<https://zeze49024.com/>；后台：<https://zeze49024.com/admin>。
- 实际采用原生 Node.js **24.22.1 + systemd + Nginx 1.24**，未使用 Docker。下方 Docker 操作作为替代方案保留。
- 官方 Linux x64 Node 发行包已核对官方 SHA-256：`6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6`。
- 应用运行时：`/opt/myblog-node/current/bin/node`。
- 应用代码：`/srv/myblog/releases/df6b9e3ba0a5`；`/srv/myblog/current` 指向当前版本。
- 独立无登录系统账号 `myblog` 运行应用，systemd 配置见 `deploy/myblog.service`；已启用开机启动。
- 数据：`/srv/myblog/data/site.sqlite`，属主 myblog，目录 700、文件 600；端口 `5180` 仅监听回环地址。
- 通过 SQLite 一致性备份迁移本机的 5 个项目、3 篇草稿、资料及站长密码哈希。迁移文件清除了会话与限流数据，未传输密码明文。迁移前的云端初始库保存在 `/srv/myblog/backups/pre-migration-20261022/`。
- Nginx 独立配置：`/etc/nginx/sites-available/myblog`。HTTP 跳转 HTTPS，ACME 校验路径单独保留用于续期。
- 阿里云 DNS 新增根域名 `@` A 记录 → `47.104.0.233`，TTL 600 秒；未修改其他域名。
- Let's Encrypt 证书位于 `/etc/letsencrypt/live/zeze49024.com/`，当前有效期至 2027-01-20；certbot.timer 和续期后 Nginx reload hook 已配置。
- 续期模拟因阿里云备案阻断 ACME HTTP 校验返回 403 而失败。备案通过后运行 `sudo certbot renew --dry-run --no-random-sleep-on-renew --cert-name zeze49024.com` 重新验收。不能将“已配置自动续期”理解为当前续期校验已通过。
- 生产环境没有明文初始密码配置；账号验证使用迁移到服务器的 scrypt 哈希。不要将生产数据库、证书私钥或会话信息上传 GitHub。

运维：`sudo systemctl status myblog`、`sudo journalctl -u myblog`、`sudo nginx -t`。

本次为一次性数据迁移。以后在云端后台更新内容，本机与云端数据库不自动同步。

## 先决条件

- 已通过用户提供的服务器公钥指纹核实 SSH 主机身份，并将本机站点专用公钥加入 `admin` 的 authorized_keys。
- 服务器上已准备 Docker Engine、Compose、Nginx 与域名 HTTPS 证书。仓库提供配置，但不在未核实环境上自动覆盖系统文件。
- 域名解析、网络放行和 HTTPS 配置完成后再对外开放后台。

## 首次部署

1. 将仓库放在 `/srv/myblog/app`，不要将数据库放在代码仓库或静态目录内。
2. 创建 `/srv/myblog/data`，使容器中的 node 用户（UID 1000）拥有读写权限，目录权限设为 700。
3. 在仓库目录运行 `sudo docker compose -f deploy/compose.yaml up -d --build`。
4. 使用标准输入初始化站长密码：`sudo docker compose -f deploy/compose.yaml exec -T app node scripts/init-admin.mjs`。该命令从 stdin 读取密码直到 EOF；实际操作时通过安全的交互输入或部署工具管道传入，不把密码放到命令行参数、日志、Git、Compose 或环境文件中。
5. 使用独立文件安装 `deploy/nginx.conf.example`，先将证书路径替换为真实路径；执行 `sudo nginx -t` 成功后再 reload。不要替换其他站点的配置。
6. 验证健康检查、HTTPS、公开主页、站长登录、退出、文章草稿和发布。确认 Cookie 含 Secure、HttpOnly、SameSite=Strict。

应用容器仅映射 `127.0.0.1:5180`，不会将 Node 端口直接暴露公网。外部请求经 Nginx HTTPS 进入。反向代理必须覆写 X-Forwarded-For，而非信任外部自带的头。

## 不使用 Docker

安装 Node.js 24.13+，运行 `npm ci && npm run build`，设置以下服务环境，并使用 systemd 等进程管理器运行 `node server/index.js`：

```ini
NODE_ENV=production
HOST=127.0.0.1
PORT=5180
APP_ORIGIN=https://zeze49024.com
DATA_DIR=/srv/myblog/data
```

用同样的环境执行 `scripts/init-admin.mjs`，同样经 Nginx 提供 HTTPS。密码不放入上述配置。

## 升级、备份与恢复

- 升级前记录当前提交，并使用 SQLite 一致性备份 API 或在停止服务后备份整个数据目录；不能在写入时只复制主 sqlite 文件而忽略 WAL。
- 更新代码后重新构建/启动，数据卷保持独立，不会重置管理员、文章或资料。
- 备份文件包含密码哈希、会话信息和草稿，应作为私有服务端文件保存，不上传公开 GitHub。
- 恢复时停止服务，恢复完整数据目录与所有者权限，再启动并检查。
- `admin:init -- --reset` 是本地 npm 形式的重设命令；容器使用 `node scripts/init-admin.mjs --reset`。重设时清除全部会话。

## 当前验收范围

本次已完成真实服务器部署，最终公网可访问性等待备案通过，结果见 `docs/VALIDATION.md`。未来修改配置或切换部署方案仍需重新验证，不以配置文件存在代替实际执行结果。
