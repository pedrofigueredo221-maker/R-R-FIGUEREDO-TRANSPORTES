# Verifica um ZIP local sem extrair nem conectar ao banco.
param([Parameter(Mandatory=$true)][string]$Arquivo)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
if (-not (Test-Path -LiteralPath $Arquivo -PathType Leaf)) { throw "Backup não encontrado." }
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Arquivo).Path)
try {
    $entries = @($zip.Entries | Where-Object { -not [string]::IsNullOrEmpty($_.Name) })
    foreach ($name in @("roles.sql", "schema.sql", "data.sql", "LEIA-ME.txt")) {
        $entry = $entries | Where-Object { $_.Name -eq $name } | Select-Object -First 1
        if ($null -eq $entry -or $entry.Length -eq 0) { throw "Backup incompleto: $name ausente ou vazio." }
        Write-Host ("OK: {0} ({1} bytes)" -f $name, $entry.Length)
    }
    $dataEntry = $entries | Where-Object { $_.Name -eq "data.sql" } | Select-Object -First 1
    $reader = [System.IO.StreamReader]::new($dataEntry.Open())
    try {
        $found = $false
        while ($null -ne ($line = $reader.ReadLine())) {
            if ($line -match '(?i)(COPY|INSERT INTO).*app_state') { $found = $true; break }
        }
        if (-not $found) { throw "data.sql não contém instrução de carga da app_state. Confirme o escopo do dump." }
    } finally { $reader.Dispose() }
    Write-Host "ESTRUTURA OK. Isso não comprova restauração nem igualdade com dados atuais."
} finally { $zip.Dispose() }
