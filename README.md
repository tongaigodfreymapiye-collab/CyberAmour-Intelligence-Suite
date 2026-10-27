# CyberAmour SOC Integration Kit

An additive starter kit that brings ATT&CK/KEV enrichment, Navigator-compatible coverage exports, SOC alert intake, auditable response proposals, and a data refresh script toward the existing CyberAmour React application.

## Files

- `backend/attack-intel-service/` — FastAPI service, ATT&CK lookup, KEV enrichment, SQLite alert/proposal audit store.
- `src/components/AttackCoveragePanel.tsx` — React ATT&CK search and Navigator layer export panel.
- `src/services/socIntegrationApi.ts` — typed browser API client.
- `scripts/Refresh-CyberAmourThreatData.ps1` — downloads official ATT&CK Enterprise STIX and CISA KEV JSON snapshots.
- `config/response-playbooks.example.json` — example defensive playbooks with approval gates.
- `docs/INTEGRATION-ARCHITECTURE.md` — merge, run, connector and production guidance.
- `third-party/` — license and attribution documents for the three uploaded repositories.

## Important

This is an integration starter, not a complete managed SOC product. It does not yet include endpoint telemetry collection, a production queue, authentication, multi-tenant access control, or live enforcement connectors. Response proposals are not executed. Test in an isolated development environment before using customer systems.

See `docs/INTEGRATION-ARCHITECTURE.md` for the steps.


## SOC API dashboard and local threat intelligence

The application now includes a **SOC API Dashboard** screen. It connects to the local FastAPI service to display API health, query ATT&CK techniques and the CISA KEV snapshot, and submit/list analyst test alerts.

### Start the local SOC API (Windows PowerShell)

From the repository root:

```powershell
python -m venv .venv-soc
.\.venv-soc\Scripts\Activate.ps1
python -m pip install -r requirements.txt
.\Refresh-CyberAmourThreatData.ps1
python -m uvicorn app:app --host 127.0.0.1 --port 8091
```

Open `http://127.0.0.1:8091/docs` to test the API. Keep the API terminal open. In a second terminal, run `npm ci` and `npm run dev`; open the Vite URL and choose **SOC API Dashboard** from the navigation.

The frontend defaults to `http://127.0.0.1:8091`. For another API address, set `VITE_SOC_API_BASE_URL` in `.env.local` and restart Vite. The API CORS allow-list is configured by `CYBERAMOUR_ALLOWED_ORIGINS`; add only trusted frontend origins.

### Security limitations

This API provides local threat-intelligence enrichment and analyst workflow endpoints. It does not, by itself, collect endpoint telemetry, provide a full antivirus scan, or block attacks. Real-time detection and response require an authorised endpoint sensor or EDR/firewall connector. Do not expose the API publicly without authentication, TLS, restrictive network access and production security review. Response proposals are not proof that an action was executed.
