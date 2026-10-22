export class InputError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}
const text = (value, name, max = 200, optional = false) => {
  if (optional && (value === undefined || value === "")) return "";
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    throw new InputError(`${name}格式不正确`);
  return value.trim();
};
const choice = (value, name, values) => {
  if (!values.includes(value)) throw new InputError(`${name}不受支持`);
  return value;
};
const repository = (value) => {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9_.-]{1,100}$/.test(value) ||
    value === "." ||
    value === ".."
  )
    throw new InputError("请填写有效的 GitHub 仓库名");
  return value;
};
export function validateRevision(value) {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new InputError("缺少内容版本，请刷新后重试");
  return value;
}
export function validateContent(kind, input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new InputError("内容格式不正确");
  if (typeof input.published !== "boolean")
    throw new InputError("请选择发布状态");
  if (
    !Number.isSafeInteger(input.sortOrder) ||
    input.sortOrder < 0 ||
    input.sortOrder > 100000
  )
    throw new InputError("排序必须是 0–100000 的整数");
  const common = { published: input.published, sortOrder: input.sortOrder };
  const color = choice(input.color, "强调色", [
    "blue",
    "violet",
    "green",
    "gray",
  ]);
  if (kind === "projects") {
    if (!Array.isArray(input.tags) || input.tags.length > 8)
      throw new InputError("最多填写 8 个标签");
    return {
      ...common,
      color,
      name: text(input.name, "项目名称", 80),
      eyebrow: text(input.eyebrow, "项目副标题", 100),
      category: choice(input.category, "项目分类", [
        "桌面应用",
        "移动应用",
        "游戏模组",
        "网站",
        "其他",
      ]),
      repo: repository(input.repo),
      description: text(input.description, "项目简介", 500),
      tags: input.tags.map((tag) => text(tag, "标签", 40)),
      visual: choice(input.visual, "卡片视觉", [
        "orvia",
        "todo",
        "harmony",
        "blog",
        "profile",
      ]),
      ...(input.secondary?.repo
        ? {
            secondary: {
              repo: repository(input.secondary.repo),
              label: text(input.secondary.label, "补充链接名称", 40),
            },
          }
        : {}),
    };
  }
  if (
    !Array.isArray(input.body) ||
    input.body.length < 1 ||
    input.body.length > 100
  )
    throw new InputError("正文需要包含 1–100 个段落");
  return {
    ...common,
    color,
    title: text(input.title, "文章标题", 160),
    category: text(input.category, "文章分类", 40),
    excerpt: text(input.excerpt, "摘要", 500),
    date: text(input.date, "日期", 30),
    read: text(input.read, "阅读时间", 30),
    icon: choice(input.icon, "文章图标", [
      "sparkles",
      "hard-drive",
      "mouse-pointer-2",
      "book-open",
      "code-2",
    ]),
    status: input.published ? "已发布" : "草稿",
    body: input.body.map((item) => {
      if (!Array.isArray(item) || item.length !== 2)
        throw new InputError("正文格式不正确");
      return [
        text(item[0], "段落标题", 160, true),
        text(item[1], "段落内容", 10000),
      ];
    }),
  };
}
export function validateSettings(input) {
  let bilibili = text(input.bilibili, "B 站主页", 250);
  if (bilibili) {
    try {
      const url = new URL(bilibili);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "space.bilibili.com" ||
        !/^\/\d+\/?$/.test(url.pathname) ||
        url.username ||
        url.password ||
        url.port
      )
        throw new Error();
      bilibili = `${url.origin}${url.pathname}`;
    } catch {
      throw new InputError("B 站链接必须是 https://space.bilibili.com/数字ID");
    }
  }
  return {
    name: text(input.name, "昵称", 60),
    location: text(input.location, "所在地", 100),
    bio: text(input.bio, "介绍", 1000),
    bilibili,
    footerNote: text(input.footerNote, "页脚文案", 160),
  };
}
