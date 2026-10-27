export type AttackTechnique = {
  attack_id: string;
  stix_id?: string;
  name: string;
  description?: string;
  platforms: string[];
  tactics: string[];
  is_subtechnique: boolean;
  url?: string | null;
};

export type SocAlert = {
  title: string;
  severity: "low" | "medium" | "high" | "critical" | string;
  source?: string;
  host?: string;
  source_ip?: string;
  cve_ids?: string[];
  technique_ids?: string[];
  confidence?: number;
  details?: Record<string, unknown>;
};

const API_BASE = (import.meta as any).env?.VITE_SOC_API_URL || "http://localhost:8091";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`CyberAmour SOC API ${response.status}: ${message}`);
  }
  return response.json() as Promise<T>;
}

export const socIntegrationApi = {
  health: () => request<Record<string, unknown>>("/api/health"),
  searchTechniques: (q = "") =>
    request<{ count: number; total_matches: number; techniques: AttackTechnique[] }>(
      `/api/attack/techniques?q=${encodeURIComponent(q)}`
    ),
  ingestAlert: (alert: SocAlert) =>
    request<Record<string, unknown>>("/api/alerts", { method: "POST", body: JSON.stringify(alert) }),
  listAlerts: () => request<{ count: number; alerts: any[] }>("/api/alerts"),
  listResponseProposals: () => request<{ count: number; enforcement_enabled: boolean; proposals: any[] }>("/api/response/proposals"),
  acknowledgeAlert: (id: string) =>
    request<Record<string, unknown>>(`/api/alerts/${encodeURIComponent(id)}/ack`, { method: "POST" }),
};
