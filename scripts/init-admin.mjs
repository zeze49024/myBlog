import { resolve } from "node:path";
import { openStore } from "../server/store.js";
import { hashPassword } from "../server/security.js";

// 只从标准输入接收密码，不接受命令行密码参数，不输出密码或哈希。
let input = "";
for await (const chunk of process.stdin) {
  input += chunk;
  if (input.length > 4096) throw new Error("输入过长");
}
const password = input.replace(/\r?\n$/, "");
if (password.length < 6 || password.length > 256)
  throw new Error("密码长度应为 6–256 个字符");
const db = openStore(resolve(process.env.DATA_DIR || "data"));
try {
  const exists = db.prepare("SELECT id FROM admin WHERE id=1").get();
  if (exists && !process.argv.includes("--reset"))
    throw new Error("账号已初始化；如需重设，请显式使用 --reset");
  const hash = await hashPassword(password);
  db.exec("BEGIN IMMEDIATE");
  db.prepare(
    "INSERT INTO admin(id,username,password_hash) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET username=excluded.username,password_hash=excluded.password_hash",
  ).run("zeze49024", hash);
  db.exec("DELETE FROM sessions; COMMIT");
  console.log(
    "站长账号已初始化；密码仅以带随机盐的 scrypt 哈希保存在服务端数据库。",
  );
} finally {
  db.close();
}
