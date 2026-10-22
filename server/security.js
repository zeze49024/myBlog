import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
export const token = () => randomBytes(32).toString("hex");
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(32).toString("hex");
  const key = await derive(password, salt, 64, options);
  return `scrypt$131072$8$1$${salt}$${key.toString("hex")}`;
}
export async function verifyPassword(password, hash) {
  const [type, n, r, p, salt, stored] = hash.split("$");
  if (
    type !== "scrypt" ||
    n !== "131072" ||
    r !== "8" ||
    p !== "1" ||
    !/^[a-f0-9]{64}$/.test(salt || "") ||
    !/^[a-f0-9]{128}$/.test(stored || "")
  )
    return false;
  const key = await derive(password, salt, 64, options);
  return timingSafeEqual(key, Buffer.from(stored, "hex"));
}
