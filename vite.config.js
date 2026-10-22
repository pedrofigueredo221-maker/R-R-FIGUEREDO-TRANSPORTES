import { defineConfig } from "vite";
import { cpSync, createReadStream, existsSync, mkdirSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve, sep } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "react-app"),
  base: "./",
  plugins: [react(), {
    name: "copy-shared-images",
    configureServer(server) {
      const imageRoot = resolve(projectRoot, "imagens");
      server.middlewares.use("/imagens", (request, response, next) => {
        const relativePath = decodeURIComponent((request.url || "").split("?")[0].replace(/^\\/+/, ""));
        const filePath = resolve(imageRoot, relativePath);
        if (!filePath.startsWith(imageRoot + sep) || !existsSync(filePath)) return next();
        response.setHeader("Content-Type", filePath.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream");
        createReadStream(filePath).pipe(response);
      });
    },
    closeBundle() {
      const source = resolve(projectRoot, "imagens");
      const destination = resolve(projectRoot, "dist-react", "imagens");
      mkdirSync(destination, { recursive: true });
      cpSync(source, destination, { recursive: true });
    }
  }],
  build: {
    outDir: resolve(projectRoot, "dist-react"),
    emptyOutDir: true
  }
});
