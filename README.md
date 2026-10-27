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
