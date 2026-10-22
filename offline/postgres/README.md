# PostgreSQL local — R&R Figueredo Transportes

Esta pasta configura um PostgreSQL local persistente via Docker. Ele fica separado do Supabase e não altera o site publicado nem o banco de produção.

## O que está pronto nesta etapa

- Serviço PostgreSQL 17 com volume persistente Docker.
- Porta local padrão 5433, vinculada apenas a `127.0.0.1` para não expor o banco na rede.
- Arquivo de exemplo de configuração sem credenciais reais.
- Tabela de metadados para acompanhar importação e validação.

**Ainda não contém os dados reais do Supabase e ainda não está conectado à aplicação.** A cópia real deve ser exportada no computador autorizado e validada antes de qualquer uso.

## 1. Pré-requisitos

Instale e inicie o Docker Desktop no Windows. Abra o PowerShell na raiz do projeto.

## 2. Preparar configuração

```powershell
Copy-Item offline/postgres/.env.example offline/postgres/.env
notepad offline/postgres/.env
```

Troque `POSTGRES_PASSWORD` por uma senha local forte. Não compartilhe o arquivo `.env` e não o envie ao GitHub.

## 3. Iniciar o banco local

```powershell
docker compose --env-file offline/postgres/.env -f offline/postgres/docker-compose.yml up -d
docker compose --env-file offline/postgres/.env -f offline/postgres/docker-compose.yml ps
```

A porta 5433 é acessível apenas no próprio computador nesta configuração. Para outros computadores acessarem o banco, será necessário configurar uma API local autenticada e regras de rede/firewall; não exponha diretamente a porta do PostgreSQL à internet.

## 4. Exportar os dados reais do Supabase

O esquema atual do projeto armazena o estado principal do sistema em `public.app_state` (JSONB). Faça um backup independente antes de migrar. Use o script já existente `scripts/backup-supabase.ps1` para guardar o backup completo acessível da aplicação em `backups/local/`; esse diretório é ignorado pelo Git.

Para exportar também o registro de estado principal em um SQL portátil, com o PostgreSQL client instalado, execute no PowerShell. A connection string é solicitada sem ser gravada em arquivo:

```powershell
$env:SUPABASE_DB_URL = Read-Host "Cole a connection string PostgreSQL do Supabase"
$env:PGPASSWORD = Read-Host "Senha do banco local (POSTGRES_PASSWORD do .env)"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force backups/local | Out-Null
pg_dump --dbname="$env:SUPABASE_DB_URL" --table=public.app_state --data-only --column-inserts --no-owner --no-privileges --file="backups/local/app-state-$stamp.sql"
if ($LASTEXITCODE -ne 0) { throw "Exportação de app_state falhou; não prossiga." }
Remove-Item Env:SUPABASE_DB_URL
Remove-Item Env:PGPASSWORD
```

> O comando acima exporta apenas os dados de `public.app_state`; ele **não** é uma exportação de todas as tabelas. O backup geral continua necessário.

## 5. Importação: não executar às cegas

Não importe diretamente para uma base já utilizada. Primeiro crie um ambiente descartável e teste a restauração do backup geral, incluindo extensões, funções, tabelas e permissões. A estrutura do Supabase pode depender de schemas gerenciados e funções que não existem em um PostgreSQL comum.

O esquema principal `public.app_state` guarda dados de fretes, despesas, contas a receber, funcionários, caminhões e categorias dentro do JSONB `data`. A estrutura real deve ser conferida no dump e no conteúdo exportado antes de mapear os dados para tabelas normalizadas.

## Usuários e autenticação

Os usuários de login do Supabase ficam normalmente no schema gerenciado `auth`, separado de `public.app_state`. O backup padrão documentado em `backups/local/README.md` não inclui `auth` nem arquivos do Storage. Não copie hashes de senha, tokens, chaves ou segredos para o repositório. Para autenticação local, planeje recriar contas autorizadas ou implementar uma migração de identidade segura, com redefinição de senha.

## Segurança e produção

- Não executar comandos de escrita no Supabase para esta migração.
- Não subir arquivos `.sql`, `.dump`, `.zip`, `.env` ou outros backups com dados reais para o GitHub.
- Não remover nem recriar o volume `rr_postgres_data` sem um backup verificado.
- Não considerar os dados migrados até conferir contagens, totais financeiros e registros de amostra.
- O site publicado e a produção permanecem inalterados nesta etapa.
