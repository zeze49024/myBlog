import "./style.css";
import "./theme.js";
import {
  createIcons,
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Sun,
  Moon,
  Menu,
  X,
  MapPin,
  Code2,
  Files,
  ListChecks,
  Box,
  Sparkles,
  HardDrive,
  MousePointer2,
  Check,
  ChevronRight,
  Clock3,
  Plus,
  ExternalLink,
  BookOpen,
  PanelLeft,
  Folder,
  FileText,
  Search,
  Download,
  Heart,
  Circle,
  Laptop,
  Smartphone,
  Gamepad2,
  Globe,
  SlidersHorizontal,
} from "lucide";
import { siAfdian, siBilibili, siGithub } from "simple-icons";
import { escapeHTML, escapeTree } from "./safe.js";
let site;
try {
  const response = await fetch("/api/site", { cache: "no-store" });
  if (!response.ok) throw new Error();
  site = escapeTree(await response.json());
} catch {
  document.querySelector("#app").innerHTML =
    '<main class="load-error"><h1>暂时没能打开这个小站</h1><p>请稍后刷新，或检查服务是否已启动。</p><button type="button" id="retry">重新加载</button></main>';
  document
    .querySelector("#retry")
    .addEventListener("click", () => location.reload());
  throw new Error("Site content unavailable");
}
const { projects, posts, profile } = site;

const github = "https://github.com/zeze49024";
const icon = (name, cls = "") =>
  `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
const brand = (item) =>
  `<svg viewBox="0 0 24 24" role="img" aria-hidden="true" fill="currentColor"><path d="${item.path}"/></svg>`;
const external = 'target="_blank" rel="noopener noreferrer"';
const socialLinks = () =>
  `<a class="social-button" href="${github}" ${external} aria-label="访问 zeze49024 的 GitHub 主页">${brand(siGithub)}</a><a class="social-button bilibili" href="${profile.bilibili || "https://space.bilibili.com/1378527004"}" ${external} aria-label="访问 zeze49024 的 B 站主页">${brand(siBilibili)}</a><a class="social-button afdian" href="https://afdian.com/a/zeze49024" ${external} aria-label="在爱发电支持 zeze49024" title="爱发电 · 支持我的创作">${brand(siAfdian)}</a><button class="social-button more-social" type="button" aria-label="更多社交渠道" aria-describedby="social-note">${icon("plus")}</button>`;

function visual(type) {
  if (type === "orvia")
    return `<div class="orvia-window"><div class="window-bar"><span class="traffic"><b></b><b></b><b></b></span><span>Orvia</span>${icon("panel-left")}</div><div class="orvia-body"><aside><span class="tiny-logo">O</span>${icon("folder")}${icon("file-text")}${icon("clock-3")}</aside><div class="orvia-content"><div class="mini-heading">让知识，自成体系。<span>本地 Markdown 知识库</span></div><div class="mini-tools"><span>${icon("file-text")}Markdown</span><span>${icon("files")}知识库</span><span>${icon("folder")}标签</span></div><div class="mini-file"><span class="file-blue">M</span><span>项目笔记.md<small>文档 · 本地文件</small></span>${icon("check")}</div><div class="mini-file"><span class="file-red">M</span><span>灵感备忘.md<small>文档 · 本地文件</small></span>${icon("check")}</div></div></div></div><span class="floating-file">${icon("files")}</span>`;
  if (type === "todo")
    return `<div class="todo-orbit orbit-one"></div><div class="todo-orbit orbit-two"></div><div class="phone"><div class="phone-status">9:41 <span>••• ▰</span></div><div class="phone-title">今天 <span>＋</span></div><div class="phone-date">把小事做好，就是很好的一天。</div><div class="phone-task"><b class="task-check checked">✓</b><div>给想法一个开始<small>个人 · 今天</small></div></div><div class="phone-task"><b class="task-check"></b><div>专注重要的事情<small>学习 · 今天</small></div><em></em></div><div class="phone-task"><b class="task-check"></b><div>记录新的灵感<small>日常 · 今天</small></div></div><div class="focus-mini">${icon("clock-3")}<span>留一点时间给自己</span><b>25:00</b></div><div class="phone-nav">${icon("list-checks")}${icon("clock-3")}${icon("circle")}</div></div><span class="float-check">${icon("check")}</span>`;
  if (type === "harmony")
    return `<div class="voxel-scene"><div class="pixel-sun"></div><span class="pixel-cloud cloud-one"></span><span class="pixel-cloud cloud-two"></span><div class="voxel block-one"><div class="voxel-top"></div><div class="voxel-front"></div><div class="voxel-side"></div></div><div class="voxel block-two"><div class="voxel-top"></div><div class="voxel-front"></div><div class="voxel-side"></div></div><div class="voxel block-three"><div class="voxel-top"></div><div class="voxel-front"></div><div class="voxel-side"></div></div><div class="voxel block-four"><div class="voxel-top"></div><div class="voxel-front"></div><div class="voxel-side"></div></div><div class="pixel-sprout"><b></b><span></span></div></div><span class="forge-pill">MINECRAFT × FORGE</span>`;
  if (type === "blog")
    return `<div class="browser-mini"><div class="browser-top"><span class="traffic"><b></b><b></b><b></b></span><span>zeze49024.com</span></div><div class="browser-content"><div class="browser-nav"><b>z.</b><span>项目　 随记　 关于</span></div><p>你好，我是 zeze49024</p><h3>把想法，<br><em>写成现实。</em></h3><div class="browser-cta"></div><div class="browser-cards"><span></span><span></span><span></span></div></div></div>`;
  return `<div class="profile-visual">${brand(siGithub)}<span>zeze49024<span class="cursor">_</span></span><small>ALWAYS EXPLORING</small></div>`;
}

