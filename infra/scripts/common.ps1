Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-InfraPaths {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptPath
    )

    $scriptDir = Split-Path -Parent $ScriptPath
    $infraDir = Split-Path -Parent $scriptDir
    $repoRoot = Split-Path -Parent $infraDir

    return @{
        ScriptDir = $scriptDir
        InfraDir = $infraDir
        RepoRoot = $repoRoot
    }
}

function Import-EnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if ($trimmed -eq '' -or $trimmed.StartsWith('#')) {
            continue
        }

        $parts = $trimmed -split '=', 2
        if ($parts.Count -ne 2) {
            continue
        }

        $key = $parts[0].Trim()
        $value = $parts[1].Trim()

        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        $expanded = [System.Text.RegularExpressions.Regex]::Replace(
            $value,
            '\$\{([A-Za-z_][A-Za-z0-9_]*)\}',
            [System.Text.RegularExpressions.MatchEvaluator]{
                param($match)
                $resolved = [Environment]::GetEnvironmentVariable($match.Groups[1].Value)
                if ($null -eq $resolved) {
                    return ''
                }
                return $resolved
            }
        )

        [Environment]::SetEnvironmentVariable($key, $expanded)
    }
}

function Get-EnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Key,
        [Parameter(Mandatory = $true)]
        [string]$Default
    )

    $value = [Environment]::GetEnvironmentVariable($Key)
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $Default
    }

    return $value
}
