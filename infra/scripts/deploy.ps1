. (Join-Path $PSScriptRoot 'common.ps1')
$paths = Resolve-InfraPaths -ScriptPath $MyInvocation.MyCommand.Path
$envFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { Join-Path $paths.InfraDir '.env' }
Import-EnvFile -Path $envFile

$stackName = Get-EnvValue -Key 'STACK_NAME' -Default 'jaga'

# Content hashes rotate the Swarm config names when a config file changes, so
# `docker stack deploy` never hits the "only updates to Labels are allowed"
# immutability error. A missing config file is a hard error (never silently
# fall back to the ":-v1" default name).
function Get-ShortHash {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "deploy: config file not found: $Path"
    }
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.Substring(0, 10).ToLower()
}
$env:NGINX_MAIN_HASH = Get-ShortHash (Join-Path $paths.InfraDir 'nginx/nginx.conf')
$env:NGINX_DEFAULT_HASH = Get-ShortHash (Join-Path $paths.InfraDir 'nginx/conf.d/default.conf')
$env:POSTGRES_INIT_HASH = Get-ShortHash (Join-Path $paths.InfraDir 'postgres/init/001-base.sql')

docker swarm init *> $null
$global:LASTEXITCODE = 0
docker stack deploy -c (Join-Path $paths.InfraDir 'docker-stack.yml') $stackName

# Swarm does not auto-remove configs orphaned by a hash rotation. Prune stale
# jaga_* configs; ones still referenced by a running service cannot be removed
# and are safely skipped.
$previousErrorAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
foreach ($cfg in (docker config ls --format '{{.Name}}' | Where-Object { $_ -like 'jaga_*' })) {
    docker config rm $cfg 2>$null | Out-Null
}
$ErrorActionPreference = $previousErrorAction
$global:LASTEXITCODE = 0
