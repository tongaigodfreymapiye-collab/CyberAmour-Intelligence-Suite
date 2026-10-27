# CyberAmour Windows Endpoint Scan — first version

This update adds a Windows-only, read-only local inventory agent and a dashboard page for importing its JSON report and the supplied CISA Known Exploited Vulnerabilities (KEV) CSV snapshot.

## What it does
- Collects Windows edition/build, installed-app registry entries, installed hotfixes, Microsoft Defender status when available, Windows Firewall profiles, and Secure Boot status when available.
- Reads `known_exploited_vulnerabilities.csv` from the same folder by default.
- Produces `cyberamour-scan-report.json` with per-check status, warnings, snapshot metadata, and possible KEV/product-name matches.
- Dashboard marks scans as **INCOMPLETE** when checks or the KEV database are missing/failed/unavailable, and flags a snapshot as stale when its newest `dateAdded` is over 30 days old. A missing/invalid date is **UNKNOWN**, not current.
- Exports possible matches to CSV and the report to JSON from the dashboard.

## Install / run
1. Place `Scan-CyberAmour.ps1`, `Install-Scan-Shortcut.ps1`, and the supplied `known_exploited_vulnerabilities.csv` in the same folder on a Windows device.
2. Open PowerShell. Run the scanner as the normal user first:
   `powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\Scan-CyberAmour.ps1`
3. It writes `cyberamour-scan-report.json` next to the script. Exit code `0` means the collected checks completed; exit code `2` means **INCOMPLETE** and warnings must be reviewed.
4. In CyberAmour's **Windows Endpoint Scan** page, import the JSON report. Import the CSV snapshot there too if you want the dashboard to independently display its age and record count.
5. Optional desktop shortcut: run `Install-Scan-Shortcut.ps1` from PowerShell. It creates a shortcut only; it does not change machine-wide policy.

## Permissions and safety
- The scanner is read-only: it does not patch, delete files, disable protections, kill processes, or upload telemetry.
- Run without elevation first. Some checks may be unavailable in that context; the report must remain incomplete rather than imply success. Elevate only when your organisation approves and a required inventory check genuinely needs it.
- The web app cannot start a local PowerShell scan directly. Run the agent separately, then import the resulting JSON report. A future signed Windows service/local API could automate this bridge with explicit authentication and least privilege.
- This script is not code-signed. Before production distribution, review it and sign it with an organisation-controlled code-signing certificate. Do not bypass organisational execution policy.
- Product/vendor string matching is triage only. It does **not** establish that an installed version is vulnerable or that it is exploitable. Validate version ranges and applicability with vendor advisories/patch data. A no-match result is not proof of security.
- App inventory can miss portable software, drivers, firmware, browser extensions, containers and application components. This is not a full EDR or antivirus scan.

## Dashboard
`index.html` is a patched copy of the available CyberAmour Intelligence Suite HTML prototype. Replace the corresponding file in your cloned project after backing up your own current version. This package does not include the original repository's other assets, so keep your existing `assets/` folder when copying the HTML.
