# CyberAmour unified update: ATT&CK + KEV + Windows Endpoint Scan

This release combines the existing React application, ATT&CK/KEV intelligence workspace, and a Windows-only read-only endpoint inventory agent with a dashboard page for importing scan reports.

## Put this update into your existing GitHub repository

1. Back up your current repository or commit your current work first.
2. Download and extract this ZIP.
3. Copy the **contents** of the extracted project folder into the root of your existing `CyberAmour-Intelligence-Suite` clone, preserving the directory structure and allowing the updated files to replace older versions. Do not copy `node_modules` from another machine; this package intentionally excludes it.
4. In PowerShell, from the repository root, run these commands one at a time:

   ```powershell
   npm ci
   npm run audit:release
   npm run build
   ```

5. If the release audit and build pass, commit and push:

   ```powershell
   git status
   git add .
   git commit -m "Integrate ATT&CK KEV and Windows endpoint scan"
   git push
   ```

## Run the Windows endpoint scanner

The scanner is at `scripts/windows-endpoint-agent/Scan-CyberAmour.ps1`. The matching KEV CSV snapshot is in the same directory. From the repository root, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File ".\scripts\windows-endpoint-agent\Scan-CyberAmour.ps1"
```

It writes `cyberamour-scan-report.json` next to the script. Exit code `0` indicates the collected checks completed; exit code `2` means the scan is **INCOMPLETE** and its warnings/check statuses need review. Import the resulting JSON in CyberAmour's **Windows Endpoint Scan** page.

## Important scope and safety

- The bundled KEV CSV is generated from the same point-in-time KEV snapshot already included in `src/data/attackSnapshot.json`; it is not a live feed. Refresh the official CISA KEV data periodically.
- ATT&CK data remains a limited snapshot, not the full ATT&CK catalog.
- The scanner is read-only and does not remediate, disable protections, or upload scan data.
- Product/vendor matches are possible matches only. Confirm affected version, edition, configuration and exposure against authoritative advisories. No match does not prove security.
- The browser cannot launch PowerShell directly. Scanning and JSON import are separate steps; no automatic browser-to-agent connection is claimed.
- The PowerShell script is unsigned. Review and sign it with an organisation-controlled code-signing certificate before production distribution. Do not bypass organisational execution policy.
- Test on a Windows test machine before production use. Build/release audit checks do not constitute end-to-end Windows scanner testing.
