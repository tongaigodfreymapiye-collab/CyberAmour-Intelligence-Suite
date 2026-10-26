# CyberAmour Local Security Sensor

The GitHub Pages website is a frontend. This optional local service connects its security panels to tools installed on the same computer. It binds to `127.0.0.1` only, requires a random bearer token, accepts user-selected file uploads and user-initiated captures, and never executes uploaded files.

## Windows quick start

1. Install Python 3.10+ from https://www.python.org/downloads/ if it is not already installed.
2. In PowerShell, from the repository root, run `scripts/install-free-security-tools.ps1`. It uses winget to install ClamAV, Wireshark/TShark and Suricata. Review install prompts. The script is optional; the official vendor links are provided if winget is unavailable.
3. Open a new PowerShell window and run `scripts/setup-sensor.ps1`. Keep the terminal open; the script prints a private sensor token.
4. Open the updated CyberAmour website, go to **Antivirus & File Reputation** or **Network & Device Diagnostics**, paste that token, and select **Connect sensor**.
5. For file scanning, choose a file and click **Scan with local tools**. For a live capture, choose the interface and a 10–30 second window, then click **Capture & analyze**. For an existing capture, upload a `.pcap` or `.pcapng` file.

The first live-capture attempt may fail until Npcap is installed and the account has appropriate capture permission. Use the official Wireshark download and Npcap guidance at https://www.wireshark.org/download.html. In a Windows lab, run the sensor under an account permitted to capture; do not run it as a network service exposed to other devices.

## Linux/macOS

Install Python 3.10+ and the operating-system packages for ClamAV, Wireshark/TShark and (optionally) Suricata, then run `scripts/start-sensor.sh`. Package names vary by operating system. The sensor stays bound to loopback.

## Connected tools and actual capabilities

- **ClamAV** scans the selected file with the signatures installed on this computer. Keep its signature database updated per https://docs.clamav.net/.
- **YARA** is optional and only runs when a YARA CLI and a trusted `YARA_RULES_PATH` are configured. Community rules have varying licenses; review each rule repository before commercial use.
- **Wireshark/TShark** enumerates interfaces, performs an explicit bounded capture (maximum 30 seconds), and decodes saved captures. Live capture may require Npcap or elevated interface permissions.
- **Suricata** can inspect a saved/live capture and emit alerts using its installed configuration and rules. Install/update rules according to https://suricata.io/download/ and the official documentation.
- **CISA Known Exploited Vulnerabilities (KEV)** is fetched from the public CISA feed and cached for up to six hours. It is not an antivirus feed or a complete vulnerability inventory.
- **Splunk HEC** is optional. Configure `SPLUNK_HEC_URL`, `SPLUNK_HEC_TOKEN` and `SPLUNK_INDEX` in `local-sensor/.env`. Use HTTPS outside a deliberately isolated lab. Only summarized scan/capture information is forwarded; raw files and packet payloads are not sent.

## Security boundaries

- The service rejects requests without its token and only listens on loopback. Keep `local-sensor/.env` private and never commit the token.
- Use CyberAmour and the sensor only on devices, files and networks you own or are authorized to assess. Captures can contain credentials, personal data and confidential metadata.
- File scan results apply only to the selected file. “No detections” is not a guarantee of safety.
- A packet capture and IDS analysis are detections, not prevention: this service does not block traffic, quarantine files, change firewall rules or continuously watch files in the background.
- For commercial distribution, review the current licenses and terms for each tool, ruleset, Splunk deployment and threat-intelligence provider.
