[CmdletBinding()]
param(
    [string]$Destination = ".\data"
)
$ErrorActionPreference = "Stop"
$dest = [System.IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$downloads = @(
    @{
        Name = "enterprise-attack.json"
        Url = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json"
    },
    @{
        Name = "known_exploited_vulnerabilities.json"
        Url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    }
)
foreach ($item in $downloads) {
    $target = Join-Path $dest $item.Name
    $temp = "$target.download"
    Write-Host "Downloading $($item.Name)..."
    Invoke-WebRequest -Uri $item.Url -OutFile $temp -UseBasicParsing
    if ((Get-Item $temp).Length -lt 1000) {
        Remove-Item $temp -Force
        throw "Downloaded file $($item.Name) is unexpectedly small. Existing data was not replaced."
    }
    # Parse JSON before replacing the current snapshot.
    Get-Content $temp -Raw | ConvertFrom-Json | Out-Null
    Move-Item $temp $target -Force
    Write-Host "Updated $target"
}
Write-Host "Threat data snapshots refreshed. Restart the CyberAmour SOC API to reload ATT&CK data."
Write-Warning "Review dataset dates and test enrichment after every refresh; this script does not validate vendor/product applicability."
