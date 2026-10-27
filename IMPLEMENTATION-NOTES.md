# Implementation notes

- Added **Windows Endpoint Scan** to the CyberAmour sidebar.
- Added CSV and JSON import, KEV freshness state (current/outdated/unknown), scan completeness state, per-check statuses, warnings, possible-match table, and CSV/JSON exports.
- Added a Windows PowerShell read-only inventory script and optional desktop shortcut installer.
- The supplied `known_exploited_vulnerabilities.csv` was not present among the files accessible for this build, so it has deliberately not been replaced with fabricated data. Place the original supplied CSV beside `Scan-CyberAmour.ps1`, and import it into the dashboard.
- The browser page cannot trigger PowerShell directly. The workflow is scan locally, then import JSON. Automatic browser-to-agent communication requires a separate authenticated local service and is not represented as implemented.
- Validation performed: JavaScript syntax check passed with Node.js. A Windows PowerShell execution test could not be performed in this environment; test the scanner on a Windows test machine before production use.
