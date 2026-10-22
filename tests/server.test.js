import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createApp } from "../server/app.js";
import { hashPassword, verifyPassword, digest } from "../server/security.js";
import { openStore } from "../server/store.js";
import { escapeHTML, escapeTree } from "../web/src/safe.js";

const origin = "http://127.0.0.1:5180";
const password = "fixture-password-only";
let hash;
before(async () => {
  hash = await hashPassword(password);
});
async function fixture(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), "myblog-test-"));
  let clock = Date.now();
  const { app, db } = createApp({
    dataDir: dir,
    origin,
    now: () => clock,
    ...options,
  });
  db.prepare("INSERT INTO admin(id,username,password_hash) VALUES(1,?,?)").run(
    "zeze49024",
    hash,
  );
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (
    path,
    {
      method = "GET",
      body,
      cookie,
      csrf,
      requestOrigin = options.adminOrigin || options.origin || origin,
    } = {},
  ) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(method !== "GET" ? { Origin: requestOrigin } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: response.status,
      headers: response.headers,
      data: await response.json().catch(() => null),
    };
  };
  const login = async () => {
    const result = await call("/api/auth/login", {
      method: "POST",
      body: { username: "zeze49024", password },
    });
    assert.equal(result.status, 200);
    return {
      cookie: result.headers.get("set-cookie").split(";")[0],
      csrf: result.data.csrfToken,
      result,
    };
  };
  return {
    dir,
    db,
    call,
    login,
    advance: (ms) => {
      clock += ms;
    },
    async close() {
      await new Promise((resolve) => server.close(resolve));
      db.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
async function withFixture(fn, options) {
  const f = await fixture(options);
  try {
    await fn(f);
  } finally {
    await f.close();
  }
}

test("password uses salted scrypt and verifies without storing plaintext", async () => {
  assert.match(hash, /^scrypt\$131072\$8\$1\$/);
  assert.ok(!hash.includes(password));
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("incorrect", hash), false);
  assert.equal(await verifyPassword(password, "invalid"), false);
});
test("anonymous access cannot read or mutate admin content", () =>
  withFixture(async (f) => {
    for (const [path, method, body] of [
      ["/api/admin/content", "GET"],
      ["/api/admin/projects", "POST", {}],
      ["/api/admin/posts/hello-world", "DELETE", { revision: 1 }],
      ["/api/auth/session", "GET"],
    ])
      assert.equal((await f.call(path, { method, body })).status, 401);
  }));
test("public API hides drafts and credentials", () =>
  withFixture(async (f) => {
    const result = await f.call("/api/site");
    assert.equal(result.status, 200);
    assert.equal(result.data.projects.length, 5);
    assert.equal(result.data.posts.length, 0);
    const text = JSON.stringify(result.data);
    assert.ok(!text.includes("hello-world"));
    assert.ok(!text.includes("password"));
    assert.ok(!text.includes("csrf"));
    assert.ok(!text.includes("revision"));
  }));
test("wrong account and password fail with a generic response", () =>
  withFixture(async (f) => {
    const wrongPassword = await f.call("/api/auth/login", {
      method: "POST",
      body: { username: "zeze49024", password: "wrong" },
    });
    const wrongUser = await f.call("/api/auth/login", {
      method: "POST",
      body: { username: "someone-else", password },
    });
    assert.equal(wrongPassword.status, 401);
    assert.deepEqual(wrongPassword.data, wrongUser.data);
  }));
test("session cookie is HttpOnly and Strict, token is hashed in SQLite", () =>
  withFixture(async (f) => {
    const { cookie, result } = await f.login();
    assert.match(result.headers.get("set-cookie"), /HttpOnly/);
    assert.match(result.headers.get("set-cookie"), /SameSite=Strict/i);
    const stored = f.db.prepare("SELECT * FROM sessions").get();
    const raw = cookie.split("=")[1];
    assert.notEqual(stored.hash, raw);
    assert.equal(stored.hash, digest(raw));
    assert.equal(
      (await f.call("/api/auth/session", { cookie })).data.username,
      "zeze49024",
    );
  }));
test("cross-origin login and mutations are rejected", () =>
  withFixture(async (f) => {
    assert.equal(
      (
        await f.call("/api/auth/login", {
          method: "POST",
          requestOrigin: "https://evil.example",
          body: { username: "zeze49024", password },
        })
      ).status,
      403,
    );
    const auth = await f.login();
    assert.equal(
      (
        await f.call("/api/auth/logout", {
          method: "POST",
          ...auth,
          body: {},
          requestOrigin: "https://evil.example",
        })
      ).status,
      403,
    );
  }));
test("CSRF is required and logout revokes the server session", () =>
  withFixture(async (f) => {
    const auth = await f.login();
    assert.equal(
      (
        await f.call("/api/auth/logout", {
          method: "POST",
          cookie: auth.cookie,
          body: {},
        })
      ).status,
      403,
    );
    assert.equal(
      (await f.call("/api/auth/logout", { method: "POST", ...auth, body: {} }))
        .status,
      200,
    );
    assert.equal((await f.call("/api/auth/session", auth)).status, 401);
  }));
test("sessions expire on the server", () =>
  withFixture(async (f) => {
    const auth = await f.login();
    f.advance(12 * 60 * 60 * 1000 + 1);
    assert.equal((await f.call("/api/auth/session", auth)).status, 401);
  }));
test("failed login throttling persists and clears after the time window", () =>
  withFixture(async (f) => {
    for (let n = 0; n < 5; n++)
      assert.equal(
        (
          await f.call("/api/auth/login", {
            method: "POST",
            body: { username: "zeze49024", password: "wrong" },
          })
        ).status,
        401,
      );
    const blocked = await f.call("/api/auth/login", {
      method: "POST",
      body: { username: "zeze49024", password },
    });
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
    f.advance(15 * 60 * 1000 + 1);
    await f.login();
  }));
test("post draft, publish, conflict protection and deletion form a complete workflow", () =>
  withFixture(async (f) => {
    const auth = await f.login();
    const item = {
      title: "Integration article",
      category: "测试",
      excerpt: "A real persistent draft",
      date: "2026.10.22",
      read: "1 分钟",
      icon: "book-open",
      color: "blue",
      published: false,
      sortOrder: 0,
      body: [["标题", "<script>alert(1)</script>"]],
    };
    const created = await f.call("/api/admin/posts", {
      method: "POST",
      ...auth,
      body: item,
    });
    assert.equal(created.status, 201);
    const id = created.data.id;
    assert.equal((await f.call("/api/site")).data.posts.length, 0);
    const current = (await f.call("/api/admin/content", auth)).data.posts.find(
      (p) => p.id === id,
    );
    assert.equal(current.title, item.title);
    assert.equal(
      (
        await f.call(`/api/admin/posts/${id}`, {
          method: "PUT",
          ...auth,
          body: { ...current, published: true },
        })
      ).status,
      200,
    );
    const pub = (await f.call("/api/site")).data.posts[0];
    assert.equal(pub.title, item.title);
    assert.equal(pub.status, "已发布");
    assert.equal(
      (
        await f.call(`/api/admin/posts/${id}`, {
          method: "PUT",
          ...auth,
          body: current,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await f.call(`/api/admin/posts/${id}`, {
          method: "DELETE",
          ...auth,
          body: { revision: 2 },
        })
      ).status,
      200,
    );
    assert.equal((await f.call("/api/site")).data.posts.length, 0);
  }));
test("project and profile validation reject dangerous URLs and invalid enums", () =>
  withFixture(async (f) => {
    const auth = await f.login();
    const all = (await f.call("/api/admin/content", auth)).data;
    for (const patch of [
      { repo: "javascript:alert(1)" },
      { category: '" onload="x' },
      { tags: new Array(9).fill("x") },
      { visual: "<svg>" },
    ])
      assert.equal(
        (
          await f.call("/api/admin/projects", {
            method: "POST",
            ...auth,
            body: { ...all.projects[0], ...patch },
          })
        ).status,
        400,
      );
    assert.equal(
      (
        await f.call("/api/admin/profile", {
          method: "PUT",
          ...auth,
          body: { ...all.profile, bilibili: "javascript:alert(1)" },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await f.call("/api/admin/profile", {
          method: "PUT",
          ...auth,
          body: {
            ...all.profile,
            bilibili: "https://space.bilibili.com.evil.example/1",
          },
        })
      ).status,
      400,
    );
  }));
test("profile changes are immediately public and content survives reopening SQLite", () =>
  withFixture(async (f) => {
    const auth = await f.login();
    const original = (await f.call("/api/admin/content", auth)).data.profile;
    const result = await f.call("/api/admin/profile", {
      method: "PUT",
      ...auth,
      body: { ...original, bio: "Updated biography" },
    });
    assert.equal(result.status, 200);
    assert.equal(
      (await f.call("/api/site")).data.profile.bio,
      "Updated biography",
    );
    const reopened = openStore(f.dir);
    assert.equal(
      JSON.parse(
        reopened.prepare("SELECT data FROM settings WHERE id=1").get().data,
      ).bio,
      "Updated biography",
    );
    reopened.close();
    assert.throws(() =>
      f.db
        .prepare("INSERT INTO admin(id,username,password_hash) VALUES(2,?,?)")
        .run("other", hash),
    );
  }));
test("production refuses HTTP origins and sets Secure __Host cookies under HTTPS", async () => {
  assert.throws(
    () => createApp({ dataDir: "unused", origin, production: true }),
    /HTTPS/,
  );
  await withFixture(
    async (f) => {
      const auth = await f.login();
      assert.match(
        auth.result.headers.get("set-cookie"),
        /^__Host-zeze_session=/,
      );
      assert.match(auth.result.headers.get("set-cookie"), /; Secure/);
    },
    { origin: "https://zeze49024.com", production: true },
  );
});
test("stored content is escaped before rendering including nested article paragraphs", () => {
  assert.equal(
    escapeHTML('<img src=x onerror="evil()">'),
    "&lt;img src=x onerror=&quot;evil()&quot;&gt;",
  );
  const value = escapeTree({ body: [["<svg>", '"quoted" & text']] });
  assert.equal(value.body[0][0], "&lt;svg&gt;");
  assert.equal(value.body[0][1], "&quot;quoted&quot; &amp; text");
});

test("separate admin origin accepts owner login and rejects public-site writes", async () => {
  assert.throws(
    () =>
      createApp({
        dataDir: "unused",
        origin: "https://zeze49024.com",
        adminOrigin: "http://admin.zeze49024.com",
        production: true,
      }),
    /HTTPS/,
  );
  await withFixture(
    async (f) => {
      const auth = await f.login();
      assert.equal((await f.call("/api/admin/content", auth)).status, 200);
      for (const requestOrigin of [
        "https://zeze49024.com",
        "https://evil.example",
      ]) {
        assert.equal(
          (
            await f.call("/api/auth/login", {
              method: "POST",
              requestOrigin,
              body: { username: "zeze49024", password },
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await f.call("/api/auth/logout", {
              method: "POST",
              requestOrigin,
              ...auth,
              body: {},
            })
          ).status,
          403,
        );
      }
      assert.equal((await f.call("/api/auth/session", auth)).status, 200);
      assert.equal(
        (
          await f.call("/api/auth/logout", {
            method: "POST",
            ...auth,
            body: {},
          })
        ).status,
        200,
      );
    },
    {
      origin: "https://zeze49024.com",
      adminOrigin: "https://admin.zeze49024.com",
      production: true,
    },
  );
});
test("private filesystem and unrecognized routes are not served", () =>
  withFixture(async (f) => {
    for (const path of ["/data/site.sqlite", "/.env", "/server/app.js"])
      assert.equal((await f.call(path)).status, 404);
    assert.equal((await f.call("/api/unknown")).status, 404);
  }));
