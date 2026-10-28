# CyberAmour + SOC Security Platform merge

## Included

- The automated Risk & Intelligence Centre and SOC API Dashboard components from the assessment patch.
- A deterministic backend detection engine in `soc_detection.py`.
- FastAPI endpoints `GET /api/soc/detection-rules` and `POST /api/soc/analyze-logs`.
- Deduplicated persistence of generated detections in the existing SQLite alert store.
- A SOC log-analysis UI that accepts up to 5,000 log lines, displays rule findings and sample evidence, refreshes alerts, and exports a JSON report.
- Selected original SOC Security Platform modules and templates under `integrations/soc-security-platform/` for traceability.
- Docker packaging updated to include the scanner scripts, integration files, and detection module.
- Unit tests in `tests/test_soc_detection.py`.

## Validation completed

- Python syntax compilation passed for the FastAPI app and detection engine.
- Five unit tests passed: repeated failed login detection, threshold behavior, private-IP filtering, distinct-port scan rule, and no response actions.
- FastAPI smoke tests passed for detection-rules, log analysis, and health routes.
- TypeScript/TSX syntax transpilation passed for the updated SOC Dashboard and Risk & Intelligence Centre components.
- A full Vite production build and dependency-backed TypeScript type check were not run in this environment because `node_modules` is not present. Run the build checks in the clean recovery worktree before committing.

## Local run

```powershell
python -m pip install -r requirements.txt
$env:CYBERAMOUR_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:5173,https://tongaigodfreymapiye-collab.github.io"
uvicorn app:app --host 127.0.0.1 --port 8091
```

Start the frontend in another terminal with `npm ci` and `npm run dev`, then set the SOC API URL in the SOC API Dashboard to `http://127.0.0.1:8091`.

## Operational limits

- This is bounded batch log analysis, not continuous monitoring. It analyzes only the lines submitted by an analyst.
- The supplied SOC demo runner creates synthetic attack logs; CyberAmour does not launch it automatically.
- IOC matching is disabled unless `CYBERAMOUR_SUSPICIOUS_IPS_PATH` points to a curated, validated indicator file.
- ATT&CK and KEV results use the local snapshots configured in the API. A name/vendor match is a triage lead, not proof that a product version is vulnerable.
- No blocking, quarantine, endpoint isolation, or remediation is executed by these detections.
- Do not expose the unauthenticated API publicly without adding authentication, TLS, rate limits, and appropriate network restrictions.
