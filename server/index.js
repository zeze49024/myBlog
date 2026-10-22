import { resolve } from "node:path";
import { createApp } from "./app.js";
const port = Number(process.env.PORT || 5180);
const host = process.env.HOST || "127.0.0.1";
const { app, db } = createApp({
  dataDir: resolve(process.env.DATA_DIR || "data"),
  origin: process.env.APP_ORIGIN || `http://127.0.0.1:${port}`,
  production: process.env.NODE_ENV === "production",
});
const server = app.listen(port, host, () =>
  console.log(`Personal website: http://${host}:${port}  |  Admin: /admin`),
);
function close() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
