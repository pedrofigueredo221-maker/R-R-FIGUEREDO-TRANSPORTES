# SQL da camada offline

Esta pasta guarda o esquema de referência para a futura API local da R&R Figueredo Transportes.

- `local-offline-schema.sql`: estrutura inicial para SQLite atrás de um serviço local autenticado.
- `../local-store.js`: protótipo de cache/fila por navegador (IndexedDB), separado do banco central.
- `../../supabase.sql`, `../../supabase-login.sql`, `../../supabase-visitor-role.sql` e `../../supabase/migrations/`: scripts do Supabase atual; revisar antes de executar.

## Importante

O SQL local é uma base de desenvolvimento, não foi aplicado em produção nem integrado ao sistema. Não contém dados reais. Não salve neste repositório dumps do Supabase, credenciais, connection strings ou cópias reais de clientes/fretes/financeiro. O backup real deve ficar em armazenamento privado fora do GitHub.
