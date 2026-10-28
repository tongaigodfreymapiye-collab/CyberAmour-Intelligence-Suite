"""CyberAmour local security sensor.

Binds to loopback only. Scans uploads as data (never executes them), analyses PCAPs
with tshark, optionally runs Suricata offline analysis, and sends summary events to Splunk HEC.
"""
from __future__ import annotations

import asyncio
import csv
import hashlib
import io
import json
import os
import re
import secrets
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.datastructures import UploadFile as StarletteUploadFile

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)
TOKEN = os.getenv("CYBERAMOUR_SENSOR_TOKEN", "").strip()
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(100 * 1024 * 1024)))
MAX_PCAP_PACKETS = max(100, min(int(os.getenv("MAX_PCAP_PACKETS", "5000")), 20000))
SPLUNK_HEC_URL = os.getenv("SPLUNK_HEC_URL", "").strip()
SPLUNK_HEC_TOKEN = os.getenv("SPLUNK_HEC_TOKEN", "").strip()
SPLUNK_INDEX = os.getenv("SPLUNK_INDEX", "main").strip() or "main"
ALLOW_HTTP_SPLUNK = os.getenv("ALLOW_HTTP_SPLUNK", "false").lower() == "true"
YARA_RULES_PATH = os.getenv("YARA_RULES_PATH", "").strip()
CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

APP_ORIGINS = [x.strip() for x in os.getenv(
    "CYBERAMOUR_ALLOWED_ORIGINS",
    "https://tongaigodfreymapiye-collab.github.io,https://tongaigodfreymapiye-collab.github.io/CyberAmour-Intelligence-Suite,http://localhost:3000,http://127.0.0.1:3000"
).split(",") if x.strip()]
# Credentials are mandatory. Sensor deliberately fails closed instead of starting unauthenticated.
if len(TOKEN) < 32 or TOKEN.startswith("REPLACE_"):
    raise RuntimeError(
        "CYBERAMOUR_SENSOR_TOKEN is missing or too short. Run setup-sensor.ps1 or create local-sensor/.env "
        "with a random token of at least 32 characters."
    )

