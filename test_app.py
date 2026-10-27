from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_health_returns_safe_status():
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["response_enforcement"] == "disabled-until-authorised-connector-is-configured"


def test_navigator_layer_deduplicates_ids():
    response = client.post("/api/attack/navigator-layer", json={
        "name": "test",
        "techniques": [
            {"technique_id": "T1059", "score": 80},
            {"technique_id": "t1059", "score": 30},
            {"technique_id": "T1059.001", "score": 70}
        ]
    })
    assert response.status_code == 200
    body = response.json()
    assert body["domain"] == "enterprise-attack"
    assert [x["techniqueID"] for x in body["techniques"]] == ["T1059", "T1059.001"]


def test_alert_ingestion_creates_auditable_alert():
    response = client.post("/api/alerts", json={
        "title": "Test alert",
        "severity": "high",
        "host": "test-host",
        "source_ip": "203.0.113.7",
        "cve_ids": [],
        "technique_ids": ["T1059.001"]
    })
    assert response.status_code == 200
    body = response.json()
    assert body["id"]
    assert body["status"] == "open"
    proposals = client.get("/api/response/proposals").json()
    assert proposals["enforcement_enabled"] is False