function projectCard(p, i) {
  return `<article class="project-card reveal" data-category="${p.category}" style="--delay:${(i % 3) * 80}ms"><a class="project-main" href="${github}/${p.repo}" ${external} aria-label="在 GitHub 查看 ${p.name}"><div class="project-visual visual-${p.visual}"><span class="visual-label">${p.id === "profile" ? "主页概念" : "界面示意"}</span>${visual(p.visual)}</div><div class="project-content"><div class="project-eyebrow">${p.eyebrow}</div><h3>${p.name}<span class="project-arrow">${icon("arrow-up-right")}</span></h3><p>${p.description}</p><div class="tags">${p.tags.map((tag, j) => `<span class="${j === 0 ? `tag-${p.color}` : ""}">${tag}</span>`).join("")}</div></div></a>${p.secondary ? `<a class="secondary-repo" href="${github}/${p.secondary.repo}" ${external}>${icon("download")}${p.secondary.label}${icon("arrow-up-right")}</a>` : ""}</article>`;
}

document.querySelector("#app").innerHTML = `
<div class="scroll-progress" aria-hidden="true"></div>
<header class="site-header"><div class="header-inner flex items-center justify-between"><a class="wordmark" href="#home" aria-label="返回首页"><span class="logo-mark">z<span>.</span></span><span>${profile.name}<span class="wordmark-dot">.</span></span></a><nav class="desktop-nav hidden md:flex" aria-label="主导航"><a class="active" href="#home">首页</a><a href="#projects">项目</a><a href="#journal">博客</a><a href="#about">关于</a></nav><div class="header-actions flex items-center gap-3"><span class="local-time hidden lg:flex"><span></span>一个持续生长的个人空间</span><button class="theme-toggle icon-button" type="button" aria-label="切换到深色模式" aria-pressed="false">${icon("moon", "moon-icon")}${icon("sun", "sun-icon")}</button><button class="menu-toggle icon-button md:hidden" type="button" aria-label="打开导航" aria-expanded="false" aria-controls="mobile-nav">${icon("menu")}</button></div></div><nav id="mobile-nav" class="mobile-nav" aria-label="移动导航" hidden><a href="#home">首页</a><a href="#projects">项目</a><a href="#journal">博客</a><a href="#about">关于</a></nav></header>
<main id="main">
<section id="home" class="hero section-shell"><div class="hero-copy"><div class="hello-line"><span class="hello-dot"></span>你好，欢迎来到我的数字空间<span class="wave">✳</span></div><h1>把想法，<br><span class="hero-second">写成<span class="reality">现实<svg viewBox="0 0 290 20" preserveAspectRatio="none" aria-hidden="true"><path d="M5 14 Q140 0 284 10"/></svg></span>。</span></h1><p class="hero-intro">我是 <strong>${profile.name}</strong>，来自${profile.location}。<br>${profile.bio.replaceAll("\n", "<br>")}</p><div class="hero-buttons flex flex-wrap items-center gap-3"><a class="button button-primary" href="#projects">探索我的项目${icon("arrow-up-right")}</a><a class="button button-outline" href="${github}" ${external}>${brand(siGithub)}访问 GitHub${icon("arrow-up-right")}</a></div><div class="hero-footnote"><span class="line"></span><span>保持好奇，持续构建。</span><span class="mono">KEEP BUILDING.</span></div></div><div class="hero-art"><div class="orbit-line orbit-outer"></div><div class="orbit-line orbit-inner"></div><span class="art-cross cross-one">＋</span><span class="art-cross cross-two">＋</span><div class="floating-code">${icon("code-2")}<span>ideas → reality</span></div><div class="profile-card"><div class="profile-cover"><span class="cover-grid"></span><span class="cover-code">&lt;hello world /&gt;</span><span class="cover-spark">✳</span></div><div class="profile-info"><div class="avatar-wrap"><img src="/assets/avatar.jpg" width="104" height="104" alt="${profile.name} 的头像" fetchpriority="high"><span class="avatar-spark">✦</span></div><div class="profile-label">PERSONAL SPACE / 001</div><h2>${profile.name}<span class="verified">${icon("check")}</span></h2><div class="profile-location">${icon("map-pin")}中国 · ${profile.location}</div><div class="profile-divider"></div><div class="profile-bottom"><span>用代码，把灵感慢慢实现。</span><span class="status-dot"></span></div></div></div><div class="floating-commit"><span class="commit-symbol">${icon("check")}</span><div>又一个想法，正在发生。<span>building something new</span></div>${icon("sparkles")}</div><div class="art-caption mono">A LITTLE SPACE. A LOT OF IDEAS.</div></div><a class="scroll-hint" href="#projects">${icon("arrow-down")}向下探索<span>SCROLL TO EXPLORE</span></a></section>
<div class="interest-strip"><div class="section-shell flex flex-wrap items-center justify-between gap-5"><span class="strip-label">灵感不止一种形状</span><span>${icon("laptop")}桌面应用</span><span>${icon("smartphone")}移动应用</span><span>${icon("globe")}Web 探索</span><span>${icon("gamepad-2")}游戏模组</span><span class="strip-end mono">CODE. CREATE. REPEAT.</span></div></div>
<section id="projects" class="section-shell projects-section"><div class="section-heading reveal"><div><div class="eyebrow"><span>01 /</span> SELECTED PROJECTS</div><h2>一些想法，已经有了形状<span class="blue-period">.</span></h2><p>从日常需要出发，把灵感变成可以使用的东西。</p></div><a class="text-link" href="${github}?tab=repositories" ${external}>全部 GitHub 仓库${icon("arrow-up-right")}</a></div><div class="project-toolbar"><div class="filter-tabs flex flex-wrap gap-1" role="group" aria-label="按项目类型筛选">${["全部项目", "桌面应用", "移动应用", "游戏模组", "网站", "其他"].map((label, i) => `<button type="button" class="filter-tab ${i === 0 ? "selected" : ""}" aria-pressed="${i === 0}" data-filter="${label}">${label}${i === 0 ? `<span>${projects.length}</span>` : ""}</button>`).join("")}</div><span class="project-count mono" aria-live="polite">${String(projects.length).padStart(2, "0")} PROJECT${projects.length === 1 ? "" : "S"}</span></div><div class="project-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6">${projects.map(projectCard).join("")}</div><div class="project-note">${icon("code-2")}页面展示已核实的公开项目，源码与安装包入口均指向 GitHub。<span class="mono">MADE WITH CURIOSITY ↗</span></div></section>
<section id="journal" class="journal-section"><div class="section-shell"><div class="section-heading reveal"><div><div class="eyebrow"><span>02 /</span> NOTES & THOUGHTS</div><h2>不止代码，也有记录<span class="blue-period">.</span></h2><p>关于构建、打磨，以及那些值得记下的小事。</p></div><span class="journal-caption">${icon("book-open")}博客 · 开发记录</span></div><div class="journal-grid grid md:grid-cols-3 gap-6">${posts.length ? posts.map((post, i) => `<button type="button" class="post-card reveal" data-post="${post.id}" style="--delay:${i * 80}ms"><div class="post-top"><span class="post-icon post-${post.color}">${icon(post.icon)}</span><span class="draft-label">${post.status}</span></div><div class="post-category">${post.category}</div><h3>${post.title}</h3><p>${post.excerpt}</p><div class="post-footer"><span class="mono">${post.date}</span><span>${post.read}${icon("arrow-up-right")}</span></div></button>`).join("") : '<div class="empty-journal"><span>✳</span><h3>第一篇记录，正在路上。</h3><p>关于代码、想法和探索，等写好了就放在这里。</p></div>'}</div><p class="journal-note">${posts.length ? "记录每一个想法的发生。" : "保持好奇，也留一点时间给表达。"}</p></div></section>
<section id="about" class="section-shell about-section"><div class="about-heading reveal"><div class="eyebrow"><span>03 /</span> A LITTLE ABOUT ME</div><h2>代码之外，<br>也是一个好奇的人<span class="blue-period">.</span></h2><p>你好，我是${profile.name}。<br>这个小站，是我的作品集，也是持续更新的记录本。</p><div class="location-chip">${icon("map-pin")}${profile.location}<span class="china-time mono"></span></div></div><div class="about-right reveal"><div class="about-statement">从一个小小的念头开始，<br>让它一点点成为现实。<span>✳</span></div><p>写应用，做网站，探索方块世界。<br>把有趣的想法慢慢做出来，再把过程留在这里。</p><div class="about-tags"><span>⌘ 编程与创造</span><span>◈ 简单的设计</span><span>✳ 保持好奇</span></div><div class="about-social"><div><span class="social-heading">在其他地方找到我</span><div class="social-links">${socialLinks()}<span id="social-note" class="social-note" role="status">更多渠道，慢慢解锁。</span></div></div>${icon("arrow-up-right", "about-big-arrow")}</div></div></section>
<section class="cta-section section-shell reveal"><div class="cta-inner"><span class="cta-spark">✳</span><div><span class="eyebrow">THE NEXT IDEA IS ON THE WAY</span><h2>下一个想法，GitHub 见。</h2><p>所有正在发生的探索，都有迹可循。</p></div><a class="button button-white" href="${github}" ${external}>${brand(siGithub)}去 GitHub 看看${icon("arrow-up-right")}</a></div></section>
</main>
<footer class="section-shell site-footer"><a class="wordmark" href="#home"><span class="logo-mark">z<span>.</span></span><span>${profile.name}<span class="wordmark-dot">.</span></span></a><span>© ${new Date().getFullYear()} ${profile.name} <span class="footer-separator">/</span> ${profile.footerNote}</span><a class="back-top" href="#home">回到顶部${icon("arrow-up")}</a></footer>
<dialog id="post-dialog" aria-labelledby="post-title"><div class="reader-toolbar"><span>${icon("book-open")}随记 / 阅读</span><button class="reader-close icon-button" aria-label="关闭文章">${icon("x")}</button></div><article class="reader-article"></article><div class="reader-bottom"><span>读到这里，谢谢你。</span><button class="reader-done text-link" type="button">返回首页${icon("arrow-right")}</button></div></dialog>
<div class="toast" role="status" aria-live="polite"></div>`;

