param(
    [string]$ServiceName
)

. (Join-Path $PSScriptRoot 'common.ps1')
$paths = Resolve-InfraPaths -ScriptPath $MyInvocation.MyCommand.Path
$envFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { Join-Path $paths.InfraDir '.env' }
Import-EnvFile -Path $envFile

$stackName = Get-EnvValue -Key 'STACK_NAME' -Default 'jaga'

if (-not [string]::IsNullOrWhiteSpace($ServiceName)) {
    if (-not $ServiceName.StartsWith("$stackName" + '_')) {
        $ServiceName = "${stackName}_$ServiceName"
    }
    docker service logs -f $ServiceName
    exit $LASTEXITCODE
}

$services = docker stack services $stackName --format '{{.Name}}'
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if (-not $services) {
    throw "no services found for stack $stackName"
}

$jobs = @()
foreach ($name in $services) {
    $jobs += Start-Job -ArgumentList $name -ScriptBlock {
        param($resolvedServiceName)
        docker service logs -f $resolvedServiceName
    }
}

try {
    while ($true) {
        foreach ($job in $jobs) {
            Receive-Job -Job $job | Out-Host
        }
        Start-Sleep -Milliseconds 500
    }
}
finally {
    foreach ($job in $jobs) {
        Stop-Job -Job $job -ErrorAction SilentlyContinue | Out-Null
        Remove-Job -Job $job -Force -ErrorAction SilentlyContinue | Out-Null
    }
}
