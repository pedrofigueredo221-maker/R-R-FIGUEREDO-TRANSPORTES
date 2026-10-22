$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL)) {
    throw "Defina SUPABASE_DB_URL na sessão do PowerShell antes de executar este script. Não salve a connection string no repositório."
}

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    throw "Supabase CLI não encontrado. Instale o Supabase CLI antes de executar o backup."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker não encontrado. Instale e inicie o Docker Desktop; o Supabase CLI usa container para o dump."
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backupRoot = Join-Path $projectRoot "backups/local"
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("rr-figueredo-backup-" + [guid]::NewGuid().ToString("N"))
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipPath = Join-Path $backupRoot "supabase-backup-$timestamp.zip"

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

try {
    Write-Host "Exportando papéis personalizados..."
    & supabase db dump --db-url $env:SUPABASE_DB_URL -f (Join-Path $tempRoot "roles.sql") --role-only
    if ($LASTEXITCODE -ne 0) { throw "Falha ao exportar papéis personalizados." }

    Write-Host "Exportando esquema..."
    & supabase db dump --db-url $env:SUPABASE_DB_URL -f (Join-Path $tempRoot "schema.sql")
    if ($LASTEXITCODE -ne 0) { throw "Falha ao exportar esquema." }

    Write-Host "Exportando dados da aplicação..."
    & supabase db dump --db-url $env:SUPABASE_DB_URL -f (Join-Path $tempRoot "data.sql") --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
    if ($LASTEXITCODE -ne 0) { throw "Falha ao exportar dados." }

    @"
Backup lógico R&R Figueredo Transportes
Data local: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
Conteúdo: roles.sql, schema.sql, data.sql
Origem: Supabase PostgreSQL (connection string fornecida via variável de ambiente)
Aviso: schemas gerenciados auth/storage e arquivos binários do Storage não são incluídos pelo dump padrão.
"@ | Set-Content -Path (Join-Path $tempRoot "LEIA-ME.txt") -Encoding UTF8

    Compress-Archive -Path (Join-Path $tempRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal
    $file = Get-Item $zipPath
    if ($file.Length -lt 100) { throw "O arquivo gerado parece vazio; confira o acesso ao banco e tente novamente." }

    Write-Host ""
    Write-Host "Backup criado: $zipPath"
    Write-Host ("Tamanho: {0:N2} MB" -f ($file.Length / 1MB))
    Write-Host "O arquivo fica ignorado pelo Git e não será enviado ao GitHub."
    Write-Host "Guarde uma segunda cópia em armazenamento privado separado."
}
finally {
    if (Test-Path $tempRoot) {
        Remove-Item -Path $tempRoot -Recurse -Force
    }
}
