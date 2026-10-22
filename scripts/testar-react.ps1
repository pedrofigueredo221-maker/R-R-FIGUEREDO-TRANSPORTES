$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "O Node.js ainda não está instalado ou não está disponível neste terminal." -ForegroundColor Yellow
    Write-Host "1. Instale a versão LTS pelo site oficial: https://nodejs.org/en/download"
    Write-Host "2. Feche e abra o PowerShell novamente."
    Write-Host "3. Execute este arquivo de novo."
    try { Start-Process "https://nodejs.org/en/download" } catch {}
    exit 1
}

Write-Host "Node.js:" -ForegroundColor Cyan
node --version
Write-Host "npm:" -ForegroundColor Cyan
npm --version

if (-not (Test-Path (Join-Path $projectRoot "node_modules"))) {
    Write-Host "Instalando dependências do projeto..." -ForegroundColor Cyan
    npm.cmd install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "A instalação das dependências falhou." }
}

Write-Host ""
Write-Host "Iniciando a versão React. Mantenha esta janela aberta." -ForegroundColor Green
Write-Host "Quando o Vite mostrar um endereço local, abra-o no navegador."
Write-Host "Para encerrar o servidor, pressione Ctrl+C nesta janela."
npm.cmd run dev -- --host 127.0.0.1
if ($LASTEXITCODE -ne 0) { throw "O servidor React foi encerrado com erro." }
