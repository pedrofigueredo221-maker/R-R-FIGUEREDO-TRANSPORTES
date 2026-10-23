import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const failures = [];

const requiredFiles = [
  "package.json",
  "vite.config.js",
  "react-app/index.html",
  "react-app/redefinir-senha.html",
  "react-app/src/main.jsx",
  "react-app/reset-main.jsx",
  "react-app/src/App.jsx",
  "react-app/src/PasswordReset.jsx",
  "react-app/src/styles.css",
  "react-app/src/styles/screens.css",
  "react-app/src/domain/freightCalculations.js",
  "react-app/src/domain/freightCalculations.test.js",
  "banco-de-dados/supabase/app-config.js"
];

for (const path of requiredFiles) {
  if (!existsSync(new URL(path, root))) failures.push(`Arquivo React necessário ausente: ${path}`);
}

const mainHtml = read("react-app/index.html");
const resetHtml = read("react-app/redefinir-senha.html");
const vite = read("vite.config.js");
const app = read("react-app/src/App.jsx");
const main = read("react-app/src/main.jsx");
const resetMain = read("react-app/reset-main.jsx");
const globalStyles = read("react-app/src/styles.css");
const screenStyles = read("react-app/src/styles/screens.css");
const freightForm = read("react-app/src/screens/FreightForm.jsx");
const editablePage = read("react-app/src/EditablePage.jsx");

if (!mainHtml.includes("./src/main.jsx")) failures.push("A entrada principal não carrega src/main.jsx.");
if (!resetHtml.includes("./reset-main.jsx")) failures.push("A página de recuperação não carrega reset-main.jsx.");
if (!main.includes("./styles.css") || !main.includes("./styles/screens.css")) failures.push("A entrada React principal não importa os dois arquivos CSS esperados.");
if (!resetMain.includes("./src/styles.css") || !resetMain.includes("./src/styles/screens.css")) failures.push("A página de recuperação não compartilha os estilos React.");
if (!vite.includes("react-app/redefinir-senha.html")) failures.push("O build Vite não inclui a página React de recuperação.");
if (!app.includes("redefinir-senha.html")) failures.push("O fluxo de recuperação de senha não aponta para a página React publicada.");

// Guardas contra o retorno das duplicidades visuais encontradas na auditoria.
if (globalStyles.includes("freight-summary")) failures.push("O resumo financeiro do frete deve ter estilos apenas em styles/screens.css.");
if ((screenStyles.match(/\.freight-editor \.freight-summary \{/g) || []).length !== 1) failures.push("O resumo financeiro deve possuir exatamente um bloco CSS base.");
if (globalStyles.includes("!important") || screenStyles.includes("!important")) failures.push("Evite !important nos estilos React; corrija a cascata na regra responsável.");
if (freightForm.includes("Intl.NumberFormat")) failures.push("FreightForm deve reutilizar o formatador de moeda compartilhado.");
if (editablePage.includes("Intl.NumberFormat") || editablePage.includes("const dateLabel =")) failures.push("EditablePage deve reutilizar os formatadores compartilhados.");
if (!freightForm.includes("freightCost(calculationInput)")) failures.push("O resumo de frete deve usar a função de domínio freightCost.");

const legacyPaths = [
  "index.html",
  "app.js",
  "sync.js",
  "styles.css",
  "config.js",
  "redefinir-senha.html",
  "js/core/startup.js",
  "js/core/utils.js",
  "banco-de-dados/supabase/config.js"
];
for (const path of legacyPaths) {
  if (existsSync(new URL(path, root))) failures.push(`Arquivo legado ainda presente: ${path}`);
}

if (failures.length) {
  console.error("Falhas na auditoria estrutural React:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Auditoria estrutural React OK: ${requiredFiles.length} arquivos essenciais presentes, entradas verificadas e ${legacyPaths.length} caminhos legados ausentes.`);
}
