import express from "express";
import helmet from "helmet";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { openStore, listContent, readSettings, audit } from "./store.js";
import { token, digest, verifyPassword } from "./security.js";
import {
  InputError,
  validateContent,
  validateSettings,
  validateRevision,
} from "./validation.js";

export function createApp({
  dataDir,
  origin,
  adminOrigin = origin,
  production = false,
  distDir = resolve("dist"),
  now = Date.now,
}) {
  const expectedOrigin = new URL(adminOrigin).origin;
  if (
    production &&
    [origin, adminOrigin].some((value) => new URL(value).protocol !== "https:")
  )
    throw new Error("生产环境 APP_ORIGIN 和 ADMIN_ORIGIN 必须使用 HTTPS");
  const db = openStore(dataDir);
  const app = express();
  app.disable("x-powered-by");
  // 生产服务只映射至宿主机回环地址，Nginx 覆写转发头；Docker 网桥是一跳代理。
  app.set("trust proxy", production ? 1 : "loopback");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      strictTransportSecurity: production ? undefined : false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use("/api", express.json({ limit: "256kb", strict: true }));
  app.use("/api", (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    if (
      req.headers.origin !== expectedOrigin ||
      req.headers["sec-fetch-site"] === "cross-site"
    )
      return res.status(403).json({ error: "请求来源不受信任" });
    if (!req.is("application/json"))
      return res.status(415).json({ error: "请使用 JSON 提交" });
    next();
  });
  const cookieName = production ? "__Host-zeze_session" : "zeze_session";
  const cookieOptions = {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    path: "/",
  };
  function session(req) {
    const raw = req.headers.cookie
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null;
    return db
      .prepare("SELECT * FROM sessions WHERE hash=? AND expires>?")
      .get(digest(raw), now());
  }
  const authenticated = (req, res, next) => {
    const current = session(req);
    if (!current)
      return res.status(401).json({ error: "登录已过期，请重新登录" });
    if (
      !["GET", "HEAD"].includes(req.method) &&
      req.headers["x-csrf-token"] !== current.csrf
    )
      return res.status(403).json({ error: "请求校验失败，请刷新后重试" });
    req.session = current;
    next();
  };
  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.get("/api/site", (req, res) => {
    const clean = ({ revision, updated, published, ...value }) => value;
    res.json({
      profile: clean(readSettings(db)),
      projects: listContent(db, "projects", true).map(clean),
      posts: listContent(db, "posts", true).map(clean),
    });
  });
  let hashing = 0;
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length > 80 ||
      password.length > 256 ||
      !password
    )
      return res.status(400).json({ error: "请填写账号和密码" });
    const admin = db.prepare("SELECT * FROM admin WHERE id=1").get();
    if (!admin)
      return res
        .status(503)
        .json({ error: "站长账号尚未初始化，请在服务器执行初始化命令" });
    const time = now();
    db.prepare("DELETE FROM attempts WHERE expires<=?").run(time);
    db.prepare("DELETE FROM sessions WHERE expires<=?").run(time);
    const ipKey = digest(`login:${req.ip}`);
    const globalKey = "login:global";
    const ip = db.prepare("SELECT * FROM attempts WHERE key=?").get(ipKey);
    const global = db
      .prepare("SELECT * FROM attempts WHERE key=?")
      .get(globalKey);
    if ((ip?.count || 0) >= 5 || (global?.count || 0) >= 50 || hashing >= 2) {
      res.set(
        "Retry-After",
        String(
          Math.max(1, Math.ceil(((ip?.expires || time + 60000) - time) / 1000)),
        ),
      );
      return res.status(429).json({ error: "尝试次数过多，请稍后再试" });
    }
    const add = db.prepare(
      "INSERT INTO attempts(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
    );
    add.run(ipKey, time + 15 * 60 * 1000);
    add.run(globalKey, time + 15 * 60 * 1000);
    hashing++;
    let valid;
    try {
      valid = await verifyPassword(password, admin.password_hash);
    } finally {
      hashing--;
    }
    if (!valid || username !== admin.username)
      return res.status(401).json({ error: "账号或密码不正确" });
    db.prepare("DELETE FROM attempts WHERE key=?").run(ipKey);
    const raw = token(),
      csrf = token(),
      expires = now() + 12 * 60 * 60 * 1000;
    const previous = session(req);
    if (previous)
      db.prepare("DELETE FROM sessions WHERE hash=?").run(previous.hash);
    db.prepare("INSERT INTO sessions(hash,csrf,expires) VALUES(?,?,?)").run(
      digest(raw),
      csrf,
      expires,
    );
    res.cookie(cookieName, raw, {
      ...cookieOptions,
      maxAge: 12 * 60 * 60 * 1000,
    });
    audit(db, "login", admin.username);
    res.json({ username: admin.username, csrfToken: csrf, expires });
  });
  app.get("/api/auth/session", authenticated, (req, res) =>
    res.json({
      username: db.prepare("SELECT username FROM admin WHERE id=1").get()
        .username,
      csrfToken: req.session.csrf,
      expires: req.session.expires,
    }),
  );
  app.post("/api/auth/logout", authenticated, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE hash=?").run(req.session.hash);
    res.clearCookie(cookieName, cookieOptions);
    res.json({ ok: true });
  });
  app.use("/api/admin", authenticated);
  app.get("/api/admin/content", (req, res) =>
    res.json({
      profile: readSettings(db),
      projects: listContent(db, "projects"),
      posts: listContent(db, "posts"),
      activity: db
        .prepare(
          "SELECT action,target,created FROM audit ORDER BY id DESC LIMIT 12",
        )
        .all(),
    }),
  );
  app.put("/api/admin/profile", (req, res) => {
    const value = validateSettings(req.body),
      revision = validateRevision(req.body.revision);
    const result = db
      .prepare(
        "UPDATE settings SET data=?,revision=revision+1 WHERE id=1 AND revision=?",
      )
      .run(JSON.stringify(value), revision);
    if (!result.changes)
      return res
        .status(409)
        .json({ error: "资料已在另一窗口更新，请刷新后重试" });
    audit(db, "update-profile", "profile");
    res.json(readSettings(db));
  });
  app.param("kind", (req, res, next, kind) => {
    if (!["projects", "posts"].includes(kind))
      return res.status(404).json({ error: "内容类型不存在" });
    next();
  });
  app.post("/api/admin/:kind", (req, res) => {
    const { published, sortOrder, ...value } = validateContent(
      req.params.kind,
      req.body,
    );
    const count = db
      .prepare("SELECT COUNT(*) AS total FROM content WHERE kind=?")
      .get(req.params.kind).total;
    if (count >= 1000) throw new InputError("内容数量已达到上限");
    const id = token().slice(0, 20);
    db.prepare(
      "INSERT INTO content(kind,id,data,published,sort_order,updated) VALUES(?,?,?,?,?,?)",
    ).run(
      req.params.kind,
      id,
      JSON.stringify(value),
      Number(published),
      sortOrder,
      new Date(now()).toISOString(),
    );
    audit(db, "create", `${req.params.kind}/${id}`);
    res.status(201).json({ id });
  });
  app.put("/api/admin/:kind/:id", (req, res) => {
    const { published, sortOrder, ...value } = validateContent(
        req.params.kind,
        req.body,
      ),
      revision = validateRevision(req.body.revision);
    const result = db
      .prepare(
        "UPDATE content SET data=?,published=?,sort_order=?,revision=revision+1,updated=? WHERE kind=? AND id=? AND revision=?",
      )
      .run(
        JSON.stringify(value),
        Number(published),
        sortOrder,
        new Date(now()).toISOString(),
        req.params.kind,
        req.params.id,
        revision,
      );
    if (!result.changes)
      return res.status(409).json({ error: "内容已更新或删除，请刷新后重试" });
    audit(db, "update", `${req.params.kind}/${req.params.id}`);
    res.json({ ok: true });
  });
  app.delete("/api/admin/:kind/:id", (req, res) => {
    const revision = validateRevision(req.body?.revision);
    const result = db
      .prepare("DELETE FROM content WHERE kind=? AND id=? AND revision=?")
      .run(req.params.kind, req.params.id, revision);
    if (!result.changes)
      return res.status(409).json({ error: "内容已更新或删除，请刷新后重试" });
    audit(db, "delete", `${req.params.kind}/${req.params.id}`);
    res.json({ ok: true });
  });
  app.use("/api", (req, res) => res.status(404).json({ error: "接口不存在" }));
  if (existsSync(distDir)) {
    app.use(
      express.static(distDir, {
        index: false,
        dotfiles: "deny",
        setHeaders(res, file) {
          res.set(
            "Cache-Control",
            /[\\/]assets[\\/]index-/.test(file)
              ? "public, max-age=31536000, immutable"
              : "no-cache",
          );
        },
      }),
    );
    app.get("/", (req, res) => res.sendFile(resolve(distDir, "index.html")));
    app.get(["/admin", "/admin/"], (req, res) => {
      res.set("X-Robots-Tag", "noindex, nofollow");
      res.sendFile(resolve(distDir, "admin.html"));
    });
  }
  app.use((req, res) => res.status(404).send("页面不存在"));
  app.use((error, req, res, next) => {
    const status = error.status || 500;
    if (status >= 500) console.error("Server request failed:", error.name);
    res.status(status).json({
      error:
        status === 413
          ? "提交的内容过大"
          : status >= 500
            ? "服务暂时不可用，请稍后重试"
            : error instanceof InputError
              ? error.message
              : "请求格式不正确",
    });
  });
  return { app, db };
}
