# SOC integration update

## Added
- `src/components/SocApiDashboard.tsx`: dashboard for API health, ATT&CK searches, CISA KEV lookups, manually submitted test alerts, and recent alerts.
- Added **SOC API Dashboard** to desktop and mobile navigation in `src/App.tsx`.
- Added `VITE_SOC_API_BASE_URL` to `.env.example`.
- Updated the threat data refresh script default destination to `./data`, matching the root `app.py` service.
- Added `data/README.md` so the expected data directory is included in source archives and Docker builds.

## Cleanup
- Removed 65 verified duplicate source files, duplicate docs/config exports and temporary/download artifacts.
- Kept the canonical Vite application under `src/`, canonical GitHub Actions workflow under `.github/workflows/`, root Firebase config, and the active scripts under `scripts/`.

## Validation notes
- Python backend unit tests: **3 passed** (`pytest -q test_app.py`).
- Frontend TypeScript/build validation remains unverified in this environment because dependency installation was interrupted; the partial `node_modules` directory was removed from the deliverable.
- The dashboard is wired to the API response shapes in `app.py`.
- A browser can connect to `127.0.0.1` only when the API runs on that same computer. A deployed frontend needs a reachable, secured API URL and matching CORS configuration.
- A full npm build should be run on a machine with Node.js and dependencies installed.


## Merged SOC detection engine

The supplied SOC Security Platform has been integrated as reusable detection logic, not as a second Flask service. CyberAmour now exposes:

- `GET /api/soc/detection-rules`
- `POST /api/soc/analyze-logs`

The log-analysis API accepts up to 5,000 supplied lines, identifies repeated failed logins (`CA-AUTH-001`, ATT&CK T1110), possible port-scan patterns (`CA-NET-001`, ATT&CK T1046), and optional local IOC matches (`CA-IOC-001`). It returns evidence and limitations and can create deduplicated alerts in the existing CyberAmour SQLite alert store. The SOC dashboard now has a log-batch analysis panel and JSON export.

This does not claim continuous monitoring. The legacy SOC demo runner automatically creates synthetic logs, so it is not launched or wired into production. Local IOC matching is opt-in using `CYBERAMOUR_SUSPICIOUS_IPS_PATH`; sample demo IPs are commented out pending verification.