app = FastAPI(title="CyberAmour Local Security Sensor", version="1.0.0", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=APP_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

class LiveCaptureRequest(BaseModel):
    interface: str = Field(min_length=1, max_length=12, pattern=r"^[0-9]{1,3}$")
    durationSeconds: int = Field(default=15, ge=5, le=30)

_kev_cache: dict[str, Any] = {"fetched": 0.0, "data": None}


def _tool(name: str, env_name: str | None = None) -> str | None:
    configured = os.getenv(env_name, "").strip() if env_name else ""
    if configured:
        p = Path(configured).expanduser()
        return str(p) if p.exists() else shutil.which(configured)
    found = shutil.which(name)
    if found:
        return found
    # Discover standard Windows install locations as a convenience; do not download or execute installers here.
    if os.name == "nt":
        candidates = {
            "clamscan": [r"C:\Program Files\ClamAV\clamscan.exe", r"C:\Program Files (x86)\ClamAV\clamscan.exe"],
            "freshclam": [r"C:\Program Files\ClamAV\freshclam.exe", r"C:\Program Files (x86)\ClamAV\freshclam.exe"],
            "tshark": [r"C:\Program Files\Wireshark\tshark.exe"],
            "suricata": [r"C:\Program Files\Suricata\suricata.exe", r"C:\Program Files (x86)\Suricata\suricata.exe"],
            "zeek": [r"C:\Program Files\Zeek\bin\zeek.exe"],
            "yara": [r"C:\Program Files\YARA\yara.exe"],
        }
        for candidate in candidates.get(name, []):
            if Path(candidate).is_file():
                return candidate
    return None


def _version(command: list[str]) -> dict[str, Any]:
    try:
        proc = subprocess.run(command, capture_output=True, text=True, timeout=8, check=False)
        text = (proc.stdout or proc.stderr or "").strip().splitlines()
        return {"installed": proc.returncode == 0, "version": text[0][:220] if text else "Version unavailable"}
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {"installed": False, "version": None, "detail": str(exc)[:180]}


def _tool_status() -> dict[str, Any]:
    clamscan = _tool("clamscan", "CLAMSCAN_BIN")
    yara = _tool("yara", "YARA_BIN")
    tshark = _tool("tshark", "TSHARK_BIN")
    suricata = _tool("suricata", "SURICATA_BIN")
    zeek = _tool("zeek", "ZEEK_BIN")
    clam = _version([clamscan, "--version"]) if clamscan else {"installed": False, "version": None}
    yara_v = _version([yara, "--version"]) if yara else {"installed": False, "version": None}
    tshark_v = _version([tshark, "--version"]) if tshark else {"installed": False, "version": None}
    suricata_v = _version([suricata, "--build-info"]) if suricata else {"installed": False, "version": None}
    zeek_v = _version([zeek, "--version"]) if zeek else {"installed": False, "version": None}
    return {
        "clamav": clam,
        "yara": {**yara_v, "rules_configured": bool(YARA_RULES_PATH and Path(YARA_RULES_PATH).exists())},
        "tshark": tshark_v,
        "suricata": suricata_v,
        "zeek": zeek_v,
        "splunk_hec": {"configured": bool(SPLUNK_HEC_URL and SPLUNK_HEC_TOKEN), "index": SPLUNK_INDEX if SPLUNK_HEC_URL and SPLUNK_HEC_TOKEN else None},
        "public_feeds": {"cisa_kev": {"configured": True, "url": CISA_KEV_URL}},
        "maxUploadBytes": MAX_UPLOAD_BYTES,
        "maxPcapPackets": MAX_PCAP_PACKETS,
        "liveCapture": {"available": bool(tshark), "maxDurationSeconds": 30, "userInitiatedOnly": True},
    }


def require_token(authorization: str | None = Header(default=None)) -> None:
    scheme, _, supplied = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not supplied or not secrets.compare_digest(supplied, TOKEN):
        raise HTTPException(status_code=401, detail="Invalid or missing local sensor token.")


def _run(command: list[str], timeout: int = 90) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail=f"Security tool timed out after {timeout} seconds.") from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Could not start security tool: {exc}") from exc


def _hec(event: dict[str, Any], sourcetype: str) -> dict[str, Any]:
    if not (SPLUNK_HEC_URL and SPLUNK_HEC_TOKEN):
        return {"sent": False, "reason": "Splunk HEC is not configured on the local sensor."}
    if not SPLUNK_HEC_URL.startswith("https://") and not ALLOW_HTTP_SPLUNK:
        return {"sent": False, "reason": "Splunk HEC must use HTTPS unless ALLOW_HTTP_SPLUNK=true is explicitly set for a trusted local lab."}
    body = json.dumps({"time": int(time.time()), "index": SPLUNK_INDEX, "sourcetype": sourcetype, "event": event}).encode("utf-8")
    req = Request(SPLUNK_HEC_URL, data=body, method="POST", headers={
        "Authorization": f"Splunk {SPLUNK_HEC_TOKEN}", "Content-Type": "application/json"
    })
    try:
        with urlopen(req, timeout=6) as response:
            return {"sent": 200 <= response.status < 300, "status": response.status}
    except (URLError, TimeoutError, OSError) as exc:
        return {"sent": False, "reason": f"Splunk HEC delivery failed: {str(exc)[:180]}"}


async def _save_upload(upload: UploadFile) -> tuple[Path, str, int]:
    suffix = Path(upload.filename or "upload.bin").suffix[:12]
    data = await upload.read(MAX_UPLOAD_BYTES + 1)
    await upload.close()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB local sensor limit.")
    digest = hashlib.sha256(data).hexdigest()
    # Keep upload filenames out of filesystem paths. Uploaded content is data only and never executed.
    fd, path = tempfile.mkstemp(prefix="cyberamour-", suffix=suffix)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
    return Path(path), digest, len(data)


