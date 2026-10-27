# CyberAmour Windows Endpoint Inventory & KEV Triage Agent
# Read-only inventory. It does not remediate, disable controls, or upload data.
[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)][string]$KevCsvPath,
  [Parameter(Mandatory=$false)][string]$OutputPath
)
$ErrorActionPreference = 'Stop'

# Resolve defaults after parameter binding. In some launch contexts, $PSScriptRoot
# is empty while parameter default expressions are being evaluated.
$scriptDirectory = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptDirectory)) {
  if (-not [string]::IsNullOrWhiteSpace($PSCommandPath)) {
    $scriptDirectory = Split-Path -Parent $PSCommandPath
  } elseif ($MyInvocation.MyCommand.Path) {
    $scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
  } else {
    $scriptDirectory = (Get-Location).Path
  }
}
if ([string]::IsNullOrWhiteSpace($KevCsvPath)) {
  $KevCsvPath = Join-Path $scriptDirectory 'known_exploited_vulnerabilities.csv'
}
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $scriptDirectory 'cyberamour-scan-report.json'
}
$started = (Get-Date).ToUniversalTime()
$checks = [ordered]@{}
$warnings = New-Object System.Collections.Generic.List[string]
$apps = @(); $hotfixes = @(); $os = $null; $defender = $null; $firewall = @(); $secureBoot = $null
function Add-Warning([string]$Message) { $warnings.Add($Message) }
try {
  $osInfo = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
  $os = [pscustomobject]@{ Caption=$osInfo.Caption; Version=$osInfo.Version; BuildNumber=$osInfo.BuildNumber; OSArchitecture=$osInfo.OSArchitecture; LastBootUpTime=$osInfo.LastBootUpTime }
  $checks['operatingSystem'] = 'complete'
} catch { $checks['operatingSystem']='failed'; Add-Warning "OS inventory failed: $($_.Exception.Message)" }
try {
  $paths = @('HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*','HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*')
  foreach ($path in $paths) { $apps += Get-ItemProperty -Path $path -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName } | Select-Object @{n='Name';e={$_.DisplayName}},@{n='Version';e={$_.DisplayVersion}},@{n='Publisher';e={$_.Publisher}},@{n='InstallDate';e={$_.InstallDate}},@{n='RegistrySource';e={$path}} }
  $apps = @($apps | Sort-Object Name,Version -Unique)
  $checks['installedApplications'] = 'complete'
} catch { $checks['installedApplications']='partial'; Add-Warning "Installed-app inventory may be incomplete: $($_.Exception.Message)" }
try { $hotfixes = @(Get-HotFix | Select-Object HotFixID,Description,InstalledBy,InstalledOn); $checks['hotfixes']='complete' } catch { $checks['hotfixes']='failed'; Add-Warning "Hotfix inventory failed: $($_.Exception.Message)" }
try { $mp = Get-MpComputerStatus -ErrorAction Stop; $defender = [pscustomobject]@{ Available=$true; AntivirusEnabled=$mp.AntivirusEnabled; RealTimeProtectionEnabled=$mp.RealTimeProtectionEnabled; AntivirusSignatureLastUpdated=$mp.AntivirusSignatureLastUpdated; AMServiceEnabled=$mp.AMServiceEnabled }; $checks['defender']='complete' } catch { $checks['defender']='unavailable'; Add-Warning 'Microsoft Defender status unavailable (may be absent, disabled, or permissions-limited).' }
try { $firewall = @(Get-NetFirewallProfile -ErrorAction Stop | Select-Object Name,Enabled,DefaultInboundAction,DefaultOutboundAction); $checks['firewall']='complete' } catch { $checks['firewall']='unavailable'; Add-Warning 'Windows Firewall profile status unavailable.' }
try { $secureBoot = [bool](Confirm-SecureBootUEFI -ErrorAction Stop); $checks['secureBoot']='complete' } catch { $secureBoot=$null; $checks['secureBoot']='unavailable'; Add-Warning 'Secure Boot status unavailable (unsupported firmware or permissions may apply).' }
$kev = @(); $kevDate = $null
if (Test-Path -LiteralPath $KevCsvPath) {
  try {
    $kev = @(Import-Csv -LiteralPath $KevCsvPath)
    if ($kev.Count -gt 0 -and ($kev[0].PSObject.Properties.Name -contains 'cveID') -and ($kev[0].PSObject.Properties.Name -contains 'vendorProject') -and ($kev[0].PSObject.Properties.Name -contains 'product')) {
      $dates = @($kev | ForEach-Object { try { [datetime]::Parse($_.dateAdded) } catch {} } | Where-Object { $_ })
      if ($dates.Count) { $kevDate = ($dates | Sort-Object -Descending | Select-Object -First 1).ToString('yyyy-MM-dd') }
      $checks['kevDatabase']='complete'
    } else { $kev=@(); $checks['kevDatabase']='invalid'; Add-Warning 'KEV CSV columns are not the expected CISA catalog format; no KEV matching performed.' }
  } catch { $checks['kevDatabase']='failed'; Add-Warning "KEV CSV could not be read: $($_.Exception.Message)" }
} else { $checks['kevDatabase']='missing'; Add-Warning "KEV snapshot not found at $KevCsvPath. Copy known_exploited_vulnerabilities.csv beside this script." }
# Conservative string-based triage only: these are possible product matches, not confirmed vulnerable versions.
$matches = @()
foreach ($v in $kev) {
  $vendor = [string]$v.vendorProject; $product = [string]$v.product
  if ([string]::IsNullOrWhiteSpace($product)) { continue }
  $candidates = @($apps | Where-Object {
    $n = [string]$_.Name; $pub = [string]$_.Publisher
    (($n -and ($n -like "*$product*")) -or ($vendor -and $pub -and ($pub -like "*$vendor*")))
  } | Select-Object -First 10)
  foreach ($app in $candidates) {
    $matches += [pscustomobject]@{ Status='POSSIBLE_MATCH_REQUIRES_VALIDATION'; CVE=[string]$v.cveID; Vendor=$vendor; Product=$product; Vulnerability=[string]$v.vulnerabilityName; InstalledName=$app.Name; InstalledVersion=$app.Version; Publisher=$app.Publisher; DateAdded=[string]$v.dateAdded; DueDate=[string]$v.dueDate; RequiredAction=[string]$v.requiredAction; Notes='Name/vendor string match only. Version applicability, edition, configuration and exposure have not been verified.' }
  }
}
$failed = @($checks.GetEnumerator() | Where-Object { $_.Value -in @('failed','partial','unavailable','missing','invalid') })
$complete = ($failed.Count -eq 0)
$report = [ordered]@{
  schemaVersion='1.0'; product='CyberAmour Windows Endpoint Agent'; scanStartedUtc=$started.ToString('o'); scanCompletedUtc=(Get-Date).ToUniversalTime().ToString('o'); computerName=$env:COMPUTERNAME; userContext=[System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  scanComplete=$complete; scanStatus=$(if ($complete) {'COMPLETE'} else {'INCOMPLETE'}); checks=$checks; warnings=@($warnings); operatingSystem=$os; installedApplications=@($apps); hotfixes=@($hotfixes); defender=$defender; firewall=@($firewall); secureBoot=$secureBoot
  kevSnapshot=[ordered]@{ path=[IO.Path]::GetFileName($KevCsvPath); recordCount=$kev.Count; newestDateAdded=$kevDate; checkedAtUtc=(Get-Date).ToUniversalTime().ToString('o') }
  possibleKevMatches=@($matches); limitations=@('Read-only inventory; no remediation is performed.','Installed application inventory does not cover every portable app, driver, firmware component, browser extension, container image, or application-specific component.','KEV product-name matching is heuristic and does not validate vulnerable version ranges. Every possible match requires analyst validation.','No vulnerability match does not prove the device is secure.','This script is unsigned by default; production distribution should use an organisation-controlled code-signing certificate and managed deployment.')
}
$json = $report | ConvertTo-Json -Depth 8
$parent = Split-Path -Parent $OutputPath
if ($parent -and !(Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
Set-Content -LiteralPath $OutputPath -Value $json -Encoding UTF8
Write-Host "CyberAmour scan report: $OutputPath"
Write-Host "Status: $($report.scanStatus); installed applications: $($apps.Count); possible KEV matches: $($matches.Count); KEV records: $($kev.Count)"
if (-not $complete) { Write-Warning 'Scan is INCOMPLETE. Review warnings and checks in the JSON report.'; exit 2 }
exit 0
