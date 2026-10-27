# ATT&CK + KEV Intelligence integration

CyberAmour now includes an **ATT&CK + KEV Intelligence** workspace connected to the main application navigation.

## Capabilities
- Search the supplied ATT&CK technique excerpts by technique ID, name, description, tactic, domain, and platform.
- Open the linked official MITRE technique page for the canonical/current record.
- Search 1,760 CISA Known Exploited Vulnerabilities (KEV) snapshot rows by CVE, vendor, product, description, remediation and references.
- Filter KEV records for `known` ransomware-campaign use and due dates earlier than the current date; export the filtered KEV results to CSV.
- Map a technique ID to an investigation with evidence references, analyst, status and timestamp; delete mappings and export mappings to JSON.
- Keep mappings in browser local storage so the UI works on static GitHub Pages without a Firebase Functions deployment.

## Data scope and update process
`src/data/attackSnapshot.json` is generated from the ATT&CK excerpts and change-log data supplied for this update, plus `known_exploited_vulnerabilities(1).csv`. The ATT&CK subset is **not the full ATT&CK catalog**. It is labelled as a snapshot in the UI. Official technique links take analysts to MITRE for the current authoritative content. The KEV CSV is a point-in-time snapshot (2026-10-27) and should be replaced periodically with the official CISA catalog.

## Limitations
- This is defensive analyst support, not an EDR or live telemetry collector.
- Mapping a technique is a human-entered hypothesis/observation; it does not prove compromise.
- Browser-local mappings are not shared across users/devices or synced to Firebase.
- No automated asset-to-CVE match occurs until an asset inventory/software bill of materials is provided and matched by vendor/product/version.
- For production multi-user use, add authenticated server-side persistence, an update job for official data, and role-based access controls.

## Official sources
- MITRE ATT&CK: https://attack.mitre.org/
- CISA KEV Catalog: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- NVD CVE records: https://nvd.nist.gov/
