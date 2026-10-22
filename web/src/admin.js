import "./theme.js";
import "./style.css";
import "./admin.css";
import {
  createIcons,
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Settings2,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  X,
  Check,
  ChevronRight,
  ShieldCheck,
  LockKeyhole,
  FileText,
  CircleCheck,
  Clock3,
  Download,
  Menu,
  ExternalLink,
} from "lucide";
import { escapeHTML as e } from "./safe.js";

const homeUrl =
  location.hostname === "admin.zeze49024.com" ? "https://zeze49024.com/" : "/";

const icons = {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Settings2,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  X,
  Check,
  ChevronRight,
  ShieldCheck,
  LockKeyhole,
  FileText,
  CircleCheck,
  Clock3,
  Download,
  Menu,
  ExternalLink,
};
const i = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const app = document.querySelector("#admin-app");
const state = {
  session: null,
  data: null,
  page: "overview",
  query: "",
  filter: "all",
  editor: null,
};
const pages = {
  overview: ["概览", "layout-dashboard"],
  projects: ["项目管理", "folder-kanban"],
  posts: ["博客管理", "book-open"],
  profile: ["站点资料", "settings-2"],
};
const iconify = () => createIcons({ icons });
let noticeTimer;
function notify(message, error = false) {
  let el = document.querySelector(".admin-notice");
  if (!el) {
    el = document.createElement("div");
    el.className = "admin-notice";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.toggle("is-error", error);
  el.classList.add("show");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => el.classList.remove("show"), 4500);
}
async function api(url, { method = "GET", body } = {}) {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" && state.session
        ? { "X-CSRF-Token": state.session.csrfToken }
        : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response
    .json()
    .catch(() => ({ error: "服务器响应异常" }));
  if (!response.ok) {
    const error = new Error(value.error || "操作失败");
    error.status = response.status;
    if (response.status === 401 && url !== "/api/auth/login") {
      state.session = null;
      state.data = null;
      renderLogin();
    }
    throw error;
  }
  return value;
}
async function load() {
  state.data = await api("/api/admin/content");
}
function themeButton() {
  const dark = document.documentElement.classList.contains("dark");
  return `<button type="button" class="icon-button admin-theme" aria-label="切换${dark ? "浅" : "深"}色模式">${i(dark ? "sun" : "moon")}</button>`;
}
function bindTheme() {
  document.querySelector(".admin-theme")?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(
        "zeze-theme",
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      );
    } catch {}
    if (state.session) render();
    else renderLogin();
  });
}

