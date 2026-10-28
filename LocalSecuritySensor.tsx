import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, LockKeyhole, RefreshCw, ShieldAlert, ShieldCheck, Wifi } from 'lucide-react';

const SENSOR = 'http://127.0.0.1:8765';
type RecordValue = Record<string, any>;
function storedToken() { try { return sessionStorage.getItem('cyberamour-local-sensor-token') || ''; } catch { return ''; } }
async function responseError(response: Response) { try { const body = await response.json(); return body.detail || body.message || `Request failed (${response.status})`; } catch { return `Request failed (${response.status})`; } }
export default function LocalSecuritySensor({ mode = 'all' }: { mode?: 'all' | 'antivirus' | 'network' }) {
  const [token, setToken] = useState(storedToken);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<RecordValue | null>(null);
  const [scan, setScan] = useState<RecordValue | null>(null);
  const [working, setWorking] = useState<'QuickScan' | 'FullScan' | null>(null);
  const [message, setMessage] = useState('Checking for the local CyberAmour sensor…');
  const [health, setHealth] = useState<RecordValue | null>(null);
  const showDefender = mode !== 'network';
  const showNetwork = mode !== 'antivirus';
  const request = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {}); headers.set('Authorization', `Bearer ${token.trim()}`);
    const response = await fetch(`${SENSOR}${path}`, { ...init, headers, signal: init.signal || AbortSignal.timeout(3600000) });
    if (!response.ok) throw new Error(await responseError(response));
    return response.json();
  };
  useEffect(() => { let active = true; fetch(`${SENSOR}/api/health`, { signal: AbortSignal.timeout(1800) }).then(r => r.json()).then(v => { if (active) { setHealth(v); setMessage('Local sensor is running. Enter its token once to enable scans.'); } }).catch(() => { if (active) setMessage('Local sensor is not running on this computer. Start it with scripts\setup-sensor.ps1, then retry.'); }); return () => { active = false; }; }, []);
  const connect = async () => {
    if (token.trim().length < 32) { setMessage('Enter the local sensor token printed by the setup script (at least 32 characters).'); return; }
    setConnecting(true); setMessage('');
    try {
      const result = await request('/api/status'); setStatus(result); setConnected(true);
      try { sessionStorage.setItem('cyberamour-local-sensor-token', token.trim()); } catch { /* session storage optional */ }
      if (showDefender) { try { const d = await request('/api/defender/status'); setScan({ status: d.status, provider: d.provider, statusOnly: true }); } catch (e: any) { setMessage(e?.message || 'Could not read Microsoft Defender status.'); } }
      setMessage('Connected to the local sensor. Scan actions run on this computer, not on the website host.');
    } catch (e: any) { setConnected(false); setStatus(null); setMessage(e?.message || 'Connection failed. Check the sensor process, token and allowed website origin.'); }
    finally { setConnecting(false); }
  };
  const runScan = async (scanType: 'QuickScan' | 'FullScan') => {
    setWorking(scanType); setMessage(scanType === 'FullScan' ? 'Microsoft Defender full scan requested. This can take a long time; keep this tab open.' : 'Microsoft Defender quick scan requested.'); setScan(null);
    try { const result = await request('/api/defender/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scanType }) }); setScan(result); setMessage('Defender returned a scan response. Verify completion and any remediation in Windows Security.'); }
    catch (e: any) { setMessage(e?.message || 'Defender scan could not be completed. No clean result is assumed.'); }
    finally { setWorking(null); }
  };
  return <section className="glass-card p-5 md:p-6 space-y-5" aria-label="CyberAmour local security sensor">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3 items-start"><div className="rounded-xl bg-primary/15 text-primary border border-primary/20 p-3"><ShieldCheck size={22}/></div><div><div className="text-xs uppercase tracking-[.2em] text-primary font-bold">Endpoint protection</div><h2 className="text-xl md:text-2xl font-black mt-1">CyberAmour Local Security Sensor</h2><p className="text-sm text-text-dim mt-1">Runs Microsoft Defender scans directly on this Windows computer. No file uploads are required.</p></div></div><span className={`rounded-full px-3 py-2 text-xs border ${connected ? 'border-success/40 bg-success/10 text-success' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>{connected ? 'Sensor connected' : 'Sensor disconnected'}</span></header>
    <div className="rounded-xl border border-border bg-bg/50 p-4 space-y-3"><div className="flex items-center gap-2 text-sm font-bold"><LockKeyhole size={16} className="text-primary"/> Secure local connection</div><p className="text-sm text-text-dim">{health ? `${health.service || 'Local sensor'} is responding.` : 'The sensor must be installed and running on this computer.'}</p><div className="flex flex-col sm:flex-row gap-2"><input type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="Local sensor token" className="flex-1 min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm" aria-label="Local sensor token"/><button type="button" onClick={connect} disabled={connecting} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2">{connecting ? <RefreshCw size={15} className="animate-spin"/> : <Wifi size={15}/>} {connecting ? 'Connecting…' : connected ? 'Refresh connection' : 'Connect sensor'}</button></div><p className="text-xs text-text-dim">The token is stored in this browser tab's session storage. The sensor binds to loopback and accepts authorised local actions only.</p></div>
    {message && <div role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-sm text-amber-100 flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5"/><span>{message}</span></div>}
    {showDefender && <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5 space-y-4"><div className="flex gap-3 items-center"><ShieldAlert className="text-primary" size={22}/><div><h3 className="font-bold text-lg">Windows malware scan & protection</h3><p className="text-xs text-text-dim">Uses the Microsoft Defender engine already installed on Windows. The app does not replace Defender's real-time protection or silently change its settings.</p></div></div><div className="grid sm:grid-cols-2 gap-3"><button type="button" onClick={() => runScan('QuickScan')} disabled={!connected || !!working} className="min-h-14 rounded-xl bg-primary px-5 py-3 font-extrabold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 flex items-center justify-center gap-2">{working === 'QuickScan' ? <RefreshCw size={18} className="animate-spin"/> : <ShieldCheck size={18}/>} {working === 'QuickScan' ? 'Quick scan running…' : 'Start Quick Scan'}</button><button type="button" onClick={() => runScan('FullScan')} disabled={!connected || !!working} className="min-h-14 rounded-xl border border-primary/50 px-5 py-3 font-extrabold disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2">{working === 'FullScan' ? <RefreshCw size={18} className="animate-spin"/> : <Activity size={18}/>} {working === 'FullScan' ? 'Full scan running…' : 'Start Full Scan'}</button></div><p className="text-xs text-text-dim">Scans require a running local sensor and a functioning Microsoft Defender service. Full scans can take hours. If Defender is disabled or managed by an organisation, the scan may be blocked.</p>
      {scan && <div className="rounded-xl border border-border bg-bg/50 p-4 space-y-3"><div className="flex items-center gap-2 font-bold"><CheckCircle2 className="text-primary" size={18}/>{scan.statusOnly ? 'Microsoft Defender status' : `${scan.scanType || 'Defender'} scan response`}</div>{scan.status && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">{Object.entries(scan.status).map(([key, value]) => <div key={key} className="rounded-lg border border-border p-3"><div className="text-xs text-text-dim">{key}</div><div className="font-semibold mt-1 break-words">{String(value ?? '—')}</div></div>)}</div>}{!scan.statusOnly && <><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">{[['Antivirus enabled',scan.AntivirusEnabled],['Real-time protection',scan.RealTimeProtectionEnabled],['Threat count in Defender history',scan.ThreatCount],['Signatures last updated',scan.AntivirusSignatureLastUpdated],['Request timestamp (UTC)',scan.startedAt]].map(([label,value]) => <div key={String(label)} className="rounded-lg border border-border p-3"><div className="text-xs text-text-dim">{label}</div><div className="font-semibold mt-1 break-words">{String(value ?? '—')}</div></div>)}</div><p className="text-xs text-amber-200">{scan.note}</p></>}</div>}
    </div>}
    {showNetwork && <div className="rounded-xl border border-border p-4 space-y-2"><h3 className="font-bold flex items-center gap-2"><Activity size={18} className="text-primary"/>Network analysis</h3><p className="text-sm text-text-dim">Packet capture and saved-PCAP upload controls have been removed as requested. The sensor can still be extended for user-initiated live capture without file uploads.</p></div>}
  </section>;
}
