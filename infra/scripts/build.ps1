. (Join-Path $PSScriptRoot 'common.ps1')
$paths = Resolve-InfraPaths -ScriptPath $MyInvocation.MyCommand.Path
$envFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { Join-Path $paths.InfraDir '.env' }
Import-EnvFile -Path $envFile

$goApiImage = Get-EnvValue -Key 'GO_API_IMAGE' -Default 'jaga/go-api:local'
$prismaWorkerImage = Get-EnvValue -Key 'PRISMA_WORKER_IMAGE' -Default 'jaga/prisma-worker:local'
$webImage = Get-EnvValue -Key 'WEB_IMAGE' -Default 'jaga/web:local'
$nginxImage = Get-EnvValue -Key 'NGINX_IMAGE' -Default 'jaga/nginx:local'
$postgresImage = Get-EnvValue -Key 'POSTGRES_IMAGE' -Default 'jaga/postgres:local'
$redisImage = Get-EnvValue -Key 'REDIS_IMAGE' -Default 'jaga/redis:local'
$minioImage = Get-EnvValue -Key 'MINIO_IMAGE' -Default 'jaga/minio:local'
$cogneeImage = Get-EnvValue -Key 'COGNEE_IMAGE' -Default 'jaga/cognee:local'
$nextPublicApiBaseUrl = Get-EnvValue -Key 'NEXT_PUBLIC_API_BASE_URL' -Default ''
$nextPublicAppEnv = Get-EnvValue -Key 'NEXT_PUBLIC_APP_ENV' -Default 'production'
$nextPublicEnableAssistant = Get-EnvValue -Key 'NEXT_PUBLIC_ENABLE_ASSISTANT' -Default 'true'
$nextPublicEnablePrisma = Get-EnvValue -Key 'NEXT_PUBLIC_ENABLE_PRISMA' -Default 'true'

docker build -t $goApiImage (Join-Path $paths.RepoRoot 'backend/go')
docker build -t $prismaWorkerImage (Join-Path $paths.RepoRoot 'backend/python/PrismaServer')
docker build `
  --build-arg "NEXT_PUBLIC_API_BASE_URL=$nextPublicApiBaseUrl" `
  --build-arg "NEXT_PUBLIC_APP_ENV=$nextPublicAppEnv" `
  --build-arg "NEXT_PUBLIC_ENABLE_ASSISTANT=$nextPublicEnableAssistant" `
  --build-arg "NEXT_PUBLIC_ENABLE_PRISMA=$nextPublicEnablePrisma" `
  -t $webImage `
  (Join-Path $paths.RepoRoot 'frontend')
docker build -t $nginxImage (Join-Path $paths.InfraDir 'nginx')
docker build -t $postgresImage (Join-Path $paths.InfraDir 'postgres')
docker build -t $redisImage (Join-Path $paths.InfraDir 'redis')
docker build -t $minioImage (Join-Path $paths.InfraDir 'minio')
docker build -t $cogneeImage (Join-Path $paths.InfraDir 'cognee')