function renderLogin() {
  document.body.classList.remove("admin-locked");
  app.innerHTML = `<div class="login-page"><header class="login-header"><a class="wordmark" href="${homeUrl}"><span class="logo-mark">z<span>.</span></span><span>zeze49024<span class="wordmark-dot">.</span></span></a>${themeButton()}</header><main class="login-layout"><section class="login-story"><span class="admin-eyebrow">A LITTLE SPACE. ALL YOURS.</span><h1>把想法写成现实，<br><span>也把它照顾好。</span></h1><p>这是你的创作后台。<br>整理作品，记录想法，让小站慢慢生长。</p><div class="login-orbits"><span class="login-orbit"></span><span class="login-orbit small"></span><div class="login-profile"><img src="/assets/avatar.jpg" width="78" height="78" alt="站长头像"><b>zeze49024</b><span>PERSONAL SPACE / OWNER</span></div><div class="login-badge">${i("shield-check")}只有你，拥有这把钥匙。</div><span class="login-star">✳</span></div></section><section class="login-panel"><div class="login-lock">${i("lock-keyhole")}</div><span class="admin-eyebrow">WELCOME BACK</span><h2>欢迎回到你的小站。</h2><p>使用站长账号登录，继续你的创作。</p><form id="login-form"><label for="username">账号</label><input id="username" name="username" autocomplete="username" required maxlength="80" value="zeze49024"><label for="password">密码</label><div class="password-field"><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256" placeholder="输入你的密码"><button type="button" id="show-password" aria-label="显示密码">${i("eye")}</button></div><div class="login-error" role="alert"></div><button class="admin-primary login-submit" type="submit">进入工作台${i("arrow-right")}</button></form><div class="login-security">${i("shield-check")}仅站长可登录 · 安全会话保护</div><a class="login-home" href="${homeUrl}">返回个人主页${i("arrow-up-right")}</a></section></main><footer class="login-footer">zeze49024 · 你的创作，自有一方天地。</footer></div>`;
  iconify();
  bindTheme();
  document
    .querySelector("#show-password")
    .addEventListener("click", (event) => {
      const field = document.querySelector("#password");
      field.type = field.type === "password" ? "text" : "password";
      event.currentTarget.setAttribute(
        "aria-label",
        field.type === "password" ? "显示密码" : "隐藏密码",
      );
    });
  document
    .querySelector("#login-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget,
        submit = form.querySelector("[type=submit]"),
        errorBox = form.querySelector(".login-error");
      submit.disabled = true;
      submit.textContent = "正在验证…";
      errorBox.textContent = "";
      try {
        state.session = await api("/api/auth/login", {
          method: "POST",
          body: Object.fromEntries(new FormData(form)),
        });
        form.reset();
        await load();
        state.page = pages[location.hash.slice(1)]
          ? location.hash.slice(1)
          : "overview";
        render();
      } catch (error) {
        errorBox.textContent = error.message;
        submit.disabled = false;
        submit.innerHTML = `进入工作台${i("arrow-right")}`;
        iconify();
      }
    });
}

