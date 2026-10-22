# Backups locais do Supabase

Os arquivos reais de backup devem ficar nesta pasta **somente no computador autorizado**. O conteúdo gerado é ignorado pelo Git para impedir que dados reais de clientes, funcionários, fretes e finanças sejam enviados ao repositório.

## Gerar backup

Na raiz do projeto, abra o PowerShell e execute:

```powershell
$env:SUPABASE_DB_URL = Read-Host "Cole a connection string PostgreSQL do Supabase"
.\banco-de-dados\supabase\backup-supabase.ps1
```

O arquivo ZIP será salvo em `backups/local/`. Apague a variável da sessão ao terminar:

```powershell
Remove-Item Env:SUPABASE_DB_URL
```

Não coloque a connection string em arquivos do projeto, commits, prints ou mensagens. Se ela for exposta, troque a senha do banco no painel Supabase.

## O que contém

O ZIP contém os dumps lógicos de papéis personalizados, esquema e dados exportados com o Supabase CLI. O CLI precisa estar instalado e o Docker Desktop precisa estar iniciado. Use a connection string do painel Supabase em **Connect**, preferencialmente a Session Pooler, e codifique caracteres especiais da senha na URL.

## Limitações importantes

- O dump de dados padrão do Supabase CLI exclui schemas gerenciados como `auth` e `storage`. Assim, este arquivo é uma cópia lógica do esquema/dados da aplicação, não uma cópia física integral do projeto Supabase.
- Arquivos binários guardados no Storage (ex.: imagens/documentos) não são incluídos; faça backup separado desses objetos se o projeto os usar.
- Não restaure sobre produção sem conferir o destino, testar em um projeto separado e validar as permissões/RLS.
- Depois de gerar, copie o ZIP também para um local privado separado (HD externo protegido ou armazenamento criptografado). Uma cópia no mesmo computador não é proteção contra falha do equipamento.
