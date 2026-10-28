"""Deterministic, evidence-preserving SOC detections for CyberAmour.

This module analyses supplied log lines only. It does not generate attack traffic,
execute commands, block IPs, or claim to monitor a host continuously.
"""
from __future__ import annotations

import ipaddress
import re
from collections import Counter, defaultdict
from typing import Iterable

IPV4_RE = re.compile(r"(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])")
PORT_RE = re.compile(r"\b(?:dport|dst_port|port)\s*[=:]\s*(\d{1,5})\b", re.IGNORECASE)
FAILED_RE = re.compile(r"(failed password|authentication failure|login failed|invalid user)", re.IGNORECASE)
SUCCESS_RE = re.compile(r"(accepted password|authentication success|login successful)", re.IGNORECASE)
PORT_SCAN_RE = re.compile(r"(connection attempt|syn scan|port scan|blocked connection|firewall deny)", re.IGNORECASE)

def extract_public_ip(line: str) -> str | None:
    for match in IPV4_RE.findall(line):
        try:
            addr = ipaddress.ip_address(match)
        except ValueError:
            continue
        if addr.is_global:
            return str(addr)
    return None

def parse_log_line(line: str) -> dict:
    ip = extract_public_ip(line)
    if FAILED_RE.search(line):
        event = "FAILED_LOGIN"
    elif SUCCESS_RE.search(line):
        event = "SUCCESS_LOGIN"
    elif PORT_SCAN_RE.search(line):
        event = "NETWORK_CONNECTION"
    else:
        event = "OTHER"
    port_match = PORT_RE.search(line)
    port = int(port_match.group(1)) if port_match and int(port_match.group(1)) <= 65535 else None
    return {"ip": ip, "event": event, "port": port, "evidence": line[:1000]}

def analyse_log_lines(
    lines: Iterable[str],
    failed_login_threshold: int = 6,
    port_scan_threshold: int = 10,
    suspicious_ips: set[str] | None = None,
) -> dict:
    suspicious_ips = suspicious_ips or set()
    failed_counts: Counter[str] = Counter()
    observed_ports: dict[str, set[int]] = defaultdict(set)
    evidence: dict[str, list[str]] = defaultdict(list)
    parsed_count = 0
    for raw in lines:
        line = str(raw)
        parsed_count += 1
        row = parse_log_line(line)
        ip = row["ip"]
        if not ip:
            continue
        if row["event"] == "FAILED_LOGIN":
            failed_counts[ip] += 1
            if len(evidence[f"brute:{ip}"]) < 5:
                evidence[f"brute:{ip}"].append(row["evidence"])
        if row["event"] == "NETWORK_CONNECTION" and row["port"] is not None:
            observed_ports[ip].add(row["port"])
            if len(evidence[f"ports:{ip}"]) < 5:
                evidence[f"ports:{ip}"].append(row["evidence"])
    findings = []
    for ip, count in failed_counts.items():
        if count >= failed_login_threshold:
            findings.append({
                "rule_id": "CA-AUTH-001", "title": "Repeated failed authentication",
                "severity": "high" if count >= failed_login_threshold * 2 else "medium",
                "source_ip": ip, "event_count": count, "technique_ids": ["T1110"],
                "confidence": min(0.95, 0.55 + (count - failed_login_threshold) * 0.05),
                "evidence": evidence[f"brute:{ip}"],
                "rationale": f"{count} failed-authentication events from this IP in the submitted log batch; threshold={failed_login_threshold}.",
            })
    for ip, ports in observed_ports.items():
        if len(ports) >= port_scan_threshold:
            findings.append({
                "rule_id": "CA-NET-001", "title": "Potential port-scan activity",
                "severity": "medium", "source_ip": ip, "event_count": len(ports),
                "technique_ids": ["T1046"], "confidence": 0.65,
                "evidence": evidence[f"ports:{ip}"],
                "rationale": f"Observed {len(ports)} distinct destination ports in matching connection/firewall log lines; threshold={port_scan_threshold}.",
            })
    for ip in sorted(suspicious_ips):
        if ip in failed_counts or ip in observed_ports:
            findings.append({
                "rule_id": "CA-IOC-001", "title": "Observed IP matches local indicator list",
                "severity": "high", "source_ip": ip, "event_count": failed_counts[ip] + len(observed_ports[ip]),
                "technique_ids": [], "confidence": 0.75,
                "evidence": (evidence.get(f"brute:{ip}") or evidence.get(f"ports:{ip}") or [])[:5],
                "rationale": "The source IP matched the configured local suspicious-IP list. Validate list provenance and indicator freshness.",
            })
    return {
        "status": "completed",
        "mode": "batch_log_analysis",
        "input_lines": parsed_count,
        "findings_count": len(findings),
        "findings": findings,
        "limitations": [
            "Analysis covers only the log lines supplied in this request; it is not continuous monitoring.",
            "IP indicators and heuristic thresholds can produce false positives and require analyst validation.",
            "No blocking, isolation, quarantine, or remediation was executed.",
        ],
    }
