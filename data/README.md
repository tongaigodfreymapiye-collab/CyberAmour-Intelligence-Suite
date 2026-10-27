# Local threat-intelligence data

Run `./Refresh-CyberAmourThreatData.ps1` from the repository root to download the current official MITRE ATT&CK Enterprise STIX snapshot and CISA Known Exploited Vulnerabilities catalog into this folder.

These data snapshots are generated/downloaded assets and are intentionally not bundled in the source ZIP. Review source dates and validate vendor/product/version applicability before acting on a vulnerability match. The API starts without the ATT&CK file but ATT&CK search will return HTTP 503 until the dataset is downloaded.
