import React, { useEffect, useMemo, useState } from "react";
import { AttackTechnique, socIntegrationApi } from "../services/socIntegrationApi";

type Props = { apiAvailable?: boolean };

export default function AttackCoveragePanel(_props: Props) {
  const [query, setQuery] = useState("");
  const [techniques, setTechniques] = useState<AttackTechnique[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState("Checking SOC API…");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    socIntegrationApi.health()
      .then((health: any) => setApiStatus(health.attack_dataset_loaded ? "API online · ATT&CK data loaded" : "API online · ATT&CK data not loaded"))
      .catch(() => setApiStatus("SOC API unavailable · start the backend service"));
  }, []);

  async function search(event?: React.FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await socIntegrationApi.searchTechniques(query);
      setTechniques(result.techniques || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to search ATT&CK techniques.");
    } finally {
      setLoading(false);
    }
  }

  const selectedTechniques = useMemo(
    () => techniques.filter((t) => selected[t.attack_id]),
    [techniques, selected]
  );

  function exportNavigatorLayer() {
    if (!selectedTechniques.length) {
      setNotice("Select one or more techniques first.");
      return;
    }
    const layer = {
      name: "CyberAmour Detection Coverage",
      description: "Exported from CyberAmour. Scores are analyst-entered coverage scores, not proof of compromise.",
      domain: "enterprise-attack",
      version: "4.5",
      sorting: 3,
      techniques: selectedTechniques.map((t) => ({
        techniqueID: t.attack_id,
        score: 50,
        comment: `Selected in CyberAmour; validate detections and telemetry for ${t.name}.`,
      })),
      metadata: [{ name: "generated_by", value: "CyberAmour" }, { name: "generated_at_utc", value: new Date().toISOString() }],
    };
    const blob = new Blob([JSON.stringify(layer, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyberamour-attack-coverage-layer.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${selectedTechniques.length} techniques as a Navigator-compatible layer.`);
  }

  return (
    <section style={{ padding: 20, color: "var(--text-primary, #e8edf5)" }}>
      <header style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>ATT&CK Coverage Workbench</h2>
          <p style={{ marginTop: 0, opacity: 0.75 }}>Search local ATT&CK data and export selected techniques for coverage planning.</p>
        </div>
        <span role="status" style={{ fontSize: 12, opacity: 0.8 }}>{apiStatus}</span>
      </header>
      <form onSubmit={search} style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search technique name or ID, e.g. T1059"
          aria-label="Search ATT&CK techniques"
          style={{ flex: 1, minWidth: 180, padding: 10, borderRadius: 8 }}
        />
        <button type="submit" disabled={loading} style={{ padding: "10px 14px" }}>{loading ? "Searching…" : "Search"}</button>
        <button type="button" onClick={exportNavigatorLayer} style={{ padding: "10px 14px" }}>Export layer ({selectedTechniques.length})</button>
      </form>
      {error && <p role="alert" style={{ color: "#ff8b8b", whiteSpace: "pre-wrap" }}>{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>
            <th style={{ textAlign: "left", padding: 8 }}>Select</th>
            <th style={{ textAlign: "left", padding: 8 }}>ATT&CK ID</th>
            <th style={{ textAlign: "left", padding: 8 }}>Technique</th>
            <th style={{ textAlign: "left", padding: 8 }}>Tactics</th>
            <th style={{ textAlign: "left", padding: 8 }}>Platforms</th>
          </tr></thead>
          <tbody>
            {techniques.map((t) => (
              <tr key={t.attack_id} style={{ borderTop: "1px solid var(--border, #334155)" }}>
                <td style={{ padding: 8 }}><input type="checkbox" checked={!!selected[t.attack_id]} onChange={(e) => setSelected((s) => ({ ...s, [t.attack_id]: e.target.checked }))} aria-label={`Select ${t.attack_id}`} /></td>
                <td style={{ padding: 8, whiteSpace: "nowrap" }}>{t.attack_id}</td>
                <td style={{ padding: 8 }}>
                  <strong>{t.name}</strong>
                  {t.description && <details><summary>Details</summary><p>{t.description}</p></details>}
                </td>
                <td style={{ padding: 8 }}>{(t.tactics || []).join(", ") || "—"}</td>
                <td style={{ padding: 8 }}>{(t.platforms || []).join(", ") || "—"}</td>
              </tr>
            ))}
            {!techniques.length && !loading && <tr><td colSpan={5} style={{ padding: 16, opacity: 0.7 }}>Search for a technique after the SOC API and local ATT&CK dataset are available.</td></tr>}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 16 }}>
        This module provides ATT&CK lookups and Navigator-layer export. It does not independently monitor endpoints or execute containment actions.
      </p>
    </section>
  );
}
