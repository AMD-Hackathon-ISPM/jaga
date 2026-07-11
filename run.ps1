#!/usr/bin/env pwsh
<# 
  Jaga unified build & run script.
  - Ensures infra/.env exists
  - Builds all backend Docker images (Go API, Prisma worker, Nginx, Postgres, Redis, MinIO, Cognee)
  - Deploys the Docker Swarm stack (starts all services)
  - Installs frontend dependencies and starts the Next.js dev server
#>
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Join-Path $repoRoot 'infra'
$frontendDir = Join-Path $repoRoot 'frontend'

Write-Host '==> [1/5] Ensuring infra/.env exists' -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $infraDir '.env'))) {
    Copy-Item (Join-Path $infraDir '.env.example') (Join-Path $infraDir '.env')
    Write-Host '    Created infra/.env from .env.example' -ForegroundColor Yellow
} else {
    Write-Host '    infra/.env already exists' -ForegroundColor Green
}

Write-Host '==> [2/5] Building backend Docker images' -ForegroundColor Cyan
& (Join-Path $infraDir 'scripts/build.ps1')
if ($LASTEXITCODE -ne 0) { throw "build.ps1 failed with exit code $LASTEXITCODE" }

Write-Host '==> [3/5] Deploying Docker Swarm stack' -ForegroundColor Cyan
& (Join-Path $infraDir 'scripts/deploy.ps1')
if ($LASTEXITCODE -ne 0) { throw "deploy.ps1 failed with exit code $LASTEXITCODE" }

Write-Host '==> [4/5] Installing frontend dependencies' -ForegroundColor Cyan
Push-Location $frontendDir
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

Write-Host '==> [5/5] Starting frontend dev server' -ForegroundColor Cyan
Push-Location $frontendDir
try {
    npm run dev
} finally {
    Pop-Location
}