createIcons({
  icons: {
    ArrowUpRight,
    ArrowRight,
    ArrowDown,
    ArrowUp,
    Sun,
    Moon,
    Menu,
    X,
    MapPin,
    Code2,
    Files,
    ListChecks,
    Box,
    Sparkles,
    HardDrive,
    MousePointer2,
    Check,
    ChevronRight,
    Clock3,
    Plus,
    ExternalLink,
    BookOpen,
    PanelLeft,
    Folder,
    FileText,
    Search,
    Download,
    Heart,
    Circle,
    Laptop,
    Smartphone,
    Gamepad2,
    Globe,
    SlidersHorizontal,
  },
});

const root = document.documentElement;
root.classList.remove("reading");
const themeButton = document.querySelector(".theme-toggle");
function updateTheme() {
  const dark = root.classList.contains("dark");
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.setAttribute(
    "aria-label",
    dark ? "切换到浅色模式" : "切换到深色模式",
  );
  document.querySelector('meta[name="theme-color"]').content = dark
    ? "#111318"
    : "#f8f9fb";
}
updateTheme();
themeButton.addEventListener("click", () => {
  root.classList.toggle("dark");
  try {
    localStorage.setItem(
      "zeze-theme",
      root.classList.contains("dark") ? "dark" : "light",
    );
  } catch {}
  updateTheme();
});

