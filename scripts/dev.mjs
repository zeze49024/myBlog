import { spawn } from "node:child_process";
const children = [
  spawn(
    process.execPath,
    ["--watch", "--env-file-if-exists=.env", "server/index.js"],
    {
      stdio: "inherit",
      env: { ...process.env, APP_ORIGIN: "http://127.0.0.1:5173" },
    },
  ),
  spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      "--port",
      "5173",
      "--strictPort",
    ],
    { stdio: "inherit" },
  ),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
children.forEach((child) => {
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => stop(code || 0));
});
