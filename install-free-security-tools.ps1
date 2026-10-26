$ErrorActionPreference = 'Stop'

Write-Host 'CyberAmour - free/open-source security tools installer' -ForegroundColor Cyan
Write-Host 'This installs software from the Windows Package Manager (winget). Review package prompts and license terms.'

$winget = Get-Command winget -ErrorAction SilentlyContinue
if (-not $winget) {
  Write-Warning 'winget was not found. Install/update App Installer from Microsoft Store, or install from official sites:'
  Write-Host 'Wireshark/TShark: https://www.wireshark.org/download.html'
  Write-Host 'ClamAV:            https://www.clamav.net/downloads'
  Write-Host 'Suricata:          https://suricata.io/download/'
  exit 2
}

$packages = @(
  @{ Id = 'Cisco.ClamAV'; Name = 'ClamAV file-malware scanning engine' },
  @{ Id = 'WiresharkFoundation.Wireshark'; Name = 'Wireshark / TShark packet analyzer' },
  @{ Id = 'OISF.Suricata'; Name = 'Suricata IDS engine (optional rule setup required)' }
)

$failed = @()
foreach ($package in $packages) {
  Write-Host "`nChecking $($package.Name) [$($package.Id)] ..." -ForegroundColor Yellow
  & winget install --id $package.Id --exact --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "winget returned code $LASTEXITCODE for $($package.Id). If already installed, continue and verify through CyberAmour's sensor status. Otherwise install from the official link above."
    $failed += $package.Id
  }
}

Write-Host "`nTool installation attempts completed." -ForegroundColor Cyan
Write-Host 'Next: run scripts/setup-sensor.ps1 in a NEW PowerShell window, then connect with the printed sensor token.'
Write-Host 'On Windows, live capture depends on Npcap and permission to capture on the selected interface. Do not capture traffic without authorization.'
Write-Host 'ClamAV requires current signature databases; configure/update them according to its official documentation before relying on scans.'
if ($failed.Count -gt 0) {
  Write-Warning ("Some packages need attention: " + ($failed -join ', '))
  exit 1
}
