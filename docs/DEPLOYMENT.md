# 部署到 zeze49024.com

目标：Ubuntu 24.04，公网地址 `47.104.0.233`，SSH 用户 `admin`，端口 `22`。仅处理个人网站的这台新服务器，不覆盖其他网站或主机的配置。

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

以 `docs/VALIDATION.md` 和最终交付信息为准。提供部署配置不代表已在远程执行；没有取得 SSH 访问、域名与证书前，不宣称服务器已上线。
