import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, CircleHelp, RefreshCw, Search, Server, ShieldAlert, WifiOff } from 'lucide-react';

type Health = {
  status?: string;
  service?: string;
  attack_dataset_loaded?: boolean;
  attack_dataset_error?: string | null;
  kev_records_available?: number;
  response_enforcement?: string;
  timestamp?: string;
};
type Technique = {
  attack_id?: string;
  name?: string;
  description?: string;
  tactics?: string[];
  platforms?: string[];
  url?: string;
};
type KevRecord = {
  cve_id?: string;
  name?: string;
  vendor?: string;
  product?: string;
  date_added?: string;
  due_date?: string;
  required_action?: string;
  ransomware_use?: string;
};
type Alert = {
  id: string;
  title: string;
  severity: string;
  status: string;
  created_at?: string;
  host?: string | null;
  source?: string | null;
};

const DEFAULT_API = import.meta.env.VITE_SOC_API_BASE_URL || 'http://127.0.0.1:8091';
const inputClass = 'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50';
const panelClass = 'glass-card rounded-2xl border border-border p-4';

export default function SocApiDashboard() {
  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [apiDraft, setApiDraft] = useState(DEFAULT_API);
  const [health, setHealth] = useState<Health | null>(null);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [kev, setKev] = useState<KevRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [techQuery, setTechQuery] = useState('');
  const [cveQuery, setCveQuery] = useState('CVE-2021-44228');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('medium');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const request = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${apiBase.replace(/\/+$/, '')}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
    const body = await response.text();
    let data: unknown = {};
    try { data = body ? JSON.parse(body) : {}; } catch { data = body; }
    if (!response.ok) {
      const detail = typeof data === 'object' && data && 'detail' in data ? String((data as {detail: unknown}).detail) : response.statusText;
      throw new Error(`HTTP ${response.status}: ${detail}`);
    }
    return data as T;
  }, [apiBase]);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const [h, a, t] = await Promise.all([
        request<Health>('/api/health'),
        request<Alert[]>('/api/alerts'),
        request<{results?: Technique[]; techniques?: Technique[]}>('/api/attack/techniques?limit=8'),
      ]);
      setHealth(h);
      setAlerts(Array.isArray(a) ? a : (a as unknown as {alerts?: Alert[]}).alerts || []);
      const rows = Array.isArray(t) ? t : (t.results || t.techniques || []);
      setTechniques(rows.slice(0, 8));
      setNotice('SOC API data refreshed.');
    } catch (e) {
      setHealth(null);
      setError(`${e instanceof Error ? e.message : String(e)}. Check that the local API is running and its CORS allow-list includes this frontend origin.`);
    } finally {
      setBusy(false);
    }
  }, [request]);

  useEffect(() => { void refresh(); }, [refresh]);

  const searchTechniques = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await request<{results?: Technique[]; techniques?: Technique[]; items?: Technique[]}>(`/api/attack/techniques?q=${encodeURIComponent(techQuery.trim())}`);
      const rows = Array.isArray(data) ? data : data.results || data.techniques || data.items || [];
      setTechniques(rows);
      setNotice(`${rows.length} technique result(s).`);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const searchKev = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await request<{results?: KevRecord[]; vulnerabilities?: KevRecord[]; records?: KevRecord[]}>(`/api/kev?cve=${encodeURIComponent(cveQuery.trim())}`);
      const rows = Array.isArray(data) ? data : data.results || data.vulnerabilities || data.records || [];
      setKev(rows.map((row: any) => ({
        cve_id: row.cve_id || row.cveID || row.CVE || '',
        name: row.name || row.vulnerabilityName || row.vulnerability_name || '',
        vendor: row.vendor || row.vendorProject || row.vendor_project || '',
        product: row.product || '',
        date_added: row.date_added || row.dateAdded || '',
        due_date: row.due_date || row.dueDate || '',
        required_action: row.required_action || row.requiredAction || '',
        ransomware_use: row.ransomware_use || row.knownRansomwareCampaignUse || '',
      })));
      setNotice(`${rows.length} KEV result(s).`);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const createAlert = async () => {
    if (!alertTitle.trim()) { setError('Enter an alert title first.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      await request('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ title: alertTitle.trim(), severity: alertSeverity, source: 'cyberamour-ui', details: { created_from: 'SOC dashboard' } }),
      });
      setAlertTitle('');
      setNotice('Alert submitted to the local SOC API.');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const severityClass = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === 'critical') return 'border-red-500/40 bg-red-500/10 text-red-300';
    if (s === 'high') return 'border-orange-500/40 bg-orange-500/10 text-orange-300';
    if (s === 'low') return 'border-sky-500/40 bg-sky-500/10 text-sky-300';
    return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  };
  const statusText = useMemo(() => health?.status === 'ok' ? 'Connected' : 'Not connected', [health]);

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-[.2em] text-primary">Security operations</div>
        <h1 className="mt-2 text-3xl font-black">SOC API Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-text-dim">Connect CyberAmour to the local threat-intelligence and incident workflow API. This dashboard does not itself collect endpoint telemetry or enforce blocking.</p>
      </div>
      <button className={buttonClass} onClick={() => void refresh()} disabled={busy}><RefreshCw size={16} className={busy ? 'animate-spin' : ''}/> Refresh</button>
    </header>

    <section className={panelClass}>
      <label className="mb-2 block text-sm font-semibold" htmlFor="soc-api-base">SOC API base URL</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="soc-api-base" className={inputClass} value={apiDraft} onChange={e => setApiDraft(e.target.value)} placeholder="http://127.0.0.1:8091"/>
        <button className={buttonClass} onClick={() => { setApiBase(apiDraft.trim() || DEFAULT_API); setNotice('API address updated for this view.'); }}><Server size={16}/> Connect</button>
      </div>
      <p className="mt-2 text-xs text-text-dim">For a local browser session, use <code>http://127.0.0.1:8091</code>. Hosted users need a reachable, secured API URL; localhost refers to each user's own computer.</p>
    </section>

    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"><WifiOff size={18} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
    {notice && !error && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className={panelClass}><div className="flex items-center justify-between text-sm text-text-dim">API status <Activity size={17}/></div><div className="mt-3 text-2xl font-black">{statusText}</div><p className="mt-1 text-xs text-text-dim">{health?.service || 'Awaiting health check'}</p></div>
      <div className={panelClass}><div className="flex items-center justify-between text-sm text-text-dim">ATT&CK dataset <ShieldAlert size={17}/></div><div className="mt-3 text-2xl font-black">{health?.attack_dataset_loaded ? 'Loaded' : 'Unknown'}</div><p className="mt-1 text-xs text-text-dim">{health?.attack_dataset_error || 'Dataset error not reported'}</p></div>
      <div className={panelClass}><div className="flex items-center justify-between text-sm text-text-dim">CISA KEV records <AlertTriangle size={17}/></div><div className="mt-3 text-2xl font-black">{health?.kev_records_available ?? '—'}</div><p className="mt-1 text-xs text-text-dim">Count from current local snapshot</p></div>
      <div className={panelClass}><div className="flex items-center justify-between text-sm text-text-dim">Response enforcement <CircleHelp size={17}/></div><div className="mt-3 text-base font-black">{health?.response_enforcement || 'Not verified'}</div><p className="mt-1 text-xs text-text-dim">No blocking is enabled by this UI</p></div>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <div className={panelClass}>
        <h2 className="mb-3 text-lg font-bold">MITRE ATT&CK techniques</h2>
        <div className="flex gap-2"><input className={inputClass} value={techQuery} onChange={e => setTechQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void searchTechniques(); }} placeholder="Search technique ID or name"/><button className={buttonClass} onClick={() => void searchTechniques()} disabled={busy}><Search size={16}/> Search</button></div>
        <div className="mt-4 space-y-2">
          {techniques.length === 0 && <p className="text-sm text-text-dim">No technique results yet. Search to load records from the API.</p>}
          {techniques.map((t, i) => <article key={t.attack_id || `${t.name}-${i}`} className="rounded-xl border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2"><strong>{t.attack_id || 'ATT&CK technique'} · {t.name || 'Unnamed technique'}</strong>{t.url && <a className="text-xs text-primary underline" href={t.url} target="_blank" rel="noreferrer">MITRE reference</a>}</div>
            <p className="mt-1 line-clamp-3 text-sm text-text-dim">{t.description || 'No description supplied.'}</p>
            {(t.tactics?.length || t.platforms?.length) ? <p className="mt-2 text-xs text-text-dim">{[t.tactics?.join(', '), t.platforms?.join(', ')].filter(Boolean).join(' · ')}</p> : null}
          </article>)}
        </div>
      </div>

      <div className={panelClass}>
        <h2 className="mb-3 text-lg font-bold">Known Exploited Vulnerabilities</h2>
        <div className="flex gap-2"><input className={inputClass} value={cveQuery} onChange={e => setCveQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void searchKev(); }} placeholder="CVE-YYYY-NNNNN"/><button className={buttonClass} onClick={() => void searchKev()} disabled={busy}><Search size={16}/> Lookup</button></div>
        <div className="mt-4 space-y-2">
          {kev.length === 0 && <p className="text-sm text-text-dim">Enter a CVE ID to check the local KEV catalog.</p>}
          {kev.map((v, i) => <article key={v.cve_id || i} className="rounded-xl border border-border p-3">
            <strong>{v.cve_id || 'CVE record'} · {v.name || 'Known exploited vulnerability'}</strong>
            <p className="mt-1 text-sm text-text-dim">{[v.vendor, v.product].filter(Boolean).join(' · ') || 'Vendor/product not provided by the data source'}</p>
            {v.required_action && <p className="mt-2 text-sm">{v.required_action}</p>}
            <p className="mt-2 text-xs text-text-dim">Added: {v.date_added || '—'} · Due: {v.due_date || '—'} · Ransomware use: {v.ransomware_use || 'Not stated'}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className={panelClass}>
      <h2 className="mb-3 text-lg font-bold">Create a test or analyst alert</h2>
      <p className="mb-3 text-sm text-text-dim">Use this to verify the alert workflow. This is a manually submitted alert, not a detected attack.</p>
      <div className="grid gap-2 md:grid-cols-[1fr_160px_auto]">
        <input className={inputClass} value={alertTitle} onChange={e => setAlertTitle(e.target.value)} placeholder="Alert title, e.g. Analyst validation test"/>
        <select className={inputClass} value={alertSeverity} onChange={e => setAlertSeverity(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
        <button className={buttonClass} onClick={() => void createAlert()} disabled={busy}><CheckCircle2 size={16}/> Submit alert</button>
      </div>
    </section>

    <section className={panelClass}>
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Recent SOC alerts</h2><span className="text-xs text-text-dim">{alerts.length} loaded</span></div>
      {alerts.length === 0 ? <p className="text-sm text-text-dim">No alerts returned by the API yet.</p> : <div className="space-y-2">{alerts.map(a => <article key={a.id} className="flex flex-col justify-between gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center"><div><strong>{a.title}</strong><p className="mt-1 text-xs text-text-dim">{a.created_at ? new Date(a.created_at).toLocaleString() : 'Time unavailable'}{a.host ? ` · ${a.host}` : ''}{a.source ? ` · ${a.source}` : ''}</p></div><div className="flex items-center gap-2"><span className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${severityClass(a.severity || 'medium')}`}>{a.severity || 'medium'}</span><span className="rounded-full border border-border px-2 py-1 text-xs">{a.status || 'open'}</span></div></article>)}</div>}
    </section>
    <p className="text-xs text-text-dim">Security note: do not expose this API publicly without authentication, TLS, restrictive CORS, and network controls. Response proposals are not proof that an action was executed.</p>
  </div>;
}
