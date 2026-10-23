import { defineConfig } from "vite";
import { cpSync, createReadStream, existsSync, mkdirSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve, sep } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: projectRoot,
  base: "./",
  plugins: [react(), {
    name: "copy-shared-images",
    configureServer(server) {
      const imageRoot = resolve(projectRoot, "imagens");
      server.middlewares.use("/imagens", (request, response, next) => {
        const relativePath = decodeURIComponent((request.url || "").split("?")[0].replace(/^\/+/, ""));
        const filePath = resolve(imageRoot, relativePath);
        if (!filePath.startsWith(imageRoot + sep) || !existsSync(filePath)) return next();
        const contentType = filePath.endsWith(".svg") ? "image/svg+xml" : filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") ? "image/jpeg" : "application/octet-stream";
        response.setHeader("Content-Type", contentType);
        createReadStream(filePath).pipe(response);
      });
      const configPath = resolve(projectRoot, "banco-de-dados", "supabase", "app-config.js");
      server.middlewares.use("/banco-de-dados/supabase/app-config.js", (_request, response, next) => {
        if (!existsSync(configPath)) return next();
        response.setHeader("Content-Type", "text/javascript; charset=utf-8");
        createReadStream(configPath).pipe(response);
      });
    },
    closeBundle() {
      const source = resolve(projectRoot, "imagens");
      const destination = resolve(projectRoot, "dist-react", "imagens");
      mkdirSync(destination, { recursive: true });
      cpSync(source, destination, { recursive: true });
      const configSource = resolve(projectRoot, "banco-de-dados", "supabase", "app-config.js");
      const configDestination = resolve(projectRoot, "dist-react", "banco-de-dados", "supabase", "app-config.js");
      mkdirSync(dirname(configDestination), { recursive: true });
      cpSync(configSource, configDestination);
    }
  }],
  build: {
    outDir: resolve(projectRoot, "dist-react"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(projectRoot, "index.html"),
        reset: resolve(projectRoot, "redefinir-senha.html")
      }
    }
  }
});
