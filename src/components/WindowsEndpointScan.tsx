import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileUp, ShieldAlert, ShieldCheck, Upload, RefreshCw, Activity } from 'lucide-react';

type AnyRecord = Record<string, any>;
type KevRow = Record<string, string>;

function saveBlob(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvRows(text: string): KevRow[] {
  // Parse quoted CSV fields, including commas and escaped double quotes.
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (ch === ',' && !quoted) { row.push(field); field = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field); if (row.some(v => v.trim())) rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.replace(/^\uFEFF/, '').trim());
  return rows.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()])));
}
const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function WindowsEndpointScan() {
  const [report, setReport] = useState<AnyRecord | null>(null);
  const [kev, setKev] = useState<KevRow[]>([]);
  const [reportName, setReportName] = useState('');
  const [kevName, setKevName] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [defenderStatus, setDefenderStatus] = useState<AnyRecord | null>(null);
  const [defenderThreats, setDefenderThreats] = useState<AnyRecord | null>(null);
  const [defenderBusy, setDefenderBusy] = useState(false);
  const [defenderMessage, setDefenderMessage] = useState('');
  const [bodmasDirectory, setBodmasDirectory] = useState('C:\\Users\\DELL\\Downloads');
  const [bodmasQuarantine, setBodmasQuarantine] = useState(false);
  const [bodmasBusy, setBodmasBusy] = useState(false);
  const [bodmasResult, setBodmasResult] = useState<AnyRecord | null>(null);
  const [bodmasMessage, setBodmasMessage] = useState('');
  const apiBase = (import.meta as any).env?.VITE_SOC_API_URL || 'http://127.0.0.1:8091';
  const refreshDefender = async () => {
    setDefenderBusy(true); setDefenderMessage('');
    try {
      const [statusResponse, threatsResponse] = await Promise.all([
        fetch(`${apiBase}/api/defender/status`),
        fetch(`${apiBase}/api/defender/threats`)
      ]);
      const statusPayload = await statusResponse.json();
      const threatsPayload = await threatsResponse.json();
      if (!statusResponse.ok) throw new Error(statusPayload.detail || `Defender status failed (${statusResponse.status})`);
      if (!threatsResponse.ok) throw new Error(threatsPayload.detail || `Defender detections failed (${threatsResponse.status})`);
      setDefenderStatus(statusPayload); setDefenderThreats(threatsPayload);
    } catch (e: any) { setDefenderMessage(e?.message || 'Could not contact the local Defender integration.'); }
    finally { setDefenderBusy(false); }
  };
  const requestDefenderScan = async (scanType: 'QuickScan' | 'FullScan') => {
    setDefenderBusy(true); setDefenderMessage('');
    try {
      const response = await fetch(`${apiBase}/api/defender/scan?scan_type=${scanType}`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `Scan request failed (${response.status})`);
      setDefenderMessage(payload.message || `${scanType} request sent to Microsoft Defender.`);
    } catch (e: any) { setDefenderMessage(e?.message || 'Could not request a Defender scan.'); }
    finally { setDefenderBusy(false); }
  };
  const runBodmasScan = async () => {
    setBodmasBusy(true); setBodmasMessage(''); setBodmasResult(null);
    try {
      const response = await fetch(`${apiBase}/api/malware/scan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: bodmasDirectory, quarantine_matches: bodmasQuarantine, max_files: 5000 })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `BODMAS scan failed (${response.status})`);
      setBodmasResult(payload);
      setBodmasMessage(payload.status === 'PARTIAL' ? 'Scan finished with skipped files; review the incomplete result.' : 'Hash comparison finished. Review any matches before taking further action.');
    } catch (e: any) { setBodmasMessage(e?.message || 'Could not run the local BODMAS hash scan.'); }
    finally { setBodmasBusy(false); }
  };
  useEffect(() => { void refreshDefender(); }, []);
  const [scanning, setScanning] = useState(false);
  const runAutomaticScan = async () => {
    setError('');
    setScanning(true);
    try {
      const response = await fetch(`${(import.meta as any).env?.VITE_SOC_API_URL || 'http://127.0.0.1:8091'}/api/endpoint/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `Local scan failed (${response.status}).`);
      if (!payload || typeof payload !== 'object' || !('scanStatus' in payload) || !Array.isArray(payload.installedApplications)) {
        throw new Error('The local scanner returned an unexpected report format.');
      }
      setReport(payload);
      setReportName('Automatic local scan');
    } catch (e: any) {
      setError(e?.message || 'Could not connect to the local CyberAmour scanner. Ensure the local API is running on this Windows computer.');
    } finally {
      setScanning(false);
    }
  };
  const importReport = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !('scanStatus' in data) || !Array.isArray(data.installedApplications)) throw new Error('This does not look like a CyberAmour Windows scan report.');
      setReport(data); setReportName(file.name);
    } catch (e: any) { setError(e?.message || 'Could not read the JSON report.'); }
  };
  const importKev = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      const rows = csvRows(await file.text());
      if (!rows.length || !('cveID' in rows[0]) || !('vendorProject' in rows[0]) || !('product' in rows[0])) throw new Error('CSV must be the CISA KEV catalog with cveID, vendorProject and product columns.');
      setKev(rows); setKevName(file.name);
    } catch (e: any) { setError(e?.message || 'Could not read the KEV CSV.'); }
  };
  const matches = useMemo(() => {
    if (!report) return [] as AnyRecord[];
    const apps: AnyRecord[] = Array.isArray(report.installedApplications) ? report.installedApplications : [];
    const source: KevRow[] = kev.length ? kev : (Array.isArray(report.possibleKevMatches) ? report.possibleKevMatches.map((m: AnyRecord) => ({ cveID: m.CVE, vendorProject: m.Vendor, product: m.Product, vulnerabilityName: m.Vulnerability, dateAdded: m.DateAdded, dueDate: m.DueDate, requiredAction: m.RequiredAction, installedName: m.InstalledName, installedVersion: m.InstalledVersion, publisher: m.Publisher, status: m.Status, notes: m.Notes })) : []);
    const output: AnyRecord[] = [];
    if (kev.length) {
      for (const v of source) {
        const product = (v.product || '').toLowerCase(); const vendor = (v.vendorProject || '').toLowerCase();
        if (!product) continue;
        for (const app of apps) {
          const name = String(app.Name || '').toLowerCase(); const publisher = String(app.Publisher || '').toLowerCase();
          if ((name.includes(product) || (!!vendor && !!publisher && publisher.includes(vendor))) && (name || publisher)) {
            output.push({ ...v, InstalledName: app.Name || '', InstalledVersion: app.Version || '', Publisher: app.Publisher || '', Status: 'POSSIBLE_MATCH_REQUIRES_VALIDATION', Notes: 'Vendor/product string match only; confirm affected version, edition, configuration and exposure with authoritative advisories.' });
          }
        }
      }
    } else return source;
    return output;
  }, [report, kev]);
  const filtered = matches.filter(m => [m.CVE, m.cveID, m.Vendor, m.vendorProject, m.Product, m.product, m.Vulnerability, m.vulnerabilityName, m.InstalledName].join(' ').toLowerCase().includes(search.toLowerCase()));
  const checks = report?.checks || {};
  const failedChecks = Object.entries(checks).filter(([, value]) => ['failed', 'partial', 'unavailable', 'missing', 'invalid'].includes(String(value).toLowerCase()));
  const scanComplete = !!report && report.scanStatus === 'COMPLETE' && failedChecks.length === 0;
  const newestDate = useMemo(() => {
    const dates = kev.map(v => v.dateAdded).filter(Boolean).map(v => new Date(v)).filter(d => !Number.isNaN(d.getTime()));
    if (dates.length) return new Date(Math.max(...dates.map(d => d.getTime())));
    const saved = report?.kevSnapshot?.newestDateAdded;
    return saved ? new Date(saved) : null;
  }, [kev, report]);
  const ageDays = newestDate && !Number.isNaN(newestDate.getTime()) ? Math.floor((Date.now() - newestDate.getTime()) / 86400000) : null;
  const freshness = ageDays === null ? 'UNKNOWN' : ageDays > 30 ? 'OUTDATED' : 'RECENT';
  const exportMatches = () => {
    const cols = ['cveID','vendorProject','product','vulnerabilityName','InstalledName','InstalledVersion','Publisher','dateAdded','dueDate','requiredAction','Status','Notes'];
    saveBlob([cols.join(','), ...filtered.map(m => cols.map(c => esc(m[c] ?? m[c[0].toUpperCase() + c.slice(1)])).join(','))].join('\r\n'), 'cyberamour-possible-kev-matches.csv', 'text/csv;charset=utf-8');
  };
  return <div className="max-w-6xl mx-auto space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[.2em] text-primary font-bold">Defensive endpoint inventory</div><h1 className="text-3xl font-black mt-2">Windows Endpoint Scan</h1><p className="text-text-dim mt-2 max-w-3xl">Import a report produced by the read-only Windows PowerShell agent, then review its completeness and triage possible matches against the CISA KEV snapshot.</p></div><a className="text-sm text-primary underline" href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noreferrer">Official CISA KEV catalog</a></header>
    <section className="glass-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-black flex items-center gap-2"><ShieldCheck size={20}/> Microsoft Defender protection</h2><p className="text-sm text-text-dim mt-1">Read Defender status and request Defender-managed scans. This does not replace Defender's real-time protection engine.</p></div>
        <button onClick={refreshDefender} disabled={defenderBusy} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"><Activity size={15}/>{defenderBusy ? 'Working…' : 'Refresh status'}</button>
      </div>
      {defenderMessage && <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-sm">{defenderMessage}</div>}
      {defenderStatus && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-border p-3"><span className="text-text-dim">Antivirus service</span><p className="font-bold mt-1">{defenderStatus.AMServiceEnabled ? 'Enabled' : 'Disabled / unavailable'}</p></div>
        <div className="rounded-lg border border-border p-3"><span className="text-text-dim">Antivirus protection</span><p className="font-bold mt-1">{defenderStatus.AntivirusEnabled ? 'Enabled' : 'Disabled / unavailable'}</p></div>
        <div className="rounded-lg border border-border p-3"><span className="text-text-dim">Real-time protection</span><p className={`font-bold mt-1 ${defenderStatus.RealTimeProtectionEnabled ? 'text-success' : 'text-amber-200'}`}>{defenderStatus.RealTimeProtectionEnabled ? 'Enabled' : 'Disabled / unavailable'}</p></div>
        <div className="rounded-lg border border-border p-3"><span className="text-text-dim">Security intelligence</span><p className="font-bold mt-1 break-all">{defenderStatus.AntivirusSignatureVersion || 'Unknown'}</p><p className="text-xs text-text-dim">{defenderStatus.AntivirusSignatureLastUpdated || 'Update time unavailable'}</p></div>
        <div className="rounded-lg border border-border p-3"><span className="text-text-dim">Recorded Defender detections</span><p className="font-bold mt-1">{defenderThreats?.count ?? '—'}</p></div>
      </div>}
      <div className="flex flex-wrap gap-2"><button disabled={defenderBusy} onClick={() => requestDefenderScan('QuickScan')} className="rounded-lg bg-primary px-4 py-2 font-bold text-white disabled:opacity-50">Request Quick Scan</button><button disabled={defenderBusy} onClick={() => requestDefenderScan('FullScan')} className="rounded-lg border border-border px-4 py-2 font-bold disabled:opacity-50">Request Full Scan</button></div>
      <p className="text-xs text-text-dim">A successful request means Windows accepted the request, not that the scan has finished. Full scans can take a long time. Use the Windows Security app to review detailed results and remediation.</p>
      {defenderThreats?.detections?.length > 0 && <div className="overflow-x-auto"><h3 className="font-bold mb-2">Recent recorded detections</h3><table className="w-full text-sm"><thead><tr className="text-left text-text-dim"><th className="p-2">Threat ID</th><th className="p-2">Detected</th><th className="p-2">Action success</th><th className="p-2">Resources</th></tr></thead><tbody>{defenderThreats.detections.slice(0,100).map((d: AnyRecord, i: number) => <tr key={`${d.ThreatID}-${i}`} className="border-t border-border"><td className="p-2">{d.ThreatID ?? '—'}</td><td className="p-2">{d.InitialDetectionTime ?? '—'}</td><td className="p-2">{String(d.ActionSuccess ?? 'Unknown')}</td><td className="p-2 max-w-sm break-all">{Array.isArray(d.Resources) ? d.Resources.join(', ') : String(d.Resources ?? '—')}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="glass-card p-5 space-y-4">
      <div><h2 className="text-xl font-black flex items-center gap-2"><ShieldAlert size={20}/> BODMAS hash detection & quarantine</h2><p className="text-sm text-text-dim mt-1">Compares SHA-256 hashes of files on this Windows computer with the included historical BODMAS metadata. It does not use the dataset to classify unknown files.</p></div>
      <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end"><label className="block text-sm">Folder to scan<input value={bodmasDirectory} onChange={e => setBodmasDirectory(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2" placeholder="C:\\Users\\DELL\\Downloads"/></label><button disabled={bodmasBusy || !bodmasDirectory.trim()} onClick={runBodmasScan} className="rounded-lg bg-primary px-4 py-2 font-bold text-white disabled:opacity-50">{bodmasBusy ? 'Scanning hashes…' : 'Scan folder hashes'}</button></div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={bodmasQuarantine} onChange={e => setBodmasQuarantine(e.target.checked)} className="mt-1"/><span><strong>Quarantine exact malware hash matches.</strong> Matched files are moved to CyberAmour's local quarantine folder, not deleted. Leave unchecked for detection-only mode. Use only on folders you are authorised to scan.</span></label>
      {bodmasMessage && <div className="rounded-lg border border-border p-3 text-sm">{bodmasMessage}</div>}
      {bodmasResult && <div className="space-y-3"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Files checked',bodmasResult.files_checked],['Skipped',bodmasResult.files_skipped],['Malware hash matches',bodmasResult.malware_hash_matches],['Quarantined',bodmasResult.quarantined]].map(([label,value]) => <div key={String(label)} className="rounded-lg border border-border p-3"><div className="text-xs text-text-dim">{label}</div><div className="text-xl font-black">{value}</div></div>)}</div><p className="text-xs text-text-dim">{bodmasResult.warning}</p>{bodmasResult.results?.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-text-dim"><th className="p-2">File</th><th className="p-2">SHA-256</th><th className="p-2">Family</th><th className="p-2">Action</th></tr></thead><tbody>{bodmasResult.results.map((r: AnyRecord, i: number) => <tr key={`${r.sha256}-${i}`} className="border-t border-border"><td className="p-2 break-all">{r.path}</td><td className="p-2 break-all">{r.sha256}</td><td className="p-2">{r.family}</td><td className="p-2">{r.action}</td></tr>)}</tbody></table></div>}</div>}
      <p className="text-xs text-text-dim">This is historical hash matching (samples dated 2019–2020), not real-time blocking. Microsoft Defender remains responsible for prevention and remediation. A missing hash match does not mean a file is safe.</p>
    </section>
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2"><div className="text-sm text-text-dim"><strong className="text-primary">Automatic local scan:</strong> this button asks the locally running CyberAmour API on this same computer to launch the bundled read-only PowerShell inventory script. It does not run on a remote hosted website. Product-name matches are leads for analyst validation, not proof of vulnerability or compromise.</div><button type="button" onClick={runAutomaticScan} disabled={scanning} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60"><RefreshCw size={16} className={scanning ? "animate-spin" : ""}/>{scanning ? "Scanning this Windows device…" : "Run automatic Windows scan"}</button></div>
    <div className="grid md:grid-cols-2 gap-4">
      <section className="glass-card p-5 space-y-3"><h2 className="font-bold flex items-center gap-2"><Upload size={18}/> Import scan report (JSON)</h2><p className="text-sm text-text-dim">Select <code>cyberamour-scan-report.json</code> created by the Windows agent.</p><input aria-label="Import Windows scan JSON" type="file" accept=".json,application/json" onChange={e => importReport(e.target.files?.[0])} className="block w-full text-sm"/>{reportName && <p className="text-xs text-text-dim">Loaded: {reportName}</p>}</section>
      <section className="glass-card p-5 space-y-3"><h2 className="font-bold flex items-center gap-2"><FileUp size={18}/> Import CISA KEV snapshot (CSV)</h2><p className="text-sm text-text-dim">Use the supplied <code>known_exploited_vulnerabilities.csv</code>. The bundled ATT&CK/KEV workspace is a separate point-in-time reference.</p><input aria-label="Import CISA KEV CSV" type="file" accept=".csv,text/csv" onChange={e => importKev(e.target.files?.[0])} className="block w-full text-sm"/>{kevName && <p className="text-xs text-text-dim">Loaded: {kevName} · {kev.length.toLocaleString()} rows</p>}</section>
    </div>
    {error && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger"><AlertTriangle size={16} className="inline mr-2"/>{error}</div>}
    {report && <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4"><div className="text-xs text-text-dim">Scan completeness</div><div className={`mt-2 font-black text-xl ${scanComplete ? 'text-success' : 'text-amber-200'}`}>{scanComplete ? 'COMPLETE' : 'INCOMPLETE'}</div><p className="text-xs text-text-dim mt-1">{failedChecks.length} check(s) need review</p></div>
        <div className="glass-card p-4"><div className="text-xs text-text-dim">KEV snapshot freshness</div><div className={`mt-2 font-black text-xl ${freshness === 'RECENT' ? 'text-success' : 'text-amber-200'}`}>{freshness}</div><p className="text-xs text-text-dim mt-1">Newest dateAdded: {newestDate && !Number.isNaN(newestDate.getTime()) ? newestDate.toISOString().slice(0,10) : 'not available'}</p></div>
        <div className="glass-card p-4"><div className="text-xs text-text-dim">Installed applications</div><div className="mt-2 font-black text-xl">{report.installedApplications?.length ?? 0}</div><p className="text-xs text-text-dim mt-1">Registry inventory only</p></div>
        <div className="glass-card p-4"><div className="text-xs text-text-dim">Possible KEV matches</div><div className="mt-2 font-black text-xl">{matches.length.toLocaleString()}</div><p className="text-xs text-text-dim mt-1">Requires version/applicability validation</p></div>
      </div>
      {!scanComplete && <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm"><ShieldAlert size={17} className="inline mr-2 text-amber-200"/><strong>Do not treat this scan as complete.</strong> Review warnings and check results below. Missing checks do not mean the control is secure.</div>}
      {freshness !== 'RECENT' && <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm"><AlertTriangle size={17} className="inline mr-2 text-amber-200"/>The KEV snapshot is {freshness.toLowerCase()}. Refresh it from CISA and rerun/import the scan before relying on current coverage.</div>}
      <section className="glass-card p-5 space-y-4"><h2 className="text-xl font-black flex items-center gap-2"><ShieldCheck size={20}/> Scan details</h2><div className="grid md:grid-cols-3 gap-3 text-sm"><div><span className="text-text-dim">Computer</span><p className="font-semibold">{report.computerName || 'Unknown'}</p></div><div><span className="text-text-dim">Windows</span><p className="font-semibold">{report.operatingSystem?.Caption || 'Unknown'} {report.operatingSystem?.Version || ''} (build {report.operatingSystem?.BuildNumber || '—'})</p></div><div><span className="text-text-dim">Completed (UTC)</span><p className="font-semibold">{report.scanCompletedUtc || 'Not supplied'}</p></div></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{Object.entries(checks).map(([key, value]) => <div key={key} className="rounded-lg border border-border p-3 flex items-center gap-2 text-sm">{String(value) === 'complete' ? <CheckCircle2 className="text-success shrink-0" size={16}/> : <AlertTriangle className="text-amber-200 shrink-0" size={16}/>}<span className="break-all">{key}</span><strong className="ml-auto">{String(value)}</strong></div>)}</div>{Array.isArray(report.warnings) && report.warnings.length > 0 && <div><h3 className="font-bold text-amber-200">Warnings</h3><ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-text-dim">{report.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul></div>}</section>
      <section className="glass-card p-5 space-y-4"><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-black">Possible KEV matches</h2><span className="text-xs text-text-dim">{filtered.length.toLocaleString()} shown</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter CVE, product, installed app…" className="ml-auto min-w-[220px] rounded-lg border border-border bg-surface px-3 py-2 text-sm"/><button onClick={exportMatches} disabled={!filtered.length} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"><Download size={15}/>Export CSV</button></div><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-surface text-xs uppercase text-text-dim"><tr><th className="p-3">CVE</th><th className="p-3">Vendor / product</th><th className="p-3">Installed application</th><th className="p-3">Date added</th><th className="p-3">Assessment</th></tr></thead><tbody>{filtered.slice(0,300).map((m, i) => <tr key={`${m.CVE || m.cveID}-${m.InstalledName}-${i}`} className="border-t border-border align-top"><td className="p-3"><a className="text-primary underline font-mono" href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(m.CVE || m.cveID || '')}`} target="_blank" rel="noreferrer">{m.CVE || m.cveID || 'Unknown CVE'}</a></td><td className="p-3">{m.Vendor || m.vendorProject || '—'}<p className="text-xs text-text-dim">{m.Product || m.product || '—'}</p></td><td className="p-3">{m.InstalledName || 'Not supplied'}<p className="text-xs text-text-dim">{m.InstalledVersion || ''} {m.Publisher || ''}</p></td><td className="p-3">{m.DateAdded || m.dateAdded || '—'}</td><td className="p-3 text-amber-200">Possible match — validate version and vendor advisory</td></tr>)}</tbody></table></div>{filtered.length > 300 && <p className="text-xs text-text-dim">Showing first 300 rows; export CSV for the full filtered result.</p>}{!filtered.length && <p className="text-sm text-text-dim">No possible matches in the current report / selected CSV.</p>}</section>
      <div className="flex flex-wrap gap-3"><button onClick={() => saveBlob(JSON.stringify(report, null, 2), 'cyberamour-scan-report-export.json', 'application/json')} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white"><Download size={16}/>Export imported JSON</button><button onClick={() => { setReport(null); setReportName(''); setSearch(''); }} className="rounded-xl border border-border px-4 py-3">Clear report</button></div>
    </>}
  </div>;
}
