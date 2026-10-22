# Arquivos do Supabase

Esta pasta reúne os arquivos específicos de integração com o Supabase:

- `config.js`: configuração pública usada pela versão estática.
- `app-config.js`: configuração pública carregada pela versão React.
- `supabase.sql`: tabela `public.app_state` e políticas de acesso autenticado.
- `supabase-visitor-role.sql`: políticas do perfil visitante somente leitura.
- `backup-supabase.ps1`: script PowerShell para gerar backup lógico local.
- `README-backup.md`: instruções e limitações do backup local.

## Segurança e produção

- As configurações do navegador usam a chave publicável/anon, nunca a chave administrativa `service_role`.
- Não adicione senhas, connection strings, chaves administrativas ou dados reais exportados ao repositório.
- Revise o SQL e confirme o projeto correto antes de executar manualmente no SQL Editor.
- Mover arquivos não executa SQL nem altera os dados do Supabase de produção.
- O script de backup exige a variável de ambiente `SUPABASE_DB_URL`, Supabase CLI e Docker. Ele grava o ZIP em `backups/local/`, pasta ignorada pelo Git.

## Gerar backup no Windows

Na raiz do projeto, abra o PowerShell:

```powershell
$env:SUPABASE_DB_URL = Read-Host "Cole a connection string PostgreSQL do Supabase"
.\banco-de-dados\supabase\backup-supabase.ps1
Remove-Item Env:SUPABASE_DB_URL
```

O backup lógico padrão não inclui os schemas gerenciados `auth` e `storage`, nem arquivos binários do Storage. Não restaure sobre produção sem testar primeiro em um projeto separado.
