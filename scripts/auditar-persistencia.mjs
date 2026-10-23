// Auditoria estática, somente leitura: não conecta ao Supabase nem acessa dados reais.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (p) => readFileSync(resolve(root, p), "utf8");
const app = read("src/App.jsx");
const backup = read("banco-de-dados/supabase/backup-supabase.ps1");
const migration = read("supabase/migrations/20261022_app_state_write_roles.sql");
const checks = [
  ["Leitura do estado compartilhado", /from\(["']app_state["']\)\.select\(["']data,version["']\)/.test(app)],
  ["Gravação condicional por versão", /\.eq\(["']version["'],\s*expectedVersion\)/.test(app)],
  ["Gravação com confirmação do banco", /if\s*\(!updated\s*\|\|\s*updated\.length\s*===\s*0\)/.test(app)],
  ["RLS da tabela principal", /alter table public\.app_state enable row level security/i.test(migration)],
  ["Restrição de escrita no banco", /current_user_can_write_app_state\(\)/.test(migration)],
  ["Backup exige URL privada externa", /\$env:SUPABASE_DB_URL/.test(backup)],
  ["Backup inclui exportação de dados", /--data-only/.test(backup)],
  ["Backup não versionado", existsSync(resolve(root, ".gitignore")) && /backups/.test(read(".gitignore"))],
  ["Nenhum service_role no config público", !/SUPABASE_SERVICE_ROLE|service_role\s*:/i.test(read("banco-de-dados/supabase/app-config.js"))]
];
let failed = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? "OK" : "FALHA"} - ${name}\n`);
  if (!pass) failed++;
}
process.stdout.write("\nAuditoria estática: não verifica políticas aplicadas, conteúdo real do banco ou backups existentes.\n");
if (failed) process.exitCode = 1;