function render() {
  if (!state.session || !state.data) return renderLogin();
  const [pageTitle] = pages[state.page];
  app.innerHTML = `<div class="admin-layout"><aside class="admin-sidebar"><a class="wordmark" href="${homeUrl}"><span class="logo-mark">z<span>.</span></span><span>zeze49024<span class="wordmark-dot">.</span></span></a><div class="workspace-label">PERSONAL WORKSPACE</div><nav aria-label="后台导航">${Object.entries(
    pages,
  )
    .map(
      ([key, [title, icon]]) =>
        `<a href="#${key}" class="admin-nav ${state.page === key ? "current" : ""}" ${state.page === key ? 'aria-current="page"' : ""}>${i(icon)}<span>${title}</span>${state.page === key ? '<span class="nav-dot"></span>' : ""}</a>`,
    )
    .join(
      "",
    )}</nav><div class="sidebar-note"><span>✳</span><b>让想法持续生长。</b><p>每一次记录，<br>都是小站的一点进步。</p><a href="${homeUrl}" target="_blank" rel="noopener">查看个人主页${i("arrow-up-right")}</a></div><div class="sidebar-owner"><img src="/assets/avatar.jpg" alt="" width="34" height="34"><div><b>zeze49024</b><span><span class="owner-dot"></span>站长 · 唯一管理员</span></div><button type="button" class="logout-button" aria-label="退出登录">${i("log-out")}</button></div></aside><div class="admin-main"><header class="admin-topbar"><span class="admin-breadcrumb">工作台${i("chevron-right")}<b>${pageTitle}</b></span><div class="admin-top-actions"><a href="${homeUrl}" target="_blank" rel="noopener" class="top-home">查看网站${i("arrow-up-right")}</a>${themeButton()}<button class="icon-button refresh-button" aria-label="刷新内容">${i("refresh-cw")}</button></div></header><main class="admin-content"><div class="admin-page-heading"><div><div class="admin-eyebrow">YOUR SPACE, IN PROGRESS</div><h1>${state.page === "overview" ? '你好，zeze49024<span class="greeting-star">✳</span>' : pageTitle}</h1><p>${{ overview: "一个想法，一次更新。今天也让小站更好一点。", projects: "让每一个作品，都有一个被看见的位置。", posts: "把开发中的灵感与发现，写成值得留下的记录。", profile: "这里的每一个细节，都代表着你。" }[state.page]}</p></div>${["projects", "posts"].includes(state.page) ? `<button class="admin-primary new-item">${i("plus")}新建${state.page === "projects" ? "项目" : "文章"}</button>` : `<span class="admin-date">${new Intl.DateTimeFormat("zh-CN", { dateStyle: "long", timeZone: "Asia/Shanghai" }).format(new Date())}</span>`}</div><div id="admin-page">${state.page === "overview" ? overview() : state.page === "profile" ? profilePage() : listPage()}</div><footer class="admin-page-footer"><span>你的内容，由你掌握。</span><span>ZEZE49024 / PERSONAL WORKSPACE</span></footer></main></div></div><dialog class="editor-dialog" aria-labelledby="editor-title"></dialog>`;
  iconify();
  bindTheme();
  bindShell();
  if (state.page === "profile") bindProfile();
  if (["projects", "posts"].includes(state.page)) bindList();
}
function overview() {
  const projects = state.data.projects,
    posts = state.data.posts,
    published = posts.filter((p) => p.published).length;
  return `<section class="admin-welcome"><div><span class="admin-eyebrow">KEEP BUILDING. KEEP SHARING.</span><h2>属于你的数字花园，<br>又有了新的可能。</h2><p>项目、文字与生活灵感，都从这里开始。</p><button class="admin-primary" data-go="posts">写一篇新记录${i("arrow-up-right")}</button></div><div class="welcome-decoration"><span>✳</span><div class="welcome-code">&lt;hello, creator /&gt;</div><div class="welcome-file">${i("file-text")}</div></div></section><section class="admin-stats">${[
    [projects.length, "项目总数", "folder-kanban", "blue", "把想法变成作品"],
    [published, "已发布文章", "circle-check", "green", "和世界分享记录"],
    [
      posts.length - published,
      "文章草稿",
      "file-text",
      "violet",
      "好想法，慢慢打磨",
    ],
  ]
    .map(
      ([count, label, icon, color, hint]) =>
        `<div class="stat-card"><div><span>${label}</span><b>${count.toString().padStart(2, "0")}</b><small>${hint}</small></div><span class="stat-icon ${color}">${i(icon)}</span></div>`,
    )
    .join(
      "",
    )}</section><div class="overview-columns"><section class="admin-panel"><div class="panel-heading"><h2>继续创作</h2><button class="admin-text" data-go="posts">所有文章${i("arrow-up-right")}</button></div>${
    posts.length
      ? posts
          .slice(0, 4)
          .map(
            (post) =>
              `<button class="draft-row" data-open-post="${e(post.id)}"><span class="draft-file">${i("file-text")}</span><div><b>${e(post.title)}</b><small>${e(post.category)} · ${post.published ? "已发布" : "草稿"}</small></div>${i("arrow-up-right")}</button>`,
          )
          .join("")
      : '<div class="admin-empty">还没有文章，先写下第一个想法吧。</div>'
  }</section><section class="admin-panel activity-panel"><div class="panel-heading"><h2>最近动态</h2><span class="subtle-dot"></span></div><div class="activity-list">${
    state.data.activity.length
      ? state.data.activity
          .slice(0, 6)
          .map(
            (log) =>
              `<div class="activity-row"><span></span><div><b>${e({ login: "登录工作台", create: "新建内容", update: "更新内容", delete: "删除内容", "update-profile": "更新站点资料" }[log.action] || log.action)}</b><small>${e(new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(log.created)))}</small></div></div>`,
          )
          .join("")
      : '<div class="admin-empty">新的动态会出现在这里。</div>'
  }</div><div class="activity-footnote">${i("shield-check")}仅你可以管理这个空间。</div></section></div>`;
}
function listPage() {
  const kind = state.page,
    isProject = kind === "projects";
  return `<section class="admin-panel content-panel"><div class="list-toolbar"><div class="list-filters" role="group" aria-label="发布状态筛选">${[
    ["all", "全部"],
    ["published", "已发布"],
    ["draft", "草稿"],
  ]
    .map(
      ([value, label]) =>
        `<button data-status="${value}" type="button" class="${state.filter === value ? "chosen" : ""}" aria-pressed="${state.filter === value}">${label}<span>${state.data[kind].filter((item) => value === "all" || item.published === (value === "published")).length}</span></button>`,
    )
    .join(
      "",
    )}</div><label class="admin-search">${i("search")}<input type="search" aria-label="搜索${isProject ? "项目" : "文章"}" placeholder="搜索${isProject ? "项目" : "文章"}…" value="${e(state.query)}"></label></div><div class="content-table-wrap"><table class="content-table"><thead><tr><th>${isProject ? "项目" : "文章"}</th><th>状态</th><th>分类</th><th>更新时间</th><th>操作</th></tr></thead><tbody id="content-rows">${listRows()}</tbody></table></div></section><p class="list-explainer">${isProject ? "发布的项目会出现在首页，卡片直接跳转到对应的 GitHub 仓库。" : "草稿仅在后台可见。发布后的文章会立即出现在首页博客区。"}</p>`;
}
function listRows() {
  const kind = state.page,
    isProject = kind === "projects";
  const rows = state.data[kind].filter(
    (item) =>
      (state.filter === "all" ||
        item.published === (state.filter === "published")) &&
      `${item.name || item.title} ${item.category}`
        .toLowerCase()
        .includes(state.query.toLowerCase()),
  );
  return rows.length
    ? rows
        .map(
          (item) =>
            `<tr><td><div class="table-title"><span class="table-icon ${e(item.color)}">${i(isProject ? "folder-kanban" : "file-text")}</span><button class="row-title" data-edit="${e(item.id)}"><b>${e(item.name || item.title)}</b><small>${e(isProject ? `github.com/zeze49024/${item.repo}` : item.excerpt)}</small></button></div></td><td><span class="status-pill ${item.published ? "published" : ""}"><span></span>${item.published ? "已发布" : "草稿"}</span></td><td><span class="table-category">${e(item.category)}</span></td><td class="table-date">${e(item.updated.slice(0, 10))}</td><td><div class="row-actions"><button class="row-action" data-edit="${e(item.id)}" aria-label="编辑${e(item.name || item.title)}">${i("pencil")}</button><button class="row-action" data-publish="${e(item.id)}" aria-label="${item.published ? "取消发布" : "发布"}${e(item.name || item.title)}">${i(item.published ? "eye" : "circle-check")}</button><button class="row-action danger" data-delete="${e(item.id)}" aria-label="删除${e(item.name || item.title)}">${i("trash-2")}</button></div></td></tr>`,
        )
        .join("")
    : '<tr><td colspan="5"><div class="admin-empty">这里还没有符合条件的内容。</div></td></tr>';
}
function field(
  label,
  name,
  value = "",
  {
    type = "text",
    required = true,
    max = 200,
    placeholder = "",
    textarea = false,
    rows = 3,
  } = {},
) {
  return `<label class="editor-field"><span>${label}</span>${textarea ? `<textarea name="${name}" rows="${rows}" maxlength="${max}" ${required ? "required" : ""} placeholder="${e(placeholder)}">${e(value)}</textarea>` : `<input name="${name}" type="${type}" value="${e(value)}" maxlength="${max}" ${required ? "required" : ""} placeholder="${e(placeholder)}" ${type === "number" ? 'min="0" max="100000" step="1"' : ""}>`}</label>`;
}
function select(label, name, value, choices) {
  return `<label class="editor-field"><span>${label}</span><select name="${name}">${choices
    .map((option) => {
      const [key, title] = Array.isArray(option) ? option : [option, option];
      return `<option value="${e(key)}" ${value === key ? "selected" : ""}>${e(title)}</option>`;
    })
    .join("")}</select></label>`;
}
function profilePage() {
  const p = state.data.profile;
  return `<div class="profile-admin-grid"><section class="admin-panel profile-form-panel"><div class="panel-heading"><h2>个人资料</h2><span class="small-muted">保存后同步到首页</span></div><form id="profile-form"><div class="profile-avatar-row"><img src="/assets/avatar.jpg" alt="当前头像" width="64" height="64"><div><b>zeze49024</b><span>站长账号 · 不开放注册</span></div></div>${field("展示昵称", "name", p.name, { max: 60 })}${field("所在地", "location", p.location, { max: 100 })}${field("个人介绍", "bio", p.bio, { textarea: true, max: 1000, rows: 4 })}${field("B 站主页", "bilibili", p.bilibili, { required: true, type: "url", max: 250 })}${field("页脚文字", "footerNote", p.footerNote, { max: 160 })}<div class="form-error" role="alert"></div><button class="admin-primary" type="submit">${i("check")}保存资料</button></form></section><aside class="profile-help admin-panel"><div class="profile-help-icon">${i("shield-check")}</div><h3>这个空间，只属于你。</h3><p>站长账号由服务器维护，没有访客注册入口。</p><div class="profile-help-line"><span>账号</span><b>zeze49024</b></div><div class="profile-help-line"><span>登录有效期</span><b>12 小时</b></div><div class="profile-help-line"><span>密码存储</span><b>加盐哈希</b></div><p>文章和项目只有发布后，才会出现在公开主页。关闭页面不会删除草稿。</p></aside></div>`;
}
function bindShell() {
  document
    .querySelector(".logout-button")
    .addEventListener("click", async () => {
      try {
        await api("/api/auth/logout", { method: "POST", body: {} });
        state.session = null;
        state.data = null;
        renderLogin();
      } catch (error) {
        notify(error.message, true);
      }
    });
  document
    .querySelector(".refresh-button")
    .addEventListener("click", async (event) => {
      event.currentTarget.disabled = true;
      try {
        await load();
        render();
        notify("内容已刷新");
      } catch (error) {
        notify(error.message, true);
        event.currentTarget.disabled = false;
      }
    });
  document.querySelectorAll("[data-go]").forEach((button) =>
    button.addEventListener("click", () => {
      const page = button.dataset.go;
      state.page = page;
      state.query = "";
      state.filter = "all";
      location.hash = page;
      render();
      if (button.textContent.includes("写一篇")) openEditor();
    }),
  );
  document.querySelectorAll("[data-open-post]").forEach((button) =>
    button.addEventListener("click", () => {
      const id = button.dataset.openPost;
      state.page = "posts";
      location.hash = "posts";
      render();
      openEditor(id);
    }),
  );
}
function bindProfile() {
  document
    .querySelector("#profile-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget,
        button = form.querySelector("[type=submit]");
      button.disabled = true;
      form.querySelector(".form-error").textContent = "";
      try {
        await api("/api/admin/profile", {
          method: "PUT",
          body: {
            ...Object.fromEntries(new FormData(form)),
            revision: state.data.profile.revision,
          },
        });
        await load();
        render();
        notify("资料已保存，主页已同步");
      } catch (error) {
        form.querySelector(".form-error").textContent = error.message;
        button.disabled = false;
      }
    });
}
function bindList() {
  document
    .querySelector(".new-item")
    .addEventListener("click", () => openEditor());
  document.querySelectorAll("[data-status]").forEach((button) =>
    button.addEventListener("click", () => {
      state.filter = button.dataset.status;
      render();
    }),
  );
  document
    .querySelector(".admin-search input")
    .addEventListener("input", (event) => {
      state.query = event.target.value;
      document.querySelector("#content-rows").innerHTML = listRows();
      iconify();
      bindRows();
    });
  bindRows();
}
function bindRows() {
  document
    .querySelectorAll("[data-edit]")
    .forEach((button) =>
      button.addEventListener("click", () => openEditor(button.dataset.edit)),
    );
  document.querySelectorAll("[data-publish]").forEach((button) =>
    button.addEventListener("click", async () => {
      const item = state.data[state.page].find(
        (value) => value.id === button.dataset.publish,
      );
      button.disabled = true;
      try {
        await api(`/api/admin/${state.page}/${item.id}`, {
          method: "PUT",
          body: { ...item, published: !item.published },
        });
        await load();
        render();
        notify(item.published ? "已取消发布" : "已发布到主页");
      } catch (error) {
        notify(error.message, true);
        button.disabled = false;
      }
    }),
  );
  document.querySelectorAll("[data-delete]").forEach((button) =>
    button.addEventListener("click", async () => {
      const item = state.data[state.page].find(
        (value) => value.id === button.dataset.delete,
      );
      if (
        !confirm(`确定永久删除“${item.name || item.title}”吗？此操作无法撤销。`)
      )
        return;
      button.disabled = true;
      try {
        await api(`/api/admin/${state.page}/${item.id}`, {
          method: "DELETE",
          body: { revision: item.revision },
        });
        await load();
        render();
        notify("内容已删除");
      } catch (error) {
        notify(error.message, true);
        button.disabled = false;
      }
    }),
  );
}
function openEditor(id) {
  const kind = state.page,
    isProject = kind === "projects",
    item = state.data[kind].find((value) => value.id === id) || {
      color: "blue",
      category: isProject ? "其他" : "开发随记",
      visual: "blog",
      icon: "book-open",
      tags: [],
      body: [["", ""]],
      sortOrder: state.data[kind].length,
      date: new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
      }).format(new Date()),
      read: "2 分钟",
      published: false,
    };
  state.editor = { id, kind };
  const dialog = document.querySelector(".editor-dialog");
  dialog.innerHTML = `<header class="editor-header"><div><span class="admin-eyebrow">${isProject ? "PROJECT" : "JOURNAL"} EDITOR</span><h2 id="editor-title">${id ? "编辑" : "新建"}${isProject ? "项目" : "文章"}</h2></div><button class="icon-button close-editor" aria-label="关闭编辑器">${i("x")}</button></header><form id="content-form"><div class="editor-fields">${
    isProject
      ? `${field("项目名称", "name", item.name || "", { max: 80 })}<div class="editor-pair">${select("分类", "category", item.category, ["桌面应用", "移动应用", "游戏模组", "网站", "其他"])}${field("副标题", "eyebrow", item.eyebrow || "", { max: 100, placeholder: "WEB · 个人项目" })}</div>${field("GitHub 仓库名", "repo", item.repo || "", { max: 100, placeholder: "例如 myBlog（账号固定为 zeze49024）" })}${field("项目简介", "description", item.description || "", { max: 500, textarea: true })}${field("标签（用逗号分隔，最多 8 个）", "tags", item.tags.join(", "), { max: 330, required: false })}<div class="editor-pair">${select(
          "卡片视觉",
          "visual",
          item.visual,
          [
            ["orvia", "知识库示意"],
            ["todo", "待办手机示意"],
            ["harmony", "方块世界示意"],
            ["blog", "网站示意"],
            ["profile", "GitHub 主页"],
          ],
        )}${select("强调色", "color", item.color, [
          ["blue", "蓝色"],
          ["violet", "紫色"],
          ["green", "绿色"],
          ["gray", "灰色"],
        ])}</div><div class="editor-pair">${field("补充仓库名（可选）", "secondaryRepo", item.secondary?.repo || "", { max: 100, required: false })}${field("补充链接文字", "secondaryLabel", item.secondary?.label || "", { max: 40, required: false })}</div>`
      : `${field("文章标题", "title", item.title || "", { max: 160 })}<div class="editor-pair">${field("分类", "category", item.category, { max: 40 })}${field("显示日期", "date", item.date, { max: 30 })}</div>${field("文章摘要", "excerpt", item.excerpt || "", { textarea: true, max: 500 })}<div class="editor-pair">${select(
          "图标",
          "icon",
          item.icon,
          [
            ["book-open", "书本"],
            ["sparkles", "灵感"],
            ["hard-drive", "本地工具"],
            ["mouse-pointer-2", "交互"],
            ["code-2", "代码"],
          ],
        )}${select("强调色", "color", item.color, [
          ["blue", "蓝色"],
          ["violet", "紫色"],
          ["green", "绿色"],
          ["gray", "灰色"],
        ])}</div>${field("预计阅读时间", "read", item.read, { max: 30 })}${field("正文（以 ## 标题 开始一个段落，内容按原文显示）", "bodyText", item.body.map(([title, body]) => `## ${title}\n${body}`).join("\n\n"), { textarea: true, rows: 12, max: 180000 })}`
  }
  <div class="editor-pair">${field("排序（数字越小越靠前）", "sortOrder", item.sortOrder, { type: "number" })}${select(
    "可见性",
    "published",
    item.published ? "true" : "false",
    [
      ["false", "草稿 · 仅自己可见"],
      ["true", "发布 · 展示在主页"],
    ],
  )}</div><div class="form-error" role="alert"></div></div><footer class="editor-footer"><span>保存后内容会持久存储。</span><button class="admin-secondary cancel-editor" type="button">取消</button><button class="admin-primary" type="submit">${i("check")}保存${isProject ? "项目" : "文章"}</button></footer></form>`;
  iconify();
  dialog.showModal();
  document.body.classList.add("admin-locked");
  const close = () => dialog.close();
  dialog.querySelector(".close-editor").addEventListener("click", close);
  dialog.querySelector(".cancel-editor").addEventListener("click", close);
  dialog.addEventListener(
    "close",
    () => {
      document.body.classList.remove("admin-locked");
      state.editor = null;
    },
    { once: true },
  );
  dialog
    .querySelector("#content-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget,
        button = form.querySelector("[type=submit]");
      button.disabled = true;
      form.querySelector(".form-error").textContent = "";
      const fields = Object.fromEntries(new FormData(form));
      let body = {
        ...fields,
        published: fields.published === "true",
        sortOrder: Number(fields.sortOrder),
        ...(id ? { revision: item.revision } : {}),
      };
      if (isProject)
        body = {
          ...body,
          tags: fields.tags
            .split(/[,，]/)
            .map((tag) => tag.trim())
            .filter(Boolean),
          secondary: fields.secondaryRepo
            ? { repo: fields.secondaryRepo, label: fields.secondaryLabel }
            : undefined,
        };
      else {
        const sections = [];
        let heading = "",
          lines = [];
        for (const line of fields.bodyText.split("\n")) {
          if (line.startsWith("## ")) {
            if (lines.join("\n").trim())
              sections.push([heading, lines.join("\n").trim()]);
            heading = line.slice(3).trim();
            lines = [];
          } else lines.push(line);
        }
        if (lines.join("\n").trim())
          sections.push([heading, lines.join("\n").trim()]);
        body.body = sections;
      }
      try {
        await api(`/api/admin/${kind}${id ? `/${id}` : ""}`, {
          method: id ? "PUT" : "POST",
          body,
        });
        close();
        await load();
        render();
        notify("已保存");
      } catch (error) {
        form.querySelector(".form-error").textContent = error.message;
        button.disabled = false;
      }
    });
}
window.addEventListener("hashchange", () => {
  const page = location.hash.slice(1);
  if (!pages[page] || !state.session || state.page === page) return;
  state.page = page;
  state.query = "";
  state.filter = "all";
  render();
});
try {
  state.session = await api("/api/auth/session");
  await load();
  state.page = pages[location.hash.slice(1)]
    ? location.hash.slice(1)
    : "overview";
  render();
} catch (error) {
  if (error.status === 401) renderLogin();
  else {
    renderLogin();
    document.querySelector(".login-error").textContent =
      "无法连接服务，请稍后重试。";
  }
}
