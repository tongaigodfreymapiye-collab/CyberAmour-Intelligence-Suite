# Creates a desktop shortcut to run the read-only scan. Does not change execution policy globally.
$script = Join-Path $PSScriptRoot 'Scan-CyberAmour.ps1'
if (!(Test-Path $script)) { throw "Scanner not found: $script" }
$wsh = New-Object -ComObject WScript.Shell
$link = $wsh.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'CyberAmour Windows Scan.lnk'))
$link.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$link.Arguments = "-NoProfile -ExecutionPolicy RemoteSigned -File `"$script`""
$link.WorkingDirectory = $PSScriptRoot
$link.Description = 'Run a read-only CyberAmour Windows inventory and KEV triage scan'
$link.Save()
Write-Host 'Desktop shortcut created. Run it as your normal user first; elevate only if required for a specific inventory source.'