const menu = document.querySelector("#mobile-nav");
const menuButton = document.querySelector(".menu-toggle");
function closeMenu() {
  menu.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "打开导航");
}
menuButton.addEventListener("click", () => {
  menu.hidden = !menu.hidden;
  menuButton.setAttribute("aria-expanded", String(!menu.hidden));
  menuButton.setAttribute("aria-label", menu.hidden ? "打开导航" : "关闭导航");
});
menu
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
window.matchMedia("(min-width: 768px)").addEventListener("change", (e) => {
  if (e.matches) closeMenu();
});

document.querySelectorAll(".filter-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.classList.remove("selected");
      tab.setAttribute("aria-pressed", "false");
    });
    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");
    let count = 0;
    document.querySelectorAll(".project-card").forEach((card) => {
      const show =
        button.dataset.filter === "全部项目" ||
        button.dataset.filter === card.dataset.category;
      card.hidden = !show;
      if (show) {
        card.classList.add("visible");
        count++;
      }
    });
    document.querySelector(".project-count").textContent =
      `${String(count).padStart(2, "0")} PROJECT${count === 1 ? "" : "S"}`;
  });
});

const dialog = document.querySelector("#post-dialog");
let postTrigger;
document.querySelectorAll("[data-post]").forEach((button) =>
  button.addEventListener("click", () => {
    const post = posts.find((item) => item.id === button.dataset.post);
    postTrigger = button;
    dialog.querySelector(".reader-article").innerHTML =
      `<div class="reader-meta">${post.category} <span>${post.status}</span></div><h1 id="post-title">${post.title}</h1><div class="reader-byline"><img src="/assets/avatar.jpg" alt="" width="30" height="30"><b>${profile.name}</b><span>${post.date} · ${post.read}</span></div><p class="reader-lead">${post.excerpt}</p>${post.body.map(([title, body]) => `${title ? `<h2>${title}</h2>` : ""}<p>${body}</p>`).join("")}`;
    dialog.showModal();
    dialog.scrollTop = 0;
    root.classList.add("reading");
  }),
);
const closeReader = () => dialog.close();
dialog.querySelector(".reader-close").addEventListener("click", closeReader);
dialog.querySelector(".reader-done").addEventListener("click", closeReader);
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    closeReader();
});
dialog.addEventListener("close", () => {
  root.classList.remove("reading");
  postTrigger?.focus({ preventScroll: true });
});

