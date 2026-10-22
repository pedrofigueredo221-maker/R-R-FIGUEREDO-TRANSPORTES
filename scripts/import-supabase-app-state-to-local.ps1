$ErrorActionPreference = "Stop"

# Importa somente public.app_state para o PostgreSQL local.
# Não executa comandos de escrita no Supabase.
# Requer: psql, pg_dump, PostgreSQL local iniciado e backup geral previamente criado.

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Comando '$Name' não encontrado. Instale o PostgreSQL Command Line Tools e confira o PATH."
    }
}

Require-Command "psql"
Require-Command "pg_dump"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupRoot = Join-Path $projectRoot "backups/local"
$envFile = Join-Path $projectRoot "offline/postgres/.env"

if (-not (Test-Path $envFile)) {
    throw "Arquivo offline/postgres/.env não encontrado. Copie .env.example, defina uma senha local forte e não compartilhe o arquivo."
}
if (-not (Test-Path $backupRoot) -or -not (Get-ChildItem $backupRoot -Filter "supabase-backup-*.zip" -File -ErrorAction SilentlyContinue)) {
    throw "Backup geral supabase-backup-*.zip não encontrado em backups/local. Gere e confira o backup completo antes de importar."
}

# Carrega apenas as variáveis locais necessárias do arquivo .env.
$settings = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        $settings[$parts[0].Trim()] = $parts[1].Trim()
    }
}
$dbName = if ($settings["POSTGRES_DB"]) { $settings["POSTGRES_DB"] } else { "rr_figueredo" }
$dbUser = if ($settings["POSTGRES_USER"]) { $settings["POSTGRES_USER"] } else { "rr_local" }
$dbPassword = $settings["POSTGRES_PASSWORD"]
$dbPort = if ($settings["POSTGRES_PORT"]) { $settings["POSTGRES_PORT"] } else { "5433" }

if (-not $dbPassword -or $dbPassword -eq "troque-por-uma-senha-local-forte") {
    throw "Defina POSTGRES_PASSWORD com uma senha local forte em offline/postgres/.env."
}
if (-not $env:SUPABASE_DB_URL) {
    $secure = Read-Host "Cole a connection string PostgreSQL do Supabase (não a envie no chat)" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $env:SUPABASE_DB_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$env:PGPASSWORD = $dbPassword
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("rr-app-state-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null
$dumpPath = Join-Path $tempDir "app-state-data.sql"

try {
    Write-Host "Verificando a origem do Supabase (somente leitura)..."
    $sourceCount = (& psql "$env:SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM public.app_state;").Trim()
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível consultar public.app_state no Supabase." }
    if ($sourceCount -ne "1") { throw "Esperado exatamente 1 registro em public.app_state; encontrados: $sourceCount. Importação cancelada para revisão manual." }

    $sourceId = (& psql "$env:SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT id FROM public.app_state;").Trim()
    if ($LASTEXITCODE -ne 0 -or $sourceId -ne "1") { throw "O registro de origem não tem id=1. Importação cancelada." }
    $sourceSignature = (& psql "$env:SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT md5(data::text || '|' || version::text || '|' || extract(epoch from updated_at)::numeric::text) FROM public.app_state WHERE id=1;").Trim()
    if ($LASTEXITCODE -ne 0 -or -not $sourceSignature) { throw "Não foi possível calcular a assinatura dos dados de origem." }

    Write-Host "Verificando se o destino está vazio..."
    $localCount = (& psql -h 127.0.0.1 -p $dbPort -U $dbUser -d $dbName -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='app_state';").Trim()
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível acessar o PostgreSQL local. Confirme se o Docker está iniciado." }
    if ($localCount -eq "1") {
        $rows = (& psql -h 127.0.0.1 -p $dbPort -U $dbUser -d $dbName -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM public.app_state;").Trim()
        if ($LASTEXITCODE -ne 0) { throw "A tabela local app_state existe, mas não foi possível verificar seus dados." }
        if ($rows -ne "0") { throw "A tabela local public.app_state já contém dados ($rows registro(s)). Nada foi sobrescrito. Use um banco de destino vazio ou faça revisão manual." }
    }

    Write-Host "Exportando public.app_state do Supabase para arquivo temporário..."
    & pg_dump --dbname="$env:SUPABASE_DB_URL" --data-only --table=public.app_state --column-inserts --no-owner --no-privileges --file="$dumpPath"
    if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou. O destino não foi alterado." }
    if (-not (Test-Path $dumpPath) -or (Get-Item $dumpPath).Length -lt 20) { throw "O arquivo temporário de exportação está vazio. O destino não foi alterado." }

    Write-Host "Preparando a estrutura mínima local..."
    $schemaSql = @"
CREATE TABLE IF NOT EXISTS public.app_state (
    id integer PRIMARY KEY CHECK (id = 1),
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    version bigint NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);
"@
    $schemaSql | & psql -h 127.0.0.1 -p $dbPort -U $dbUser -d $dbName -X -v ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível preparar a tabela local." }

    # Reconfirma vazio imediatamente antes da importação.
    $rows = (& psql -h 127.0.0.1 -p $dbPort -U $dbUser -d $dbName -X -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM public.app_state;").Trim()
    if ($LASTEXITCODE -ne 0 -or $rows -ne "0") { throw "A tabela local deixou de estar vazia. Importação cancelada para evitar sobrescrita." }

    Write-Host "Importando o registro..."
    & psql -h 127.0.0.1 -p $dbPort -U $dbUser -d $dbName -X -v ON_ERROR_STOP=1 -f "$dumpPath"
    if ($LASTEXITCODE -ne 0) { throw "A importação falhou. Não use o banco local até revisar o estado e restaurar a partir de um destino limpo." }

    $localSignature = (& psql -h 127.0.0.1 -p $dbPort -U $dbUser -d $dbName -X -v ON_ERROR_STOP=1 -Atc "SELECT md5(data::text || '|' || version::text || '|' || extract(epoch from updated_at)::numeric::text) FROM public.app_state WHERE id=1;").Trim()
    if ($LASTEXITCODE -ne 0 -or $localSignature -ne $sourceSignature) {
        throw "A assinatura do registro local não corresponde à origem. NÃO ative a aplicação no PostgreSQL; investigue e repita em um banco de destino limpo."
    }

    $localVersion = (& psql -h 127.0.0.1 -p $dbPort -U $dbUser -d $dbName -X -v ON_ERROR_STOP=1 -Atc "SELECT version FROM public.app_state WHERE id=1;").Trim()
    $localUpdatedAt = (& psql -h 127.0.0.1 -p $dbPort -U $dbUser -d $dbName -X -v ON_ERROR_STOP=1 -Atc "SELECT updated_at FROM public.app_state WHERE id=1;").Trim()
    Write-Host ""
    Write-Host "IMPORTAÇÃO E VERIFICAÇÃO CONCLUÍDAS."
    Write-Host "Registros em public.app_state: 1"
    Write-Host "Versão preservada: $localVersion"
    Write-Host "updated_at preservado: $localUpdatedAt"
    Write-Host "Assinatura da origem e do destino: coincidem."
    Write-Host "Este procedimento importa apenas public.app_state; não migra contas Supabase Auth nem arquivos Storage."
    Write-Host "O React ainda não está conectado ao PostgreSQL. Não altere a configuração de produção com base apenas neste resultado."
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:SUPABASE_DB_URL -ErrorAction SilentlyContinue
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
}
