. (Join-Path $PSScriptRoot 'common.ps1')
$paths = Resolve-InfraPaths -ScriptPath $MyInvocation.MyCommand.Path
$envFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { Join-Path $paths.InfraDir '.env' }
Import-EnvFile -Path $envFile

$stackName = Get-EnvValue -Key 'STACK_NAME' -Default 'jaga'

docker swarm init *> $null
$global:LASTEXITCODE = 0
docker stack deploy -c (Join-Path $paths.InfraDir 'docker-stack.yml') $stackName
