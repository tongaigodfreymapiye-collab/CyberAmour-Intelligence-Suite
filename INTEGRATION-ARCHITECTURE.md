# CyberAmour SOC integration architecture

## What this kit adds

This is an additive integration kit for the existing React/Vite CyberAmour application. It does not replace the existing app or copy entire MITRE applications into it.

- A Python FastAPI service uses `mitreattack-python` to query a locally stored ATT&CK Enterprise STIX bundle.
- KEV enrichment reads the official CISA KEV JSON snapshot (or the existing CSV fallback).
- An alert intake endpoint persists events in SQLite, enriches known ATT&CK technique IDs and CVE IDs, and proposes response actions.
- Response proposals are auditable and require approval for potentially disruptive actions. Approval is recorded as `approved_pending_connector`; it does not block or isolate anything.
- A React `AttackCoveragePanel` searches ATT&CK techniques and exports a Navigator-compatible JSON layer.
- A PowerShell refresh script downloads the current ATT&CK STIX bundle and CISA KEV snapshot into the local data directory.

## Run the backend locally

From the repository root after copying the files into your project:

```powershell
py -3.11 -m venv .venv-soc
.\.venv-soc\Scripts\Activate.ps1
python -m pip install -r .\backend\attack-intel-service\requirements.txt
.\scripts\Refresh-CyberAmourThreatData.ps1
python -m uvicorn app:app --app-dir .\backend\attack-intel-service --host 127.0.0.1 --port 8091
```

Health check: `http://127.0.0.1:8091/api/health`
Interactive API docs: `http://127.0.0.1:8091/docs`

Set `VITE_SOC_API_URL=http://127.0.0.1:8091` in your Vite `.env.local` if the default does not fit your environment. Restart the frontend after changing environment variables.

## Add the React module

Import `AttackCoveragePanel` into your existing React router or module navigation:

```tsx
import AttackCoveragePanel from "./components/AttackCoveragePanel";

// Render within the existing page layout:
<AttackCoveragePanel />
```

Copy `src/services/socIntegrationApi.ts` and `src/components/AttackCoveragePanel.tsx` into the matching locations in the current app. Match imports to your app's alias conventions if needed.

## Connect event sources

The API accepts normalized events with `POST /api/alerts`, for example:

```json
{
  "title": "Suspicious PowerShell execution",
  "severity": "high",
  "source": "windows-agent",
  "host": "WS-014",
  "source_ip": "203.0.113.24",
  "cve_ids": ["CVE-2021-44228"],
  "technique_ids": ["T1059.001"],
  "confidence": 0.82,
  "details": { "event_id": "example", "sensor": "sample" }
}
```

This is a schema example, not a claim that a sensor is already connected. Endpoint agents, Windows Event Forwarding/Sysmon, EDR, firewall, identity provider, and cloud audit logs require their own authenticated connectors and data mappings.

## What "real-time blocking" requires

ATT&CK and Navigator are knowledge/visualisation tools; they do not inspect live devices or block traffic by themselves. To enforce responses, implement and test connector adapters for your selected endpoint protection and firewall products. Each adapter should have:
- server-side credentials in a secret manager (never in the browser),
- least-privilege scopes,
- tenant and asset allow-lists,
- analyst approval and reason for disruptive actions,
- idempotency keys, timeouts, rate limits, expiry and rollback,
- a tamper-resistant audit trail,
- dry-run mode and a tested kill switch.

The API in this kit deliberately does not execute host isolation, IP blocking, account disabling, process termination, or remediation. This is intentional until a real connector and policy controls exist.

## Production gaps to close

- Replace local SQLite with managed PostgreSQL for multi-tenant production use.
- Add authentication, role-based access control, tenant isolation, request validation, rate limiting, CSRF protections where applicable, and secret management.
- Place the API behind TLS and a reverse proxy; do not expose the local development API directly to the internet.
- Add a durable event queue (for example, a managed queue) before high-volume ingestion.
- Add tests, alert deduplication, retention policy, signed agent updates, and health/metrics monitoring.
- Track data provenance and snapshot timestamps; a missing ATT&CK or KEV match is not evidence that a device is safe.
