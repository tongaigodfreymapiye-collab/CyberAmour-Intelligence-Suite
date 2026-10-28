# Automated Risk & Intelligence Centre update

## What changed

- Added a **Run Full Assessment** action to the Risk & Intelligence Centre. It checks the SOC API health, ATT&CK technique dataset, CISA KEV snapshot, Windows endpoint inventory/KEV triage endpoint, and Microsoft Defender status endpoint.
- Each source is displayed as `SUCCESS` or `UNAVAILABLE`; unavailable checks remain unknown rather than being reported as clean.
- Added a PDF and JSON export of the automated assessment, including source results and limitations.
- Added an editable SOC API URL to the Risk & Intelligence Centre and persisted it in browser local storage so it is shared with the SOC API Dashboard.
- Updated the SOC API Dashboard to use the saved API URL and to fall back to the bundled ATT&CK/KEV snapshot when the API cannot be reached. The interface identifies this as a dated bundled snapshot, not a live feed. Alert submission and endpoint scans still require the API.
- Added the GitHub Pages origin to the backend's default CORS allow-list and documented backend connection requirements.

## Required for real scans

GitHub Pages only hosts the frontend. Start the Python SOC API on the Windows computer (default `http://127.0.0.1:8091`) for local endpoint inventory and Defender checks, or deploy the API to a secured HTTPS backend and set the in-app API URL to that service. If `CYBERAMOUR_ALLOWED_ORIGINS` is explicitly configured, include `https://tongaigodfreymapiye-collab.github.io` in the value.

The endpoint inventory is read-only. Possible KEV matches are based on application/vendor name matching and require version/exposure validation. This is not a full antivirus scan or penetration test. No remediation, blocking, or quarantine is triggered by the one-click assessment.

## Verification performed in this environment

- `app.py` passed Python syntax compilation.
- Both modified TSX files passed TypeScript transpilation syntax checks.
- A full `npm run lint` / production build could not be completed here because dependency installation timed out and left a partial `node_modules` tree. Run `npm ci`, `npm run lint`, and `npm run build` in the clean recovery worktree before committing/deploying.
