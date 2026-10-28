CYBERAMOUR FINAL SCANNING FIX — PATCH PACKAGE

This is a patch package, not a full standalone project. It intentionally excludes node_modules, .git, build output, local databases, credentials, and large threat datasets. Keep your existing repository and data intact.

APPLY
1. Extract this ZIP.
2. Copy the contents of CyberAmour-Final-Scanning-Fix into your existing repository folder, preserving folder structure and overwriting matching files.
3. Do not overwrite your existing .env files, Firebase configuration, logo assets, data/, .git, node_modules, or package files.
4. Rotate the exposed local sensor token: from the repository root run:
   powershell -ExecutionPolicy Bypass -File .\scripts\rotate-sensor-token.ps1
   This writes a fresh token to local-sensor/.env and copies it to the clipboard without printing it. Paste it directly into CyberAmour's local sensor token field. Never paste it into chat or commit it.
5. Start the sensor in a dedicated PowerShell window:
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-sensor.ps1
   Keep this window open while using the local sensor. The setup script no longer prints the token.
6. In a second PowerShell window, verify:
   Invoke-RestMethod http://127.0.0.1:8765/api/health
   Then use CyberAmour to test authenticated status and a Defender scan.
7. From the repository root run:
   npm ci
   npm run lint
   npm run build
   npm run audit:release
   python -m pytest -q .\test_app.py
8. Review before committing:
   git status --short
   git diff --check
   git diff --stat
9. Commit and push only the intended source files after all checks pass.

NOTES
- The sensor loads its local .env as the authoritative token source to avoid a stale inherited Windows environment variable overriding the configured token.
- The browser cannot perform a Windows endpoint scan by itself. The local sensor must be installed, running, and authenticated; Microsoft Defender must be available and permitted to scan.
- A successful build/audit is not proof of end-to-end protection. Test the live workflows on the target Windows machine.
- This patch removes website file input controls from the included scanning UI, but it does not make file scanning possible without a local scanner. The website directs endpoint scanning to Microsoft Defender through the local sensor.