let toastTimer;
document.querySelectorAll(".more-social").forEach((button) =>
  button.addEventListener("click", () => {
    const toast = document.querySelector(".toast");
    toast.textContent = "更多社交渠道将在这里更新，先来 B 站打个招呼吧。";
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
  }),
);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    }),
  { threshold: 0.08 },
);
document
  .querySelectorAll(".reveal")
  .forEach((el) => revealObserver.observe(el));
const sections = [...document.querySelectorAll("main > section[id]")];
let ticking = false;
function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  document.querySelector(".scroll-progress").style.transform =
    `scaleX(${max > 0 ? scrollY / max : 0})`;
  let current = "home";
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= 180) current = section.id;
  });
  document.querySelectorAll(".desktop-nav a").forEach((link) => {
    const active = link.hash === `#${current}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  document
    .querySelector(".site-header")
    .classList.toggle("scrolled", scrollY > 20);
  ticking = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      requestAnimationFrame(updateScroll);
      ticking = true;
    }
  },
  { passive: true },
);
updateScroll();
document.querySelector(".hero-art").addEventListener("pointermove", (event) => {
  if (reduceMotion.matches || event.pointerType !== "mouse") return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    "--rx",
    `${-(event.clientY - rect.top - rect.height / 2) / 80}deg`,
  );
  event.currentTarget.style.setProperty(
    "--ry",
    `${(event.clientX - rect.left - rect.width / 2) / 80}deg`,
  );
});
document
  .querySelector(".hero-art")
  .addEventListener("pointerleave", (event) => {
    event.currentTarget.style.setProperty("--rx", "0deg");
    event.currentTarget.style.setProperty("--ry", "0deg");
  });
function updateTime() {
  document.querySelector(".china-time").textContent =
    `${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" }).format(new Date())} CST`;
}
updateTime();
setInterval(updateTime, 60000);

// 文章可分享锚点；关闭阅读后返回博客区。
const requestedPost = new URLSearchParams(location.search).get("post");
if (requestedPost)
  document.querySelector(`[data-post="${CSS.escape(requestedPost)}"]`)?.click();
