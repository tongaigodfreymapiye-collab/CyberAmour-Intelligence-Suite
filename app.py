from __future__ import annotations

import csv
import json
import os
import re
import hashlib
import shutil
import sqlite3
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("CYBERAMOUR_DATA_DIR", str(BASE_DIR / "data")))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = Path(os.getenv("CYBERAMOUR_DB_PATH", str(DATA_DIR / "soc.db")))
ATTACK_STIX_PATH = Path(os.getenv("ATTACK_STIX_PATH", str(DATA_DIR / "enterprise-attack.json")))
KEV_JSON_PATH = Path(os.getenv("KEV_JSON_PATH", str(DATA_DIR / "known_exploited_vulnerabilities.json")))
KEV_CSV_PATH = Path(os.getenv("KEV_CSV_PATH", str(DATA_DIR / "known_exploited_vulnerabilities.csv")))
BODMAS_CSV_PATH = Path(os.getenv("BODMAS_CSV_PATH", str(DATA_DIR / "bodmas_metadata.csv")))
BODMAS_DB_PATH = DATA_DIR / "bodmas_hashes.sqlite3"
QUARANTINE_DIR = DATA_DIR / "quarantine"
QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_ORIGINS = [x.strip() for x in os.getenv("CYBERAMOUR_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",") if x.strip()]

app = FastAPI(
    title="CyberAmour SOC Integration API",
    version="0.1.0",
    description="Local-first ATT&CK/KEV enrichment and SOC workflow API. Response actions are proposals only until an authorised EDR/firewall connector is configured.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

attack_db = None
attack_load_error: str | None = None
try:
    if ATTACK_STIX_PATH.exists():
        from mitreattack.stix20 import MitreAttackData
        attack_db = MitreAttackData(str(ATTACK_STIX_PATH))
except Exception as exc:
    attack_load_error = f"{type(exc).__name__}: {exc}"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with db() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            severity TEXT NOT NULL,
            title TEXT NOT NULL,
            source TEXT,
            host TEXT,
            source_ip TEXT,
            payload_json TEXT NOT NULL,
            enrichment_json TEXT NOT NULL
        )""")
        conn.execute("""
        CREATE TABLE IF NOT EXISTS response_proposals (
            id TEXT PRIMARY KEY,
            alert_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            action TEXT NOT NULL,
            target TEXT,
            rationale TEXT NOT NULL,
            approved_by TEXT,
            approved_at TEXT,
            FOREIGN KEY(alert_id) REFERENCES alerts(id)
        )""")
        conn.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            actor TEXT NOT NULL,
            event TEXT NOT NULL,
            object_id TEXT,
            details_json TEXT NOT NULL
        )""")


init_db()


def field(obj: Any, name: str, default=None):
    try:
        return obj.get(name, default)
    except Exception:
        return getattr(obj, name, default)


def attack_id(obj: Any) -> str | None:
    for ref in field(obj, "external_references", []) or []:
        if field(ref, "source_name") == "mitre-attack":
            value = field(ref, "external_id")
            if value:
                return str(value)
    return None


def technique_to_dict(obj: Any) -> dict[str, Any]:
    phases = field(obj, "kill_chain_phases", []) or []
    return {
        "attack_id": attack_id(obj),
        "stix_id": field(obj, "id"),
        "name": field(obj, "name"),
        "description": (field(obj, "description", "") or "")[:3000],
        "platforms": field(obj, "x_mitre_platforms", []) or [],
        "is_subtechnique": bool(field(obj, "x_mitre_is_subtechnique", False)),
        "tactics": [field(p, "phase_name") for p in phases if field(p, "kill_chain_name") == "mitre-attack"],
        "url": next((field(r, "url") for r in (field(obj, "external_references", []) or [])
                     if field(r, "source_name") == "mitre-attack"), None),
    }


def load_kev() -> list[dict[str, Any]]:
    if KEV_JSON_PATH.exists():
        try:
            raw = json.loads(KEV_JSON_PATH.read_text(encoding="utf-8-sig"))
            if isinstance(raw, list):
                vulns = raw
            elif isinstance(raw, dict):
                vulns = raw.get("vulnerabilities", [])
            else:
                vulns = []
            return [v for v in vulns if isinstance(v, dict)]
        except Exception:
            pass
    if KEV_CSV_PATH.exists():
        try:
            with KEV_CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
                return list(csv.DictReader(f))
        except Exception:
            pass
    return []


class AlertIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    severity: str = "medium"
    source: str = "manual"
    host: str | None = None
    source_ip: str | None = None
    cve_ids: list[str] = Field(default_factory=list)
    technique_ids: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.5, ge=0, le=1)
    details: dict[str, Any] = Field(default_factory=dict)


