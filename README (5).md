Place current, authorised data snapshots in this folder. Do not commit secrets or client telemetry.

- `enterprise-attack.json`: official MITRE ATT&CK Enterprise STIX bundle.
- `known_exploited_vulnerabilities.json`: official CISA KEV JSON catalogue.
- `known_exploited_vulnerabilities.csv`: optional CSV fallback for the current CyberAmour scanner.

If ATT&CK data is missing, the API health endpoint reports it and technique lookup returns HTTP 503. KEV results are explicitly treated as a local snapshot, not a live feed.
