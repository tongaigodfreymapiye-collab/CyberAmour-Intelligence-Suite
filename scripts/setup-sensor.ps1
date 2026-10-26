$ErrorActionPreference = 'Stop'
$SensorDir = Join-Path $PSScriptRoot '..\local-sensor' | Resolve-Path
$EnvFile = Join-Path $SensorDir '.env'
if (-not (Test-Path $EnvFile)) {
  $Token = python -c "import secrets; print(secrets.token_urlsafe(48))"
  if (-not $Token) { throw 'Python 3 is required. Install Python 3.10+ from https://www.python.org/downloads/.' }
  $Template = Get-Content (Join-Path $SensorDir '.env.example') -Raw
  $Template = $Template -replace 'REPLACE_WITH_RANDOM_32_PLUS_CHARACTER_SECRET', $Token
  Set-Content -Path $EnvFile -Value $Template -Encoding utf8
  Write-Host "Created $EnvFile"
  Write-Host "LOCAL SENSOR TOKEN (paste into CyberAmour; keep private): $Token" -ForegroundColor Yellow
} else {
  Write-Host 'local-sensor/.env already exists; keeping its token.'
  $ExistingToken = (Get-Content $EnvFile | Where-Object { $_ -match '^CYBERAMOUR_SENSOR_TOKEN=' } | Select-Object -First 1) -replace '^CYBERAMOUR_SENSOR_TOKEN=', ''
  Write-Host "LOCAL SENSOR TOKEN (paste into CyberAmour; keep private): $ExistingToken" -ForegroundColor Yellow
}
Push-Location $SensorDir
try {
  python -m pip install --user -r requirements.txt
  if ($LASTEXITCODE -ne 0) { throw 'Installing local sensor Python packages failed.' }
  Write-Host 'Starting CyberAmour Local Security Sensor at http://127.0.0.1:8765'
  Write-Host 'Leave this terminal open while using Local Sensor features.'
  python -m uvicorn sensor:app --host 127.0.0.1 --port 8765
} finally { Pop-Location }