class LayerTechnique(BaseModel):
    technique_id: str
    score: int = Field(default=50, ge=0, le=100)
    comment: str | None = None


class NavigatorLayerIn(BaseModel):
    name: str = "CyberAmour Detection Coverage"
    description: str = "Generated from CyberAmour SOC observations. Scores represent observed detections/coverage, not certainty of compromise."
    techniques: list[LayerTechnique] = Field(default_factory=list)


def log_event(actor: str, event: str, object_id: str | None, details: dict[str, Any]) -> None:
    with db() as conn:
        conn.execute(
            "INSERT INTO audit_log(created_at, actor, event, object_id, details_json) VALUES(?,?,?,?,?)",
            (utc_now(), actor, event, object_id, json.dumps(details, ensure_ascii=False)),
        )


def find_techniques(ids: list[str]) -> list[dict[str, Any]]:
    if not attack_db:
        return []
    found = []
    for tid in sorted(set(x.strip().upper() for x in ids if x.strip())):
        try:
            obj = attack_db.get_object_by_attack_id(tid, "attack-pattern")
            if obj:
                found.append(technique_to_dict(obj))
        except Exception:
            continue
    return found


def find_kev(ids: list[str]) -> list[dict[str, Any]]:
    wanted = {x.strip().upper() for x in ids if x.strip()}
    results = []
    for row in load_kev():
        cve = str(row.get("cveID") or row.get("cve_id") or row.get("CVE") or "").upper()
        if cve in wanted:
            results.append({
                "cve_id": cve,
                "name": row.get("vulnerabilityName") or row.get("name") or "",
                "vendor": row.get("vendorProject") or row.get("vendor") or "",
                "product": row.get("product") or "",
                "date_added": row.get("dateAdded") or row.get("date_added") or "",
                "due_date": row.get("dueDate") or row.get("due_date") or "",
                "required_action": row.get("requiredAction") or row.get("required_action") or "",
                "ransomware_use": row.get("knownRansomwareCampaignUse") or "",
            })
    return results


def propose_actions(alert: AlertIn, kev_matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
    proposals = []
    sev = alert.severity.lower()
    if alert.host and (sev in {"critical", "high"} or kev_matches):
        proposals.append({
            "action": "isolate_host",
            "target": alert.host,
            "requires_approval": True,
            "rationale": "High/critical alert or KEV match detected. Validate business impact and confirm endpoint isolation is supported by the connected EDR.",
        })
    if alert.source_ip and sev in {"critical", "high"}:
        proposals.append({
            "action": "block_source_ip",
            "target": alert.source_ip,
            "requires_approval": True,
            "rationale": "High/critical alert has a source IP. Validate attribution and check shared/NAT infrastructure before blocking.",
        })
    if kev_matches:
        proposals.append({
            "action": "prioritise_patch",
            "target": ", ".join(v["cve_id"] for v in kev_matches),
            "requires_approval": False,
            "rationale": "One or more CVEs match the supplied Known Exploited Vulnerabilities snapshot. Confirm the installed product/version and exposure.",
        })
    return proposals



@app.post("/api/endpoint/scan")
def run_local_endpoint_scan() -> dict[str, Any]:
    """Run the bundled read-only Windows inventory script; no arbitrary command input."""
    if os.name != "nt":
        raise HTTPException(status_code=501, detail="Automatic endpoint scan is supported only on Windows.")
    script = BASE_DIR / "Scan-CyberAmour.ps1"
    kev_csv = KEV_CSV_PATH
    report_path = DATA_DIR / "cyberamour-scan-report.json"
    if not script.is_file():
        raise HTTPException(status_code=500, detail=f"Bundled scanner not found: {script}")
    if not kev_csv.is_file():
        raise HTTPException(status_code=500, detail="Bundled CISA KEV CSV is missing beside the scanner.")
    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "RemoteSigned",
             "-File", str(script), "-KevCsvPath", str(kev_csv), "-OutputPath", str(report_path)],
            capture_output=True, text=True, timeout=120, check=False,
            cwd=str(script.parent),
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Endpoint scan exceeded 120 seconds; check the local agent.")
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Could not launch PowerShell: {exc}")
    if not report_path.is_file():
        detail = (result.stderr or result.stdout or "Scanner did not produce a report.")[-3000:]
        raise HTTPException(status_code=500, detail=detail)
    try:
        report = json.loads(report_path.read_text(encoding="utf-8-sig"))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scanner report is not valid JSON: {exc}")
    report["_execution"] = {
        "exitCode": result.returncode,
        "completedAt": utc_now(),
        "stderr": (result.stderr or "")[-1500:],
    }
    return report


