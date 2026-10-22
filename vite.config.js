import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "web",
  base: "/",
  plugins: [
    tailwindcss(),
    {
      name: "admin-route",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (/^\/admin\/?(?:\?|$)/.test(req.url || ""))
            req.url = req.url.replace(/^\/admin\/?/, "/admin.html");
          next();
        });
      },
    },
  ],
  server: { proxy: { "/api": "http://127.0.0.1:5180" } },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        home: resolve(import.meta.dirname, "web/index.html"),
        admin: resolve(import.meta.dirname, "web/admin.html"),
      },
    },
  },
});