def _clamav_scan(path: Path) -> dict[str, Any]:
    exe = _tool("clamscan", "CLAMSCAN_BIN")
    if not exe:
        return {"available": False, "verdict": "not_run", "message": "ClamAV clamscan is not installed or CLAMSCAN_BIN is not configured."}
    proc = _run([exe, "--no-summary", "--infected", str(path)], timeout=180)
    output = (proc.stdout + "\n" + proc.stderr).strip()[-4000:]
    if proc.returncode == 0:
        verdict = "no_detection"
    elif proc.returncode == 1:
        verdict = "detection"
    else:
        verdict = "error"
    return {"available": True, "verdict": verdict, "returnCode": proc.returncode, "output": output,
            "message": "No ClamAV signature was reported; this is not proof the file is safe." if verdict == "no_detection" else None}


def _yara_scan(path: Path) -> dict[str, Any]:
    exe = _tool("yara", "YARA_BIN")
    rules = Path(YARA_RULES_PATH).expanduser() if YARA_RULES_PATH else None
    if not exe:
        return {"available": False, "verdict": "not_run", "message": "YARA CLI is not installed."}
    if not rules or not rules.exists():
        return {"available": True, "verdict": "not_run", "message": "YARA is installed, but YARA_RULES_PATH is not configured to a valid rules file/directory."}
    command = [exe, "-w"]
    if rules.is_dir():
        command.extend(["-r", str(rules), str(path)])
    else:
        command.extend([str(rules), str(path)])
    proc = _run(command, timeout=90)
    matches = [line.strip()[:300] for line in (proc.stdout or "").splitlines() if line.strip()]
    if proc.returncode == 0:
        verdict = "matches" if matches else "no_match"
    else:
        verdict = "error"
    return {"available": True, "verdict": verdict, "matches": matches[:100], "returnCode": proc.returncode,
            "message": "YARA findings need analyst review; rule hits can be false positives." if matches else None,
            "error": (proc.stderr or "").strip()[-1200:] if proc.returncode not in (0, 1) else None}


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"service": "CyberAmour Local Security Sensor", "status": "available", "version": "1.0.0", "authRequiredForActions": True}


@app.get("/api/status")
def status(_: None = Depends(require_token)) -> dict[str, Any]:
    return {"service": "CyberAmour Local Security Sensor", "status": "connected", "version": "1.0.0", "tools": _tool_status()}


@app.get("/api/defender/status")
def defender_status(_: None = Depends(require_token)) -> dict[str, Any]:
    """Return Windows Defender status from this local computer; never changes protection settings."""
    if os.name != "nt":
        raise HTTPException(status_code=501, detail="Microsoft Defender endpoint scanning is available only on Windows.")
    script = "$ErrorActionPreference='Stop'; $s=Get-MpComputerStatus; $t=Get-MpThreatDetection -ErrorAction SilentlyContinue; [pscustomobject]@{AMServiceEnabled=$s.AMServiceEnabled;AntivirusEnabled=$s.AntivirusEnabled;RealTimeProtectionEnabled=$s.RealTimeProtectionEnabled;AntivirusSignatureLastUpdated=$s.AntivirusSignatureLastUpdated;QuickScanAge=$s.QuickScanAge;FullScanAge=$s.FullScanAge;ThreatCount=@($t).Count} | ConvertTo-Json -Compress"
    try:
        proc = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script], capture_output=True, text=True, timeout=30, check=False)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise HTTPException(status_code=503, detail=f"Could not query Microsoft Defender: {exc}")
    if proc.returncode != 0:
        raise HTTPException(status_code=503, detail=(proc.stderr or "Microsoft Defender status query failed.")[-1200:])
    try:
        return {"available": True, "provider": "Microsoft Defender Antivirus", "status": json.loads(proc.stdout)}
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Microsoft Defender returned an unreadable status response.")


