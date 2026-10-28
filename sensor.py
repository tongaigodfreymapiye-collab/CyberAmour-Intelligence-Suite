"""CyberAmour local Windows Defender sensor.

The service binds to loopback only. It exposes only health/status, explicit Microsoft
Defender status and user-requested Quick/Full scans, plus an optional public CISA KEV
reference endpoint. It does not accept file uploads, capture packets, block traffic,
or claim background monitoring.
"""
from __future__ import annotations

import json
import os
import secrets
import subprocess
import time
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)
TOKEN = os.getenv("CYBERAMOUR_SENSOR_TOKEN", "").strip()
CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
APP_ORIGINS = [x.strip() for x in os.getenv(
    "CYBERAMOUR_ALLOWED_ORIGINS",
    "https://tongaigodfreymapiye-collab.github.io,http://localhost:3000,http://127.0.0.1:3000",
).split(",") if x.strip()]

if len(TOKEN) < 32 or TOKEN.startswith("REPLACE_"):
    raise RuntimeError("CYBERAMOUR_SENSOR_TOKEN is missing or too short. Run scripts/setup-sensor.ps1.")

app = FastAPI(title="CyberAmour Local Security Sensor", version="1.1.0", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=APP_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

_kev_cache: dict[str, Any] = {"fetched": 0.0, "data": None}


def require_token(authorization: str | None = Header(default=None)) -> None:
    scheme, _, supplied = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not supplied or not secrets.compare_digest(supplied, TOKEN):
        raise HTTPException(status_code=401, detail="Invalid or missing local sensor token.")


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"service": "CyberAmour Local Security Sensor", "status": "available", "version": "1.1.0", "authRequiredForActions": True}


@app.get("/api/status")
def status(_: None = Depends(require_token)) -> dict[str, Any]:
    return {"service": "CyberAmour Local Security Sensor", "status": "connected", "version": "1.1.0", "platform": os.name}


@app.get("/api/defender/status")
def defender_status(_: None = Depends(require_token)) -> dict[str, Any]:
    """Read Microsoft Defender status without changing any protection settings."""
    if os.name != "nt":
        raise HTTPException(status_code=501, detail="Microsoft Defender endpoint scanning is available only on Windows.")
    script = (
        "$ErrorActionPreference='Stop'; $s=Get-MpComputerStatus; "
        "$t=Get-MpThreatDetection -ErrorAction SilentlyContinue; "
        "[pscustomobject]@{AMServiceEnabled=$s.AMServiceEnabled;AntivirusEnabled=$s.AntivirusEnabled;"
        "RealTimeProtectionEnabled=$s.RealTimeProtectionEnabled;AntivirusSignatureLastUpdated=$s.AntivirusSignatureLastUpdated;"
        "QuickScanAge=$s.QuickScanAge;FullScanAge=$s.FullScanAge;ThreatCount=@($t).Count} | ConvertTo-Json -Compress"
    )
    try:
        proc = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script], capture_output=True, text=True, timeout=30, check=False)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise HTTPException(status_code=503, detail=f"Could not query Microsoft Defender: {exc}") from exc
    if proc.returncode != 0:
        raise HTTPException(status_code=503, detail=(proc.stderr or "Microsoft Defender status query failed.")[-1200:])
    try:
        return {"available": True, "provider": "Microsoft Defender Antivirus", "status": json.loads(proc.stdout)}
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Microsoft Defender returned an unreadable status response.") from exc


class DefenderScanRequest(BaseModel):
    scanType: str = Field(default="QuickScan", pattern=r"^(QuickScan|FullScan)$")


@app.post("/api/defender/scan")
def run_defender_scan(payload: DefenderScanRequest, _: None = Depends(require_token)) -> dict[str, Any]:
    """Trigger a user-requested Microsoft Defender scan on this Windows computer."""
    if os.name != "nt":
        raise HTTPException(status_code=501, detail="Microsoft Defender scanning is available only on Windows.")
    scan_type = payload.scanType
    script = (
        "$ErrorActionPreference='Stop'; "
        f"Start-MpScan -ScanType {scan_type}; "
        "$s=Get-MpComputerStatus; $t=Get-MpThreatDetection -ErrorAction SilentlyContinue; "
        "[pscustomobject]@{scanType='" + scan_type + "';startedAt=(Get-Date).ToUniversalTime().ToString('o'); "
        "AntivirusEnabled=$s.AntivirusEnabled;RealTimeProtectionEnabled=$s.RealTimeProtectionEnabled; "
        "AntivirusSignatureLastUpdated=$s.AntivirusSignatureLastUpdated;ThreatCount=@($t).Count; "
        "detections=@($t | Select-Object -First 25 ThreatID,ThreatStatusID,InitialDetectionTime,LastThreatStatusChangeTime,ProcessName,Resources)} | ConvertTo-Json -Depth 5 -Compress"
    )
    try:
        proc = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script], capture_output=True, text=True, timeout=3600, check=False)
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="Defender scan exceeded the one-hour limit. Check Windows Security for scan progress.") from exc
    except OSError as exc:
        raise HTTPException(status_code=503, detail=f"Could not launch Microsoft Defender: {exc}") from exc
    if proc.returncode != 0:
        raise HTTPException(status_code=503, detail=(proc.stderr or "Microsoft Defender scan failed to start.")[-1500:])
    try:
        result = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Defender returned an unreadable response. Check Windows Security for actual scan status.") from exc
    result["note"] = "Scan was requested through Microsoft Defender on this computer. Detection counts reflect Defender's current threat history and may not be limited to this scan. Check Windows Security for final completion and remediation status."
    return result


@app.get("/api/intel/cisa-kev")
def cisa_kev(q: str = Query(default="", max_length=120), limit: int = Query(default=20, ge=1, le=100), _: None = Depends(require_token)) -> dict[str, Any]:
    """Retrieve the public CISA Known Exploited Vulnerabilities catalog, not a device scan."""
    now = time.time()
    if not _kev_cache["data"] or now - float(_kev_cache["fetched"]) > 6 * 60 * 60:
        request = Request(CISA_KEV_URL, headers={"User-Agent": "CyberAmour-Local-Sensor/1.1 (public CISA KEV feed reader)"})
        try:
            with urlopen(request, timeout=12) as response:
                data = json.loads(response.read(25 * 1024 * 1024).decode("utf-8"))
            if not isinstance(data, dict) or not isinstance(data.get("vulnerabilities"), list):
                raise ValueError("Unexpected CISA feed schema")
            _kev_cache["data"] = data
            _kev_cache["fetched"] = now
        except (URLError, TimeoutError, OSError, ValueError, json.JSONDecodeError) as exc:
            if not _kev_cache["data"]:
                raise HTTPException(status_code=502, detail=f"CISA KEV feed fetch failed: {str(exc)[:180]}") from exc
    data = _kev_cache["data"]
    items = data.get("vulnerabilities", [])
    term = q.strip().lower()
    if term:
        fields = ("cveID", "vendorProject", "product", "vulnerabilityName", "shortDescription", "knownRansomwareCampaignUse")
        items = [item for item in items if term in " ".join(str(item.get(key, "")) for key in fields).lower()]
    return {
        "source": CISA_KEV_URL,
        "catalogVersion": data.get("catalogVersion"),
        "dateReleased": data.get("dateReleased"),
        "fetchedAt": _kev_cache["fetched"],
        "totalMatches": len(items),
        "results": items[:limit],
        "note": "CISA KEV is a public list of vulnerabilities known to be exploited in the wild. It is not a complete vulnerability inventory or a scan of this device.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("CYBERAMOUR_SENSOR_PORT", "8765")), log_level="info")
