import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "react-app"),
  base: "./",
  plugins: [react()],
  build: {
    outDir: resolve(projectRoot, "dist-react"),
    emptyOutDir: true
  }
});
