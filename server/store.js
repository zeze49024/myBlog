import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { projects, posts } from "./seed.js";

export function openStore(dataDir) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(resolve(dataDir, "site.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY CHECK(id=1), username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS content (kind TEXT NOT NULL CHECK(kind IN ('projects','posts')), id TEXT NOT NULL, data TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 1, updated TEXT NOT NULL, PRIMARY KEY(kind,id));
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, action TEXT NOT NULL, target TEXT NOT NULL, created TEXT NOT NULL);
  `);
  if (!db.prepare("SELECT id FROM settings WHERE id=1").get()) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO settings(id,data) VALUES(1,?)").run(
        JSON.stringify({
          name: "zeze49024",
          location: "山东省济南市",
          bio: "在这里，用代码搭建想法，用文字记录过程。\n分享我的项目，也分享一路上的探索。",
          bilibili: "https://space.bilibili.com/1378527004",
          footerNote: "用好奇心构建，以热爱持续。",
        }),
      );
      const insert = db.prepare(
        "INSERT INTO content(kind,id,data,published,sort_order,updated) VALUES(?,?,?,?,?,?)",
      );
      projects.forEach((project, i) =>
        insert.run(
          "projects",
          project.id,
          JSON.stringify(project),
          1,
          i,
          new Date().toISOString(),
        ),
      );
      posts.forEach((post, i) =>
        insert.run(
          "posts",
          post.id,
          JSON.stringify(post),
          0,
          i,
          new Date().toISOString(),
        ),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  return db;
}

export function listContent(db, kind, publicOnly = false) {
  return db
    .prepare(
      `SELECT * FROM content WHERE kind=? ${publicOnly ? "AND published=1" : ""} ORDER BY sort_order ASC, updated DESC, id`,
    )
    .all(kind)
    .map((row) => ({
      ...JSON.parse(row.data),
      id: row.id,
      published: !!row.published,
      sortOrder: row.sort_order,
      revision: row.revision,
      updated: row.updated,
    }));
}
export function readSettings(db) {
  const row = db.prepare("SELECT * FROM settings WHERE id=1").get();
  return { ...JSON.parse(row.data), revision: row.revision };
}
export function audit(db, action, target) {
  db.prepare("INSERT INTO audit(action,target,created) VALUES(?,?,?)").run(
    action,
    target,
    new Date().toISOString(),
  );
}