class DefenderScanRequest(BaseModel):
    scanType: str = Field(default="QuickScan", pattern=r"^(QuickScan|FullScan)$")


@app.post("/api/defender/scan")
def run_defender_scan(payload: DefenderScanRequest, _: None = Depends(require_token)) -> dict[str, Any]:
    """Trigger an explicit user-requested Defender scan on this Windows machine."""
    if os.name != "nt":
        raise HTTPException(status_code=501, detail="Microsoft Defender scanning is available only on Windows.")
    scan_type = payload.scanType
    script = ("$ErrorActionPreference='Stop'; "
              f"Start-MpScan -ScanType {scan_type}; "
              "$s=Get-MpComputerStatus; "
              "$t=Get-MpThreatDetection -ErrorAction SilentlyContinue; "
              "[pscustomobject]@{scanType='" + scan_type + "';startedAt=(Get-Date).ToUniversalTime().ToString('o'); "
              "AntivirusEnabled=$s.AntivirusEnabled;RealTimeProtectionEnabled=$s.RealTimeProtectionEnabled; "
              "AntivirusSignatureLastUpdated=$s.AntivirusSignatureLastUpdated;ThreatCount=@($t).Count; "
              "detections=@($t | Select-Object -First 25 ThreatID,ThreatStatusID,InitialDetectionTime,LastThreatStatusChangeTime,ProcessName,Resources)} | ConvertTo-Json -Depth 5 -Compress")
    try:
        proc = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script], capture_output=True, text=True, timeout=3600, check=False)
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Defender scan exceeded the one-hour limit. Check Windows Security for scan progress.")
    except OSError as exc:
        raise HTTPException(status_code=503, detail=f"Could not launch Microsoft Defender: {exc}")
    if proc.returncode != 0:
        raise HTTPException(status_code=503, detail=(proc.stderr or "Microsoft Defender scan failed to start.")[-1500:])
    try:
        result = json.loads(proc.stdout)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Defender scan command returned an unreadable response. Check Windows Security for the actual scan status.")
    result["note"] = "Scan was requested through Microsoft Defender on this computer. Detection counts reflect Defender's current threat history and are not guaranteed to be only from this scan. Check Windows Security for final completion and remediation status."
    result["splunk"] = _hec({"scanType": scan_type, "ThreatCount": result.get("ThreatCount"), "startedAt": result.get("startedAt")}, "cyberamour:defender:scan")
    return result


@app.post("/api/scan/file")
async def scan_file(file: UploadFile = File(...), _: None = Depends(require_token)) -> dict[str, Any]:
    path, digest, size = await _save_upload(file)
    try:
        clam = await asyncio.to_thread(_clamav_scan, path)
        yara = await asyncio.to_thread(_yara_scan, path)
        if clam.get("verdict") == "detection" or yara.get("verdict") == "matches":
            overall = "detections_found"
        elif clam.get("verdict") == "no_detection" and yara.get("verdict") in ("no_match", "not_run"):
            overall = "no_detections_reported"
        else:
            overall = "incomplete"
        result = {
            "fileName": Path(file.filename or "uploaded-file").name[:255], "sizeBytes": size, "sha256": digest,
            "overall": overall, "clamav": clam, "yara": yara,
            "note": "This scans only the uploaded file. A no-detection result is not a guarantee of safety; it does not scan the device or execute the file."
        }
        result["splunk"] = _hec({k: v for k, v in result.items() if k not in ("clamav", "yara")}, "cyberamour:antivirus:file_scan")
        return result
    finally:
        try: path.unlink(missing_ok=True)
        except OSError: pass


