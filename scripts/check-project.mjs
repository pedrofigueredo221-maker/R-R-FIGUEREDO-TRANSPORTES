import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const html = read("index.html");
const app = read("app.js");
const sync = read("sync.js");
const failures = [];
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
const idSet = new Set(ids);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicates.length) failures.push(`IDs duplicados no index.html: ${duplicates.join(", ")}`);

const appRefs = [...app.matchAll(/\$\(["']([^"']+)["']\)/g)].map((match) => match[1]);
const dynamicIds = new Set(["ocrRawText"]); // criado dinamicamente após OCR da foto
const missingApp = [...new Set(appRefs.filter((id) => !idSet.has(id) && !dynamicIds.has(id)))];
if (missingApp.length) failures.push(`IDs usados em app.js ausentes no HTML: ${missingApp.join(", ")}`);

const syncRefs = [...sync.matchAll(/\bel\(["']([^"']+)["']\)/g)].map((match) => match[1]);
const missingSync = [...new Set(syncRefs.filter((id) => !idSet.has(id)))];
if (missingSync.length) failures.push(`IDs usados em sync.js ausentes no HTML: ${missingSync.join(", ")}`);

const requiredFiles = ["styles.css", "config.js", "app.js", "sync.js", "logo.svg", "favicon.svg", "redefinir-senha.html"];
for (const path of requiredFiles) if (!existsSync(new URL(`../${path}`, import.meta.url))) failures.push(`Arquivo necessário ausente: ${path}`);

if (!sync.includes('lastScreen = sessionStorage.getItem("rr_screen_state")') || !sync.includes("showLogin(true, false)")) {
  failures.push("A restauração da sessão precisa preservar rr_screen_state antes de exibir o login.");
}

if (failures.length) {
  console.error("Falhas na auditoria estática:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Auditoria estática OK: ${idSet.size} IDs únicos, ${appRefs.length} referências de app.js e ${syncRefs.length} referências de sync.js verificadas.`);
}
