# CyberAmour Local Security Sensor (Windows)

The GitHub Pages app is a browser frontend. This local service allows CyberAmour to query Microsoft Defender and trigger a user-requested Quick Scan or Full Scan on the same Windows computer. It binds to `127.0.0.1` only and requires a random bearer token.

## Setup

1. Install Python 3.10+ from https://www.python.org/downloads/.
2. From the repository root, run `scripts/setup-sensor.ps1` in PowerShell. The script creates a private token in `local-sensor/.env`, copies it to your clipboard when supported, installs the Python requirements, and starts the service.
3. Keep the terminal open while scanning.
4. Open CyberAmour, choose **Windows Endpoint Scan** or **Antivirus & Protection**, paste the token, and select **Connect sensor**.
5. Choose **Start Quick Scan** or **Start Full Scan**. Confirm final completion and any remediation in Windows Security.

If a sensor token was previously exposed, rotate it with `scripts/rotate-sensor-token.ps1`. Never commit `local-sensor/.env`, publish the token, or paste it into chat.

## Supported endpoints

- `/api/health` — unauthenticated liveness check only.
- `/api/status` — authenticated local service status.
- `/api/defender/status` — authenticated Microsoft Defender status query.
- `/api/defender/scan` — authenticated, explicit Quick Scan or Full Scan request.
- `/api/intel/cisa-kev` — authenticated read of the public CISA Known Exploited Vulnerabilities catalog; this is reference intelligence, not a device scan.

## Boundaries

- Only Windows Defender status and explicit scans are exposed. This build does not offer website file uploads, PCAP upload, packet capture, network blocking, ClamAV/YARA orchestration, Suricata, Zeek, or Splunk forwarding.
- The sensor does not change Defender protection settings, quarantine files itself, or claim that a device is safe. Detection history may include older Defender detections; check Windows Security for definitive scan status.
- Use only on computers you own or are authorised to administer. Keep the sensor bound to loopback and keep its token private.