@app.get("/api/network/interfaces")
def network_interfaces(_: None = Depends(require_token)) -> dict[str, Any]:
    """Return only TShark's enumerated interface IDs/labels; no capture starts from this endpoint."""
    exe = _tool("tshark", "TSHARK_BIN")
    if not exe:
        raise HTTPException(status_code=424, detail="TShark is not installed. Install Wireshark, ensure tshark is available, and restart the sensor.")
    proc = _run([exe, "-D"], timeout=12)
    if proc.returncode != 0:
        raise HTTPException(status_code=424, detail=f"TShark could not list interfaces. On Windows, verify Npcap is installed: {(proc.stderr or proc.stdout)[-1000:]}")
    interfaces: list[dict[str, str]] = []
    for line in (proc.stdout or "").splitlines():
        match = re.match(r"^\s*(\d+)\.\s+(.+?)\s*$", line)
        if match:
            interfaces.append({"id": match.group(1), "label": match.group(2)[:240]})
    return {"interfaces": interfaces, "count": len(interfaces), "note": "Listing interfaces does not start capture. A live capture is started only after the user chooses an interface and duration."}


@app.post("/api/network/capture")
async def capture_live_network(payload: LiveCaptureRequest, _: None = Depends(require_token)) -> dict[str, Any]:
    """Capture for a bounded, explicit duration, then run the same PCAP analysis pipeline."""
    exe = _tool("tshark", "TSHARK_BIN")
    if not exe:
        raise HTTPException(status_code=424, detail="TShark is not installed. Install Wireshark and restart the sensor.")
    if not re.fullmatch(r"[0-9]{1,3}", payload.interface):
        raise HTTPException(status_code=400, detail="Choose an interface ID returned by the local sensor.")
    listed = _run([exe, "-D"], timeout=12)
    valid_ids = {m.group(1) for line in (listed.stdout or "").splitlines() if (m := re.match(r"^\s*(\d+)\.\s+", line))}
    if listed.returncode != 0 or payload.interface not in valid_ids:
        raise HTTPException(status_code=400, detail="The selected interface is not in TShark's current interface list. Refresh interfaces and try again.")
    scratch = Path(tempfile.mkdtemp(prefix="cyberamour-live-capture-"))
    capture_path = scratch / "user-initiated-capture.pcapng"
    try:
        command = [exe, "-n", "-i", payload.interface, "-a", f"duration:{payload.durationSeconds}", "-w", str(capture_path)]
        proc = await asyncio.to_thread(_run, command, payload.durationSeconds + 25)
        if not capture_path.exists() or capture_path.stat().st_size < 24:
            detail = (proc.stderr or proc.stdout or "TShark produced no capture file.")[-1200:]
            raise HTTPException(status_code=422, detail=f"Capture produced no readable packets. Check adapter permissions/Npcap and interface selection. {detail}")
        upload = StarletteUploadFile(filename=f"live-capture-{int(time.time())}.pcapng", file=capture_path.open("rb"))
        result = await analyze_pcap(file=upload, _=None)
        result["capture"] = {"mode": "user-initiated-live-capture", "interfaceId": payload.interface,
                              "interfaceLabel": next((m.group(2).strip() for line in (listed.stdout or "").splitlines() if (m := re.match(r"^\s*(\d+)\.\s+(.+?)\s*$", line)) and m.group(1) == payload.interface), payload.interface),
                              "requestedDurationSeconds": payload.durationSeconds, "captureExitCode": proc.returncode}
        result["note"] = "User-initiated bounded live capture from the selected local network interface. Only this capture was analyzed. Capture can contain sensitive information; handle it securely. No traffic was blocked or changed."
        return result
    finally:
        shutil.rmtree(scratch, ignore_errors=True)