def _run_defender_action(action: str, scan_type: str | None = None) -> dict[str, Any]:
    """Call a fixed, bundled Defender integration script. No arbitrary commands are accepted."""
    if os.name != "nt":
        raise HTTPException(status_code=501, detail="Microsoft Defender integration is available only on Windows.")
    script = BASE_DIR / "scripts" / "Defender-Integration.ps1"
    if not script.is_file():
        raise HTTPException(status_code=500, detail="Defender integration script is missing.")
    command = ["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "RemoteSigned",
               "-File", str(script), "-Action", action]
    if scan_type:
        command.extend(["-ScanType", scan_type])
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=45, check=False, cwd=str(BASE_DIR))
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Defender request timed out.")
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Could not start PowerShell: {exc}")
    if result.returncode != 0:
        raise HTTPException(status_code=503, detail=(result.stderr or result.stdout or "Defender command failed.")[-2500:])
    try:
        # Script writes one compact JSON object to stdout.
        return json.loads(result.stdout.strip().splitlines()[-1])
    except Exception:
        raise HTTPException(status_code=500, detail="Defender script returned invalid JSON.")


@app.get("/api/defender/status")
def defender_status():
    """Return Microsoft Defender status. Does not change protection settings."""
    return _run_defender_action("status")


@app.get("/api/defender/threats")
def defender_threats():
    """Return locally recorded Defender detections, if the Windows cmdlets are available."""
    return _run_defender_action("threats")


@app.post("/api/defender/scan")
def defender_scan(scan_type: str = Query(default="QuickScan", pattern="^(QuickScan|FullScan)$")):
    """Request a Defender quick or full scan; execution and remediation remain Defender-managed."""
    return _run_defender_action("scan", scan_type)




