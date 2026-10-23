import fs from "node:fs";
import { execFileSync } from "node:child_process";

const baseline = JSON.parse(fs.readFileSync("security/login-baseline.json", "utf8"));
const app = fs.readFileSync("src/App.jsx", "utf8");
const css = fs.readFileSync("src/styles/screens.css", "utf8");
const login = app.match(/function Login\([\s\S]*?\n}\n\nexport default function App\(\)/)?.[0].replace(/\n\nexport default function App\(\)$/, "");
const cssBlock = css.slice(css.lastIndexOf("/* Login: fundo cinza claro"));
const errors = [];
if (!login || login !== baseline.login) errors.push("Componente Login modificado.");
if (!cssBlock || cssBlock !== baseline.css) errors.push("Estilos específicos de login modificados.");

const base = process.env.PR_BASE_SHA;
if (base) {
  const changed = execFileSync("git", ["diff", "--name-only", base, "HEAD"], { encoding: "utf8" }).trim().split("\n");
  const sensitive = new Set([
    "src/styles.css", "src/main.jsx", "index.html", "package.json", "package-lock.json",
    "imagens/logo-oficial-rr.svg", "src/App.jsx", "src/styles/screens.css",
    "security/login-baseline.json", "scripts/check-login-lock.mjs",
    ".github/workflows/login-lock.yml"
  ]);
  for (const path of changed) {
    if (sensitive.has(path) && !["src/App.jsx", "src/styles/screens.css"].includes(path)) {
      errors.push("Arquivo com impacto potencial no login alterado: " + path);
    }
  }
}
if (errors.length) {
  console.error("BLOQUEIO DA TELA DE LOGIN:\n" + errors.map(e => "- " + e).join("\n"));
  console.error("Solicite autorização do proprietário e revisão da proteção antes de qualquer alteração.");
  process.exit(1);
}
console.log("Tela de login preservada conforme versão aprovada.");