@app.post("/api/pcap/analyze")
async def analyze_pcap(file: UploadFile = File(...), _: None = Depends(require_token)) -> dict[str, Any]:
    path, digest, size = await _save_upload(file)
    scratch = Path(tempfile.mkdtemp(prefix="cyberamour-pcap-"))
    try:
        tshark = _tool("tshark", "TSHARK_BIN")
        if not tshark:
            raise HTTPException(status_code=424, detail="TShark is not installed. Install Wireshark and ensure tshark is on PATH, then restart the sensor.")
        fields = ["frame.number", "frame.time_epoch", "ip.src", "ipv6.src", "ip.dst", "ipv6.dst", "frame.protocols", "frame.len",
                  "tcp.srcport", "udp.srcport", "tcp.dstport", "udp.dstport", "dns.qry.name", "http.host", "tls.handshake.extensions_server_name"]
        command = [tshark, "-n", "-r", str(path), "-c", str(MAX_PCAP_PACKETS), "-T", "fields", "-E", "header=y", "-E", "separator=\t", "-E", "quote=d", "-E", "occurrence=f"]
        for field in fields:
            command.extend(["-e", field])
        proc = await asyncio.to_thread(_run, command, 120)
        if proc.returncode != 0:
            raise HTTPException(status_code=422, detail=f"TShark could not parse this capture: {(proc.stderr or proc.stdout)[-1200:]}")
        reader = csv.DictReader(io.StringIO(proc.stdout), delimiter="\t", quotechar='"')
        packets: list[dict[str, Any]] = []
        protocol_counts: dict[str, int] = {}
        peer_counts: dict[str, int] = {}
        total_bytes = 0
        for row in reader:
            src = row.get("ip.src") or row.get("ipv6.src") or ""
            dst = row.get("ip.dst") or row.get("ipv6.dst") or ""
            try: length = int(row.get("frame.len") or 0)
            except ValueError: length = 0
            protocols = row.get("frame.protocols") or "unknown"
            proto = protocols.split(":")[-1].upper()[:40]
            protocol_counts[proto] = protocol_counts.get(proto, 0) + 1
            total_bytes += length
            for ip in (src, dst):
                if ip: peer_counts[ip] = peer_counts.get(ip, 0) + 1
            packets.append({
                "number": row.get("frame.number"), "time": row.get("frame.time_epoch"), "source": src, "destination": dst,
                "protocol": proto, "protocolStack": protocols[:180], "length": length,
                "sourcePort": row.get("tcp.srcport") or row.get("udp.srcport") or "",
                "destinationPort": row.get("tcp.dstport") or row.get("udp.dstport") or "",
                "dnsQuery": row.get("dns.qry.name") or "", "httpHost": row.get("http.host") or "",
                "tlsServerName": row.get("tls.handshake.extensions_server_name") or "",
            })
        packets = packets[:500]
        suricata = await asyncio.to_thread(_run_suricata, path, scratch)
        summary = {
            "fileName": Path(file.filename or "capture.pcap").name[:255], "sizeBytes": size, "sha256": digest,
            "engine": "TShark / Wireshark dissectors", "sampledPackets": len(packets), "packetLimit": MAX_PCAP_PACKETS,
            "estimatedBytesForAnalyzedRows": total_bytes, "protocolCounts": dict(sorted(protocol_counts.items(), key=lambda x: x[1], reverse=True)[:30]),
            "topPeers": [{"ip": ip, "observations": n} for ip, n in sorted(peer_counts.items(), key=lambda x: x[1], reverse=True)[:30]],
            "packets": packets, "suricata": suricata,
            "note": "Analysis is based on this uploaded capture only. The sensor does not capture live network traffic or automatically block connections. Captures may contain credentials or personal data; handle them securely."
        }
        summary["splunk"] = _hec({k: v for k, v in summary.items() if k not in ("packets", "topPeers")}, "cyberamour:network:pcap_summary")
        return summary
    finally:
        try: path.unlink(missing_ok=True)
        except OSError: pass
        shutil.rmtree(scratch, ignore_errors=True)


