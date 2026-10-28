$ErrorActionPreference = 'Stop'
$SensorDir = Join-Path $PSScriptRoot '..\local-sensor' | Resolve-Path
$EnvFile = Join-Path $SensorDir '.env'
if (-not (Test-Path $EnvFile)) { throw 'local-sensor/.env not found. Run scripts/setup-sensor.ps1 first.' }
$Token = python -c "import secrets; print(secrets.token_urlsafe(48))"
if (-not $Token -or $Token.Length -lt 32) { throw 'Could not generate a valid sensor token. Check Python installation.' }
$Content = Get-Content $EnvFile -Raw
if ($Content -notmatch '(?m)^CYBERAMOUR_SENSOR_TOKEN=') { throw 'CYBERAMOUR_SENSOR_TOKEN setting not found; no file changed.' }
$Content = [regex]::Replace($Content, '(?m)^CYBERAMOUR_SENSOR_TOKEN=.*$', "CYBERAMOUR_SENSOR_TOKEN=$Token")
Set-Content -Path $EnvFile -Value $Content -Encoding utf8
try {
    Set-Clipboard -Value $Token
    Write-Host 'Sensor token rotated and copied to clipboard. Paste it directly into CyberAmour. Do not share it.' -ForegroundColor Green
} catch {
    Write-Host 'Sensor token rotated. Clipboard access failed; keep the token private and retrieve it locally from local-sensor/.env.' -ForegroundColor Yellow
}
$Token = $null
$Content = $null