def _bodmas_db() -> sqlite3.Connection:
    conn = sqlite3.connect(BODMAS_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_bodmas_index() -> dict[str, Any]:
    """Build a local indexed hash catalogue from the supplied BODMAS metadata CSV."""
    if not BODMAS_CSV_PATH.is_file():
        return {"available": False, "reason": "bodmas_metadata.csv not found", "records": 0}
    source_mtime = BODMAS_CSV_PATH.stat().st_mtime_ns
    source_size = BODMAS_CSV_PATH.stat().st_size
    with _bodmas_db() as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS metadata (sha TEXT PRIMARY KEY, timestamp TEXT, family TEXT, classification TEXT NOT NULL)")
        conn.execute("CREATE TABLE IF NOT EXISTS index_info (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        row = conn.execute("SELECT value FROM index_info WHERE key='source_signature'").fetchone()
        signature = f"{source_mtime}:{source_size}"
        if row and row["value"] == signature:
            count = conn.execute("SELECT COUNT(*) AS n FROM metadata").fetchone()["n"]
            return {"available": True, "records": count, "indexed": True, "source": BODMAS_CSV_PATH.name}
        conn.execute("DELETE FROM metadata")
        conn.execute("DELETE FROM index_info")
        conn.commit()
        count = 0
        with BODMAS_CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            required = {"sha", "timestamp", "family"}
            if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
                raise HTTPException(status_code=422, detail="BODMAS metadata must have sha, timestamp, and family columns.")
            batch = []
            for item in reader:
                sha = str(item.get("sha") or "").strip().lower()
                if not re.fullmatch(r"[a-f0-9]{64}", sha):
                    continue
                family = str(item.get("family") or "").strip()
                classification = "malware" if family else "benign"
                batch.append((sha, str(item.get("timestamp") or ""), family, classification))
                if len(batch) >= 5000:
                    conn.executemany("INSERT OR REPLACE INTO metadata(sha,timestamp,family,classification) VALUES(?,?,?,?)", batch)
                    count += len(batch); batch = []
            if batch:
                conn.executemany("INSERT OR REPLACE INTO metadata(sha,timestamp,family,classification) VALUES(?,?,?,?)", batch)
                count += len(batch)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_metadata_classification ON metadata(classification)")
        conn.execute("INSERT OR REPLACE INTO index_info(key,value) VALUES('source_signature',?)", (signature,))
        conn.commit()
    return {"available": True, "records": count, "indexed": True, "source": BODMAS_CSV_PATH.name}


def _bodmas_lookup(sha: str) -> dict[str, Any] | None:
    with _bodmas_db() as conn:
        row = conn.execute("SELECT sha,timestamp,family,classification FROM metadata WHERE sha=?", (sha.lower(),)).fetchone()
    return dict(row) if row else None


class MalwareScanRequest(BaseModel):
    directory: str = Field(min_length=1, max_length=1000)
    quarantine_matches: bool = False
    max_files: int = Field(default=5000, ge=1, le=20000)


def _hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


@app.get("/api/malware/database/status")
def malware_database_status():
    """Index status for the local BODMAS hash/family metadata; not an antivirus signature database."""
    try:
        return _ensure_bodmas_index() | {
            "dataset": "BODMAS metadata",
            "classification_note": "Non-empty family is labelled malware; empty family is labelled benign in the source metadata.",
            "limitations": ["Historical samples (2019-2020)", "Hash matches only; unknown hashes are inconclusive", "Metadata contains no binaries or model feature vectors"],
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not index BODMAS metadata: {type(exc).__name__}: {exc}")


@app.get("/api/malware/hash/{sha256}")
def malware_hash_lookup(sha256: str):
    if not re.fullmatch(r"[a-fA-F0-9]{64}", sha256):
        raise HTTPException(status_code=422, detail="Provide a 64-character SHA-256 hash.")
    status = _ensure_bodmas_index()
    if not status.get("available"):
        raise HTTPException(status_code=503, detail="BODMAS metadata is unavailable.")
    match = _bodmas_lookup(sha256)
    return {"sha256": sha256.lower(), "match": bool(match), "record": match,
            "source": "local BODMAS metadata", "live_reputation": False,
            "meaning": "A malware match is historical dataset evidence, not proof that the current file is active malware. No match is inconclusive."}


@app.post("/api/malware/scan")
def scan_directory_against_bodmas(payload: MalwareScanRequest):
    """Hash files and compare with historical BODMAS metadata; optionally move confirmed dataset matches to quarantine."""
    if os.name != "nt":
        # Read-only hashing is portable; quarantine is deliberately Windows-only in this initial agent.
        if payload.quarantine_matches:
            raise HTTPException(status_code=501, detail="Quarantine action is currently supported only on Windows.")
    status = _ensure_bodmas_index()
    if not status.get("available"):
        raise HTTPException(status_code=503, detail="BODMAS metadata is unavailable. Place data/bodmas_metadata.csv in the project.")
    target = Path(payload.directory).expanduser().resolve()
    if not target.exists() or not target.is_dir():
        raise HTTPException(status_code=422, detail="Directory does not exist or is not a directory.")
    # Prevent recursive scanning of the application data/quarantine itself.
    if target == DATA_DIR.resolve() or DATA_DIR.resolve() in target.parents:
        raise HTTPException(status_code=422, detail="Do not scan CyberAmour's own data/quarantine directory.")
    results, checked, skipped, malicious = [], 0, 0, 0
    for path in target.rglob("*"):
        if checked + skipped >= payload.max_files:
            break
        try:
            if path.is_symlink() or not path.is_file():
                continue
            if QUARANTINE_DIR.resolve() in path.resolve().parents:
                continue
            checked += 1
            sha = _hash_file(path)
            record = _bodmas_lookup(sha)
            if record and record["classification"] == "malware":
                malicious += 1
                item = {"path": str(path), "sha256": sha, "classification": "dataset_malware_match",
                        "family": record.get("family") or "unknown", "sample_timestamp": record.get("timestamp"),
                        "action": "detected_only"}
                if payload.quarantine_matches:
                    # Move, do not delete; retain a hash-based filename to avoid collisions.
                    dest = QUARANTINE_DIR / f"{sha}_{path.name}"
                    if dest.exists():
                        dest = QUARANTINE_DIR / f"{sha}_{uuid.uuid4().hex}_{path.name}"
                    shutil.move(str(path), str(dest))
                    item.update({"action": "quarantined", "quarantine_path": str(dest)})
                    log_event("local-user", "bodmas_hash_match_quarantined", sha, {"original_path": str(path), "quarantine_path": str(dest), "family": record.get("family")})
                results.append(item)
        except (PermissionError, OSError):
            skipped += 1
    return {"scan_id": str(uuid.uuid4()), "directory": str(target), "status": "COMPLETE" if skipped == 0 else "PARTIAL",
            "files_checked": checked, "files_skipped": skipped, "malware_hash_matches": malicious,
            "quarantine_requested": payload.quarantine_matches, "quarantined": sum(1 for x in results if x["action"] == "quarantined"),
            "results": results[:500], "database_records": status["records"],
            "warning": "BODMAS is a historical research dataset. Only exact SHA-256 matches are identified; this is not general malware detection, does not block unknown malware, and does not replace Microsoft Defender."}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "cyberamour-soc-integration",
        "attack_dataset_loaded": bool(attack_db),
        "attack_dataset_path": str(ATTACK_STIX_PATH),
        "attack_dataset_error": attack_load_error,
        "kev_records_available": len(load_kev()),
        "response_enforcement": "disabled-until-authorised-connector-is-configured",
        "timestamp": utc_now(),
    }


@app.get("/api/attack/techniques")
def techniques(q: str = Query(default="", max_length=200), limit: int = Query(default=100, ge=1, le=500)):
    if not attack_db:
        raise HTTPException(status_code=503, detail="ATT&CK STIX dataset not loaded. Download enterprise-attack.json into backend/attack-intel-service/data/ or set ATTACK_STIX_PATH.")
    objects = attack_db.get_techniques(include_subtechniques=True, remove_revoked_deprecated=True)
    ql = q.casefold().strip()
    rows = []
    for obj in objects:
        row = technique_to_dict(obj)
        if not row["attack_id"] or not row["name"]:
            continue
        if ql and ql not in row["name"].casefold() and ql not in row["attack_id"].casefold() and ql not in (row["description"] or "").casefold():
            continue
        rows.append(row)
    rows.sort(key=lambda x: (x["attack_id"] or ""))
    return {"count": len(rows[:limit]), "total_matches": len(rows), "techniques": rows[:limit], "dataset": "local ATT&CK STIX snapshot"}


@app.get("/api/attack/techniques/{tech_id}")
def technique_detail(tech_id: str):
    if not attack_db:
        raise HTTPException(status_code=503, detail="ATT&CK STIX dataset not loaded.")
    try:
        obj = attack_db.get_object_by_attack_id(tech_id.upper(), "attack-pattern")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not obj:
        raise HTTPException(status_code=404, detail="Technique not found in the local dataset.")
    return technique_to_dict(obj)


@app.get("/api/kev")
def kev_lookup(cve: str = Query(default="", max_length=30)):
    rows = load_kev()
    if cve:
        rows = [r for r in rows if str(r.get("cveID") or r.get("cve_id") or r.get("CVE") or "").upper() == cve.upper()]
    return {"count": len(rows), "records": rows[:500], "source": "local snapshot", "live_feed": False}


@app.post("/api/attack/navigator-layer")
def make_navigator_layer(payload: NavigatorLayerIn):
    seen = set()
    layer_techniques = []
    for item in payload.techniques:
        tid = item.technique_id.strip().upper()
        if not tid or tid in seen:
            continue
        seen.add(tid)
        layer_techniques.append({"techniqueID": tid, "score": item.score, **({"comment": item.comment} if item.comment else {})})
    return {
        "name": payload.name,
        "description": payload.description,
        "domain": "enterprise-attack",
        "version": "4.5",
        "sorting": 3,
        "techniques": layer_techniques,
        "metadata": [{"name": "generated_by", "value": "CyberAmour SOC Integration API"}, {"name": "generated_at_utc", "value": utc_now()}],
    }


@app.post("/api/alerts")
def ingest_alert(payload: AlertIn):
    alert_id = str(uuid.uuid4())
    techs = find_techniques(payload.technique_ids)
    kev_matches = find_kev(payload.cve_ids)
    recommendations = propose_actions(payload, kev_matches)
    enrichment = {
        "techniques": techs,
        "kev_matches": kev_matches,
        "recommendations": recommendations,
        "data_quality": {
            "attack_enrichment_available": bool(attack_db),
            "kev_snapshot_available": bool(load_kev()),
            "note": "A missing match is not proof that a system is safe. Validate CVE product/version applicability and event evidence.",
        },
    }
    with db() as conn:
        conn.execute(
            """INSERT INTO alerts(id, created_at, status, severity, title, source, host, source_ip, payload_json, enrichment_json)
               VALUES(?,?,?,?,?,?,?,?,?,?)""",
            (alert_id, utc_now(), "open", payload.severity.lower(), payload.title, payload.source,
             payload.host, payload.source_ip, payload.model_dump_json(), json.dumps(enrichment, ensure_ascii=False)),
        )
        for rec in recommendations:
            conn.execute(
                """INSERT INTO response_proposals(id, alert_id, created_at, status, action, target, rationale)
                   VALUES(?,?,?,?,?,?,?)""",
                (str(uuid.uuid4()), alert_id, utc_now(), "proposed", rec["action"], rec.get("target"), rec["rationale"]),
            )
    log_event("system", "alert_ingested", alert_id, {"severity": payload.severity, "source": payload.source})
    return {"id": alert_id, "status": "open", "created_at": utc_now(), "alert": payload.model_dump(), "enrichment": enrichment}


@app.get("/api/alerts")
def list_alerts(limit: int = Query(default=100, ge=1, le=500), status: str | None = None):
    with db() as conn:
        if status:
            rows = conn.execute("SELECT * FROM alerts WHERE status=? ORDER BY created_at DESC LIMIT ?", (status, limit)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return {"count": len(rows), "alerts": [{
        "id": r["id"], "created_at": r["created_at"], "status": r["status"], "severity": r["severity"],
        "title": r["title"], "source": r["source"], "host": r["host"], "source_ip": r["source_ip"],
        "payload": json.loads(r["payload_json"]), "enrichment": json.loads(r["enrichment_json"])
    } for r in rows]}


@app.post("/api/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: str, actor: str = "soc-analyst"):
    with db() as conn:
        cur = conn.execute("UPDATE alerts SET status='acknowledged' WHERE id=?", (alert_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found.")
    log_event(actor, "alert_acknowledged", alert_id, {})
    return {"id": alert_id, "status": "acknowledged"}


@app.get("/api/response/proposals")
def list_proposals(status: str | None = None, limit: int = Query(default=100, ge=1, le=500)):
    with db() as conn:
        if status:
            rows = conn.execute("SELECT * FROM response_proposals WHERE status=? ORDER BY created_at DESC LIMIT ?", (status, limit)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM response_proposals ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return {"count": len(rows), "enforcement_enabled": False, "proposals": [dict(r) for r in rows]}


@app.post("/api/response/proposals/{proposal_id}/approve")
def approve_proposal(proposal_id: str, actor: str = "soc-analyst"):
    # Approval records analyst intent only. No host isolation, firewall change, or remediation is executed here.
    with db() as conn:
        row = conn.execute("SELECT * FROM response_proposals WHERE id=?", (proposal_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Proposal not found.")
        if row["status"] not in {"proposed", "approved"}:
            raise HTTPException(status_code=409, detail=f"Proposal is in state {row['status']}.")
        conn.execute(
            "UPDATE response_proposals SET status='approved_pending_connector', approved_by=?, approved_at=? WHERE id=?",
            (actor, utc_now(), proposal_id),
        )
    log_event(actor, "response_proposal_approved_pending_connector", proposal_id, {"action": row["action"], "target": row["target"]})
    return {
        "id": proposal_id,
        "status": "approved_pending_connector",
        "executed": False,
        "message": "Approval recorded only. No containment or blocking was executed because no authorised EDR/firewall connector is configured.",
    }