def _run_suricata(pcap: Path, output_dir: Path) -> dict[str, Any]:
    exe = _tool("suricata", "SURICATA_BIN")
    if not exe:
        return {"available": False, "message": "Suricata is not installed. TShark packet decoding still completed."}
    outdir = output_dir / "suricata"
    outdir.mkdir(parents=True, exist_ok=True)
    try:
        proc = _run([exe, "-r", str(pcap), "-l", str(outdir), "-k", "none"], timeout=120)
    except HTTPException as exc:
        return {"available": True, "error": exc.detail, "alerts": []}
    eve = outdir / "eve.json"
    alerts: list[dict[str, Any]] = []
    if eve.exists():
        try:
            with eve.open("r", encoding="utf-8", errors="replace") as handle:
                for line in handle:
                    try: row = json.loads(line)
                    except json.JSONDecodeError: continue
                    if row.get("event_type") == "alert":
                        alert = row.get("alert", {})
                        alerts.append({"timestamp": row.get("timestamp"), "signature": alert.get("signature"), "category": alert.get("category"),
                                       "severity": alert.get("severity"), "source": row.get("src_ip"), "destination": row.get("dest_ip"),
                                       "sourcePort": row.get("src_port"), "destinationPort": row.get("dest_port"), "protocol": row.get("proto")})
        except OSError:
            pass
    return {"available": True, "returnCode": proc.returncode, "alerts": alerts[:200],
            "message": "Suricata alerts reflect the installed rules/configuration; no alerts does not prove that traffic is safe." if not alerts else None,
            "error": (proc.stderr or "").strip()[-1200:] if proc.returncode != 0 else None}


@app.get("/api/intel/cisa-kev")
def cisa_kev(q: str = Query(default="", max_length=120), limit: int = Query(default=20, ge=1, le=100), _: None = Depends(require_token)) -> dict[str, Any]:
    now = time.time()
    if not _kev_cache["data"] or now - float(_kev_cache["fetched"]) > 6 * 60 * 60:
        request = Request(CISA_KEV_URL, headers={"User-Agent": "CyberAmour-Local-Sensor/1.0 (public CISA KEV feed reader)"})
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
        items = [x for x in items if term in " ".join(str(x.get(k, "")) for k in ("cveID", "vendorProject", "product", "vulnerabilityName", "shortDescription", "knownRansomwareCampaignUse")).lower()]
    return {"source": CISA_KEV_URL, "catalogVersion": data.get("catalogVersion"), "dateReleased": data.get("dateReleased"),
            "fetchedAt": _kev_cache["fetched"], "totalMatches": len(items), "results": items[:limit],
            "note": "CISA KEV is a public list of vulnerabilities known to be exploited in the wild; it is not a complete vulnerability or malware feed."}


@app.get("/api/integrations")
def integrations(_: None = Depends(require_token)) -> dict[str, Any]:
    return {"openSource": [
        {"name": "ClamAV", "role": "Signature-based file scanning", "url": "https://www.clamav.net/"},
        {"name": "YARA", "role": "Pattern-based file analysis", "url": "https://github.com/VirusTotal/yara"},
        {"name": "Wireshark / TShark", "role": "PCAP protocol dissection and analysis", "url": "https://www.wireshark.org/"},
        {"name": "Suricata", "role": "Offline IDS alerts for uploaded PCAPs", "url": "https://suricata.io/"},
        {"name": "Zeek", "role": "Network security metadata framework", "url": "https://zeek.org/"},
        {"name": "SigmaHQ rules", "role": "Detection rule repository for compatible SIEM pipelines", "url": "https://github.com/SigmaHQ/sigma"},
        {"name": "CISA KEV", "role": "Public exploited-vulnerability catalog", "url": CISA_KEV_URL},
        {"name": "Splunk HEC", "role": "Optional event forwarding", "url": "https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector"},
    ], "tools": _tool_status()}


if __name__ == "__main__":
    import uvicorn
    # Never change this to 0.0.0.0 without implementing proper network access controls.
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("CYBERAMOUR_SENSOR_PORT", "8765")), log_level="info")
