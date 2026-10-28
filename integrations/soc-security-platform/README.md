# SOC Security Monitoring & Threat Detection Platform

## Overview

The **SOC Security Monitoring & Threat Detection Platform** is a cybersecurity project that simulates a **Security Operations Center (SOC)** environment.
It continuously monitors authentication logs, detects suspicious activities, and visualizes security alerts through a web dashboard.

This project demonstrates how SOC analysts detect and analyze security threats such as **brute-force login attempts, suspicious IP activity, and abnormal behavior**.

The platform includes **real-time log monitoring, automated alert generation, attack simulation, threat intelligence integration, and an interactive security dashboard**.

---

# Key Features

### Real-Time Log Monitoring

Continuously monitors system authentication logs and detects suspicious login activity.

### Brute Force Attack Detection

Detects repeated failed login attempts from the same IP address.

### Threat Intelligence Integration

Compares detected IP addresses with a list of known malicious IPs.

### MITRE ATT&CK Mapping

Maps detected attacks to relevant MITRE ATT&CK techniques.

Example:

* Brute Force → **T1110**

### Security Alerts

Generates alerts when suspicious behavior is detected.

### SOC Web Dashboard

A web interface displaying:

* Total attacks detected
* Attack statistics
* Attacking IP addresses
* Security alerts

### Cyber Attack World Map

Displays attacker locations using GeoIP data.

### Attack Simulation

Includes a simulator that generates attack logs for testing detection mechanisms.

---

# System Architecture

```
Log Sources
     │
     ▼
Log Collector
     │
     ▼
Log Parser
     │
     ▼
Threat Detection Engine
     │
     ▼
Alert Generator
     │
     ▼
SOC Dashboard
```

---

# Project Structure

```
SOC-Security-Platform
│
├── dashboard
│   ├── app.py
│   └── templates
│
├── src
│   ├── log_collector.py
│   ├── log_parser.py
│   ├── brute_force_detector.py
│   ├── port_scan_detector.py
│   ├── anomaly_detector.py
│   ├── geoip_tracker.py
│   ├── mitre_mapper.py
│   ├── threat_intel.py
│   └── alert_engine.py
│
├── logs
│   └── auth.log
│
├── config
│   └── suspicious_ips.txt
│
├── data
│   └── alerts.json
│
├── run_soc_platform.py
├── attack_simulator.py
└── requirements.txt
```

---

# Technologies Used

Python
Flask
Pandas
Plotly
GeoIP2
Flask-SocketIO
Folium

Cybersecurity concepts used:

* SOC Monitoring
* Log Analysis
* Threat Detection
* MITRE ATT&CK Framework
* Threat Intelligence
* Security Event Monitoring

---

# Installation

Clone the repository:

```
git clone https://github.com/Guntasubham/SOC-Security-Platform.git
cd SOC-Security-Platform
```

Create a virtual environment:

```
python -m venv .venv
```

Activate it:

Windows:

```
.venv\Scripts\activate
```

Install dependencies:

```
pip install -r requirements.txt
```

---

# Running the Platform

Start the SOC monitoring platform:

```
python run_soc_platform.py
```

Open the dashboard in your browser:

```
http://127.0.0.1:5000
```

---

# Simulating Attacks

You can simulate attacks using:

```
python attack_simulator.py
```

The simulator generates fake login attempts which trigger detection alerts in the SOC dashboard.

---

# Example Alert

```
SOC ALERT
IP: 185.220.101.45
Attack Type: Brute Force
MITRE Technique: T1110
```

---

# Use Cases

This project demonstrates concepts used by:

* Security Operations Centers (SOC)
* Security Analysts
* Threat Detection Systems
* Security Information and Event Management (SIEM)

---

# Future Improvements

Possible enhancements include:

* Machine learning based anomaly detection
* Real-time streaming log analysis
* User authentication for SOC analysts
* Integration with external threat intelligence APIs
* Containerization using Docker
* Cloud deployment

---

# Author
Gunta Subham
Cybersecurity Project – SOC Monitoring Platform
Developed for learning and demonstrating practical **SOC analyst skills**.

---

# License

This project is open source and available for educational purposes.
## GeoIP Database Setup

This project requires the GeoLite2 City database.

Download it from:
https://dev.maxmind.com/geoip/geolite2-free-geolocation-data

Extract the file and place:

GeoLite2-City.mmdb

in the project root directory.
