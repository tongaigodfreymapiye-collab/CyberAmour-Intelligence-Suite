[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("status","threats","scan")]
  [string]$Action,
  [ValidateSet("QuickScan","FullScan")]
  [string]$ScanType = "QuickScan"
)
$ErrorActionPreference = "Stop"
try {
  if (-not (Get-Command Get-MpComputerStatus -ErrorAction SilentlyContinue)) {
    throw "Microsoft Defender Antivirus PowerShell cmdlets are unavailable on this Windows installation."
  }
  switch ($Action) {
    "status" {
      $s = Get-MpComputerStatus
      $result = [ordered]@{
        available = $true
        AMServiceEnabled = [bool]$s.AMServiceEnabled
        AntivirusEnabled = [bool]$s.AntivirusEnabled
        RealTimeProtectionEnabled = [bool]$s.RealTimeProtectionEnabled
        BehaviorMonitorEnabled = [bool]$s.BehaviorMonitorEnabled
        IoavProtectionEnabled = [bool]$s.IoavProtectionEnabled
        NISEnabled = [bool]$s.NISEnabled
        AntivirusSignatureVersion = [string]$s.AntivirusSignatureVersion
        AntivirusSignatureLastUpdated = if ($s.AntivirusSignatureLastUpdated) { $s.AntivirusSignatureLastUpdated.ToUniversalTime().ToString("o") } else { $null }
        QuickScanAge = $s.QuickScanAge
        FullScanAge = $s.FullScanAge
        checkedAtUtc = [DateTime]::UtcNow.ToString("o")
      }
    }
    "threats" {
      $items = @(Get-MpThreatDetection -ErrorAction SilentlyContinue | Select-Object ThreatID,ThreatStatusID,InitialDetectionTime,LastThreatStatusChangeTime,ProcessName,Resources,ActionSuccess,CurrentThreatExecutionStatusID)
      $result = [ordered]@{ available = $true; count = $items.Count; detections = $items; checkedAtUtc = [DateTime]::UtcNow.ToString("o") }
    }
    "scan" {
      Start-MpScan -ScanType $ScanType
      $result = [ordered]@{ accepted = $true; scanType = $ScanType; message = "Scan request sent to Microsoft Defender. Check Defender status/threats for results; this response does not claim the scan has completed."; requestedAtUtc = [DateTime]::UtcNow.ToString("o") }
    }
  }
  $result | ConvertTo-Json -Depth 6 -Compress
  exit 0
} catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 2
}
