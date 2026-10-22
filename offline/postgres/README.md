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

## 4. Backup e importação validada do estado principal

Antes de migrar, faça um backup geral usando `scripts/backup-supabase.ps1`. O backup deve ficar em `backups/local/`, ignorado pelo Git. Esse procedimento requer Docker Desktop e Supabase CLI instalados, além da connection string PostgreSQL do Supabase. Guarde uma segunda cópia privada do ZIP e nunca a envie ao GitHub.

Para importar o registro principal para uma base local vazia, use o script `scripts/import-supabase-app-state-to-local.ps1`. Ele requer os utilitários `psql` e `pg_dump` do PostgreSQL instalados e disponíveis no PATH.

Na raiz do projeto, no PowerShell:

```powershell
Copy-Item offline/postgres/.env.example offline/postgres/.env
notepad offline/postgres/.env
# Defina uma senha local forte; não compartilhe o .env.

docker compose --env-file offline/postgres/.env -f offline/postgres/docker-compose.yml up -d
docker compose --env-file offline/postgres/.env -f offline/postgres/docker-compose.yml ps

# Só depois de criar e conferir o backup geral:
$env:SUPABASE_DB_URL = Read-Host "Connection string PostgreSQL do Supabase"
.scriptsimport-supabase-app-state-to-local.ps1
```

O script solicita a connection string quando necessário, verifica que a origem contém exatamente o registro esperado, recusa importar por cima de uma tabela local que já tenha dados e compara uma assinatura do registro após a importação. Ao terminar, remove as variáveis sensíveis da sessão. O dump intermediário fica em pasta temporária e é removido ao final.

**Escopo:** esse script importa apenas `public.app_state`, que contém o JSONB principal do sistema, sua versão e a data de atualização. Não migra usuários do Supabase Auth nem arquivos do Storage, não conecta o React ao PostgreSQL e não configura o backup PostgreSQL → Supabase. A importação só deve ser considerada aprovada se a assinatura coincidir e os dados financeiros forem revisados.

Se a execução falhar após iniciar a importação, não conecte a aplicação ao banco local. Investigue a tabela de destino e repita somente em um banco local vazio, mantendo o backup geral preservado.

## 5. Não conectar a aplicação ainda

Não altere a configuração do site de produção. A estrutura de `public.app_state` é somente o primeiro passo; antes de ativar o PostgreSQL como principal, ainda precisamos implementar uma API autenticada acessível aos computadores autorizados e o processo de backup PostgreSQL → Supabase com verificação, logs e tratamento de falhas.

## Usuários e autenticação

Os usuários de login do Supabase ficam normalmente no schema gerenciado `auth`, separado de `public.app_state`. O backup padrão documentado em `backups/local/README.md` não inclui `auth` nem arquivos do Storage. Não copie hashes de senha, tokens, chaves ou segredos para o repositório. Para autenticação local, planeje recriar contas autorizadas ou implementar uma migração de identidade segura, com redefinição de senha.

## Segurança e produção

- Não executar comandos de escrita no Supabase para esta migração.
- Não subir arquivos `.sql`, `.dump`, `.zip`, `.env` ou outros backups com dados reais para o GitHub.
- Não remover nem recriar o volume `rr_postgres_data` sem um backup verificado.
- Não considerar os dados migrados até conferir contagens, totais financeiros e registros de amostra.
- O site publicado e a produção permanecem inalterados nesta etapa.
