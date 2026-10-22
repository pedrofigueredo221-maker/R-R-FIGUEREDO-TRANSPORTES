import { defineConfig } from "vite";
import { cpSync, mkdirSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "react-app"),
  base: "./",
  plugins: [react(), {
    name: "copy-shared-images",
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
