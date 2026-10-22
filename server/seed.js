// 仅收录 2026-10-22 核实的公开仓库。无服务端调用，不泄露私有项目元数据。
export const projects = [
  {
    id: "orvia",
    name: "Orvia",
    eyebrow: "WINDOWS · 个人知识库",
    category: "桌面应用",
    color: "blue",
    icon: "files",
    repo: "orvia-windows",
    tags: ["TypeScript", "Tauri", "本地优先"],
    description:
      "给知识一个自己的家。本地 Markdown 知识库，支持编辑、标签、搜索与文档导入，无需账号。",
    visual: "orvia",
  },
  {
    id: "todo",
    name: "myToDoList",
    eyebrow: "ANDROID · 效率工具",
    category: "移动应用",
    color: "violet",
    icon: "list-checks",
    repo: "myToDoList",
    tags: ["Kotlin", "Jetpack Compose", "Android"],
    description:
      "把注意力留给重要的事。待办、日历与专注计时，装进一个完全本地的 Android 应用。",
    visual: "todo",
    secondary: { repo: "todo-releases", label: "安装包仓库" },
  },
  {
    id: "harmony",
    name: "HarmonyCraft",
    eyebrow: "MINECRAFT · 模组探索",
    category: "游戏模组",
    color: "green",
    icon: "box",
    repo: "HarmonyCraft-1.20.1-Forge",
    tags: ["Java", "Minecraft 1.20.1", "Forge"],
    description:
      "为方块世界写一些新可能。基于 Minecraft 1.20.1 与 Forge 的模组项目，持续探索游戏开发。",
    visual: "harmony",
  },
  {
    id: "blog",
    name: "myBlog",
    eyebrow: "WEB · 个人空间",
    category: "网站",
    color: "blue",
    icon: "code-2",
    repo: "myBlog",
    tags: ["Tailwind CSS", "Vite", "JavaScript"],
    description:
      "就是你正在浏览的这个小站。用简洁的界面，连接我的项目、开发记录和日常想法。",
    visual: "blog",
  },
  {
    id: "profile",
    name: "GitHub Profile",
    eyebrow: "GITHUB · 个人主页",
    category: "其他",
    color: "gray",
    icon: "github",
    repo: "zeze49024",
    tags: ["GitHub", "Profile"],
    description:
      "GitHub 个人主页配置仓库。所有公开探索的另一个入口，也是一份持续更新的自我介绍。",
    visual: "profile",
  },
];

export const posts = [
  {
    id: "hello-world",
    category: "建站记录",
    title: "你好，世界。这里是我的新起点。",
    excerpt:
      "从一个域名开始，给项目和想法找一个自己的位置。关于这个小站的第一份设计记录。",
    date: "2026.10.22",
    read: "2 分钟",
    icon: "sparkles",
    color: "blue",
    status: "设计草稿",
    body: [
      [
        "一个自己的空间",
        "这是 zeze49024.com 的第一版界面设计。这里将用来介绍 zeze49024，展示编程项目，并整理开发过程中的记录。",
      ],
      [
        "从简洁开始",
        "第一版采用单页滚动布局，以黑白灰为底色，用蓝色标记主要操作。默认浅色，也可以手动切换到深色。",
      ],
      [
        "让项目成为主角",
        "项目卡片直接链接 GitHub 仓库。项目简介来自当前可核实的公开仓库和本地项目说明；卡片内的界面是设计示意，并非产品截图。",
      ],
      [
        "接下来",
        "这一篇由建站需求整理而成，用于评审博客的阅读体验。正式上线前仍需要确认文章内容、准备正式文章，并完成部署与域名配置。",
      ],
    ],
  },
  {
    id: "local-first",
    category: "开发随记",
    title: "当工具回归本地，使用可以更简单。",
    excerpt: "以待办应用为例，记录本地存储、专注体验与界面取舍。",
    date: "待发布",
    read: "示例文章",
    icon: "hard-drive",
    color: "violet",
    status: "内容示例",
    body: [
      [
        "内容示例说明",
        "这是一篇用于验证阅读排版的示例，并非已发表的个人观点或开发日志。",
      ],
      [
        "可以记录什么",
        "正式文章可以从 myToDoList 的本地存储、手动备份、局域网同步和专注计时切入，结合真实开发过程补充设计原因。",
      ],
      [
        "等待你的故事",
        "在这里放入真正发生过的问题、尝试和结论。示例内容在正式发布前替换或移除。",
      ],
    ],
  },
  {
    id: "small-details",
    category: "界面探索",
    title: "让每一次点击，都有一点好反馈。",
    excerpt: "从主题切换到卡片悬浮，探索克制界面里的丰富动效。",
    date: "待发布",
    read: "示例文章",
    icon: "mouse-pointer-2",
    color: "green",
    status: "内容示例",
    body: [
      [
        "内容示例说明",
        "本篇是 UI 原型的示例内容，用于展示标签、标题、段落与阅读排版。",
      ],
      [
        "动效的作用",
        "这个原型通过滚动入场、卡片高亮和按钮反馈建立视觉层次。它们帮助访客感知交互，也支持系统的减少动态效果设置。",
      ],
      [
        "留给后续的记录",
        "正式文章可以补充实际项目里的动效设计与对比，示例不会冒充已发布的原创文章。",
      ],
    ],
  },
];
