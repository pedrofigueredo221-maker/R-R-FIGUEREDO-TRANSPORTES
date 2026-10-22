# SQL e banco da camada offline

A escolha atual para o banco central offline é **PostgreSQL local**, configurado em `offline/postgres/`.

- `../postgres/docker-compose.yml`: inicia o serviço PostgreSQL local com volume persistente.
- `../postgres/.env.example`: modelo de configuração; copie para `.env` e altere a senha.
- `../postgres/init/001-local-metadata.sql`: registra o estado da migração, sem dados reais.
- `../postgres/README.md`: instruções, exportação e cuidados de migração.
- `../local-store.js`: protótipo separado de cache/fila por navegador (IndexedDB).
- `../../supabase.sql`, `../../supabase-login.sql`, `../../supabase-visitor-role.sql` e `../../supabase/migrations/`: scripts do Supabase atual; revisar antes de executar.

## Situação real

A configuração do PostgreSQL local está versionada, mas os dados reais ainda precisam ser exportados do Supabase e importados/validados no computador autorizado. Nenhum dado de produção foi copiado por esta PR, nenhum SQL foi executado no Supabase e o site publicado permanece inalterado.

Nunca coloque dumps reais, dados de clientes/fretes/financeiro, senhas, chaves privadas ou strings de conexão neste repositório público. Backups reais devem ficar em `backups/local/`, ignorada pelo Git, e em outra cópia privada independente.
