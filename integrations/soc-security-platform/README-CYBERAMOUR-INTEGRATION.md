# SOC Security Platform integration

This folder preserves the supplied SOC Security Platform's reusable detector and dashboard templates for reference. CyberAmour's primary SOC API remains the FastAPI service in the repository-root `app.py`; do not run the old Flask dashboard and its separate log tailer as a second production service.

## Active integration

- `../../soc_detection.py` (repository-root `soc_detection.py`) implements bounded, deterministic batch log analysis.
- `POST /api/soc/analyze-logs` accepts up to 5,000 user-supplied log lines, applies failed-authentication and potential port-scan rules, and optionally persists deduplicated findings as CyberAmour alerts.
- `GET /api/soc/detection-rules` lists rules and thresholds.
- New findings include source lines as evidence, confidence, MITRE ATT&CK IDs where appropriate, and explicit limitations.
- No automatic blocking, isolation, quarantine, or attack simulation is performed.
- IOC matching is disabled unless `CYBERAMOUR_SUSPICIOUS_IPS_PATH` points to a curated local indicator file. The sample IPs from the supplied demo project are commented out because they are not verified threat intelligence.

## Run locally

From the repository root, install backend dependencies and run:

```powershell
python -m pip install -r requirements.txt
$env:CYBERAMOUR_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:5173,https://tongaigodfreymapiye-collab.github.io"
uvicorn app:app --host 127.0.0.1 --port 8091
```

The browser frontend should use `http://127.0.0.1:8091` only when the browser and API run on the same computer. For hosted users, deploy the API to a secured HTTPS service; localhost in their browser refers to their own machine.

## Limits and safety

This is batch log analysis, not a continuous SIEM collector. The rules are heuristic and can produce false positives. Results must be validated against original telemetry. The supplied `run_soc_platform.py` automatically generates synthetic login attempts, so it is intentionally not wired into CyberAmour's production workflow.
