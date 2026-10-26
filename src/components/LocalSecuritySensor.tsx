import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Cloud, Download, ExternalLink, FileSearch, LockKeyhole, RefreshCw, ShieldCheck, Upload, Wifi, XCircle } from 'lucide-react';

const SENSOR = 'http://127.0.0.1:8765';
type Mode = 'all' | 'antivirus' | 'network';
type JsonRecord = Record<string, any>;

function storedToken(): string {
  try { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cyberamour-local-sensor-token') || '' : ''; }
  catch { return ''; }
}

function saveJSON(data: any, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = fileName; a.click(); URL.revokeObjectURL(url);
}

async function errorFrom(response: Response): Promise<string> {
  try { const body = await response.json(); return body.detail || body.message || `Sensor request failed (${response.status})`; }
  catch { return `Sensor request failed (${response.status})`; }
}

const OPEN_TOOLS = [
  { name: 'ClamAV', role: 'Signature-based malware scan', url: 'https://www.clamav.net/' },
  { name: 'Wireshark / TShark', role: 'Read and dissect PCAP / PCAPNG', url: 'https://www.wireshark.org/' },
  { name: 'Suricata', role: 'Offline IDS alerts for PCAP files', url: 'https://suricata.io/' },
  { name: 'YARA', role: 'Rule-based file pattern detection', url: 'https://github.com/VirusTotal/yara' },
  { name: 'SigmaHQ', role: 'Community detection rules for SIEM workflows', url: 'https://github.com/SigmaHQ/sigma' },
  { name: 'CISA KEV', role: 'Public catalog of exploited vulnerabilities', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
  { name: 'Splunk HEC', role: 'Optional event forwarding (requires HEC token)', url: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector' },
];

export default function LocalSecuritySensor({ mode = 'all' }: { mode?: Mode }) {
  const [token, setToken] = useState(storedToken);
  const [connecting, setConnecting] = useState(false);
  const [sensorStatus, setSensorStatus] = useState<JsonRecord | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('Sensor has not been connected in this tab yet.');
  const [file, setFile] = useState<File | null>(null);
  const [pcap, setPcap] = useState<File | null>(null);
  const [working, setWorking] = useState<'file' | 'pcap' | 'capture' | 'intel' | null>(null);
  const [interfaces, setInterfaces] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedInterface, setSelectedInterface] = useState('');
  const [captureSeconds, setCaptureSeconds] = useState('15');
  const [interfaceMessage, setInterfaceMessage] = useState('Connect the sensor to enumerate available TShark interfaces.');
  const [fileReport, setFileReport] = useState<JsonRecord | null>(null);
  const [pcapReport, setPcapReport] = useState<JsonRecord | null>(null);
  const [intelQuery, setIntelQuery] = useState('');
  const [intelReport, setIntelReport] = useState<JsonRecord | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${SENSOR}/api/health`, { method: 'GET', signal: AbortSignal.timeout(1800) })
      .then(async r => { if (!r.ok) throw new Error('Local sensor health endpoint returned an error.'); const j = await r.json(); if (active) setConnectionMessage(`${j.service} is responding. Enter the local token and connect to enable scanning.`); })
      .catch(() => { if (active) setConnectionMessage('Local sensor not detected. Install its optional dependencies and start the sensor on this computer.'); });
    return () => { active = false; };
  }, []);

  const request = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token.trim()}`);
    const response = await fetch(`${SENSOR}${path}`, { ...init, headers, signal: init.signal || AbortSignal.timeout(180000) });
    if (!response.ok) throw new Error(await errorFrom(response));
    return response.json();
  };

  const connect = async () => {
    if (token.trim().length < 32) { setMessage('Enter the local sensor token shown by the setup script (32+ characters).'); return; }
    setConnecting(true); setMessage('');
    try {
      const result = await request('/api/status', { method: 'GET' });
      setSensorStatus(result); setConnectionMessage('Connected to the local sensor on this computer.');
      try { sessionStorage.setItem('cyberamour-local-sensor-token', token.trim()); } catch { /* session persistence is optional */ }
      try {
        const deviceList = await request('/api/network/interfaces', { method: 'GET' });
        setInterfaces(Array.isArray(deviceList.interfaces) ? deviceList.interfaces : []);
        setSelectedInterface((current) => current || deviceList.interfaces?.[0]?.id || '');
        setInterfaceMessage(deviceList.interfaces?.length ? `${deviceList.interfaces.length} interface(s) available. Live capture has not started.` : 'TShark reported no available capture interfaces.');
      } catch (interfaceError: any) {
        setInterfaces([]); setInterfaceMessage(interfaceError?.message || 'TShark interfaces could not be enumerated.');
      }
    } catch (e: any) { setSensorStatus(null); setConnectionMessage('Connection failed. Check that the sensor is running and that the token and allowed origin match.'); setMessage(e?.message || 'Could not connect to the local sensor.'); }
    finally { setConnecting(false); }
  };

  const scanFile = async () => {
    if (!file) return;
    setWorking('file'); setMessage(''); setFileReport(null);
    try {
      const form = new FormData(); form.append('file', file, file.name);
      const result = await request('/api/scan/file', { method: 'POST', body: form });
      setFileReport(result);
    } catch (e: any) { setMessage(e?.message || 'Local malware scan failed.'); }
    finally { setWorking(null); }
  };

  const analyzePcap = async () => {
    if (!pcap) return;
    setWorking('pcap'); setMessage(''); setPcapReport(null);
    try {
      const form = new FormData(); form.append('file', pcap, pcap.name);
      const result = await request('/api/pcap/analyze', { method: 'POST', body: form });
      setPcapReport(result);
    } catch (e: any) { setMessage(e?.message || 'PCAP analysis failed.'); }
    finally { setWorking(null); }
  };

  const loadInterfaces = async () => {
    setMessage('');
    try {
      const result = await request('/api/network/interfaces', { method: 'GET' });
      const list = Array.isArray(result.interfaces) ? result.interfaces : [];
      setInterfaces(list);
      setSelectedInterface((current) => list.some((item: any) => item.id === current) ? current : (list[0]?.id || ''));
      setInterfaceMessage(list.length ? `${list.length} interface(s) available. Listing interfaces does not start capture.` : 'TShark reported no available capture interfaces.');
    } catch (e: any) {
      setInterfaces([]); setSelectedInterface(''); setInterfaceMessage(e?.message || 'Could not list capture interfaces.');
    }
  };

  const startLiveCapture = async () => {
    if (!selectedInterface) { setMessage('Select a TShark interface before starting capture.'); return; }
    setWorking('capture'); setMessage(''); setPcapReport(null);
    try {
      const result = await request('/api/network/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interface: selectedInterface, durationSeconds: Number(captureSeconds) })
      });
      setPcapReport(result);
    } catch (e: any) { setMessage(e?.message || 'Live packet capture failed. Check Wireshark/TShark, Npcap, adapter permissions and the selected interface.'); }
    finally { setWorking(null); }
  };

  const searchKev = async () => {
    setWorking('intel'); setMessage(''); setIntelReport(null);
    try {
      const result = await request(`/api/intel/cisa-kev?q=${encodeURIComponent(intelQuery)}&limit=25`, { method: 'GET' });
      setIntelReport(result);
    } catch (e: any) { setMessage(e?.message || 'Could not retrieve the public CISA KEV feed.'); }
    finally { setWorking(null); }
  };

  const connectedTools = sensorStatus?.tools || {};
  const showFile = mode !== 'network';
  const showNetwork = mode !== 'antivirus';

  return <section className="glass-card p-5 md:p-6 space-y-5" aria-label="CyberAmour local security sensor">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex gap-3 items-start">
        <div className="rounded-xl bg-primary/15 text-primary border border-primary/20 p-3"><Activity size={22}/></div>
        <div><div className="text-xs uppercase tracking-[.2em] text-primary font-bold">Open-source integrations</div>
          <h2 className="text-xl md:text-2xl font-black mt-1">CyberAmour Local Security Sensor</h2>
          <p className="text-sm text-text-dim mt-1 max-w-3xl">Uses tools installed on this computer. It scans only selected files and uploaded PCAPs; it does not silently monitor the device or block traffic.</p>
        </div>
      </div>
      <span className={`rounded-full px-3 py-2 text-xs border ${sensorStatus ? 'border-success/40 bg-success/10 text-success' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
        {sensorStatus ? 'Connected' : 'Sensor not connected'}
      </span>
    </div>

    <div className="rounded-xl border border-border bg-bg/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold"><LockKeyhole size={16} className="text-primary"/> Local connection</div>
      <p className="text-sm text-text-dim">{connectionMessage}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste the local sensor token" className="flex-1 min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm" aria-label="Local sensor token" />
        <button type="button" onClick={connect} disabled={connecting} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2">{connecting ? <RefreshCw size={15} className="animate-spin"/> : <Wifi size={15}/>} {connecting ? 'Connecting…' : 'Connect sensor'}</button>
      </div>
      {!sensorStatus && <p className="text-xs text-text-dim">Start `scripts/setup-sensor.ps1` on Windows or `scripts/start-sensor.sh` on Linux/macOS, then paste the token printed in the terminal.</p>}
    </div>

    {message && <div role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-sm text-amber-100 flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5"/><span>{message}</span></div>}

    {sensorStatus && <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {[
        ['ClamAV', connectedTools.clamav], ['YARA', connectedTools.yara], ['TShark', connectedTools.tshark], ['Suricata', connectedTools.suricata], ['Zeek', connectedTools.zeek], ['Splunk HEC', connectedTools.splunk_hec?.configured ? { installed: true, version: `Configured · ${connectedTools.splunk_hec.index}` } : { installed: false, version: 'Not configured' }]
      ].map(([name, data]: any) => <div key={name} className="rounded-xl border border-border bg-bg/40 p-3"><div className="text-xs text-text-dim">{name}</div><div className={`text-sm font-bold mt-1 ${data?.installed ? 'text-success' : 'text-amber-200'}`}>{data?.installed ? 'Available' : 'Not ready'}</div><div className="text-[10px] text-text-dim mt-1 break-words">{data?.version || 'Install the tool and restart sensor'}</div></div>)}
    </div>}

    {showFile && <div className="rounded-xl border border-border p-4 md:p-5 space-y-4">
      <div className="flex gap-3 items-center"><ShieldCheck className="text-primary" size={21}/><div><h3 className="font-bold">Local file malware scan</h3><p className="text-xs text-text-dim">ClamAV signature scan + optional YARA rules. File is processed locally and not sent to a cloud reputation provider.</p></div></div>
      <div className="flex flex-col md:flex-row gap-3">
        <input type="file" onChange={e => {setFile(e.target.files?.[0] || null); setFileReport(null);}} className="block flex-1 min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white" />
        <button type="button" onClick={scanFile} disabled={!sensorStatus || !token || !file || !!working} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2">{working === 'file' ? <RefreshCw size={15} className="animate-spin"/> : <FileSearch size={15}/>} {working === 'file' ? 'Scanning file…' : 'Scan with local tools'}</button>
      </div>
      <p className="text-xs text-text-dim">Files up to {Math.round((connectedTools.maxUploadBytes || 104857600)/1024/1024)} MB. The uploaded file stays on this machine's local sensor and is deleted from its temporary folder after analysis; do not select files you are not authorized to examine.</p>
      {fileReport && <div className="rounded-xl border border-border bg-bg/40 p-4 space-y-3">
        <div className="flex flex-wrap justify-between gap-2 items-center"><div className="flex gap-2 items-center">{fileReport.overall === 'detections_found' ? <XCircle className="text-red-400"/> : fileReport.overall === 'no_detections_reported' ? <CheckCircle2 className="text-success"/> : <AlertTriangle className="text-amber-300"/>}<strong>{fileReport.overall === 'detections_found' ? 'Detection reported' : fileReport.overall === 'no_detections_reported' ? 'No detections reported by configured engines' : 'Scan incomplete'}</strong></div><button type="button" onClick={() => saveJSON(fileReport, 'cyberamour-file-scan-report.json')} className="text-xs text-primary flex gap-1 items-center"><Download size={13}/> Export JSON</button></div>
        <div className="text-xs text-text-dim break-all">{fileReport.fileName} · SHA-256: {fileReport.sha256}</div>
        <div className="grid md:grid-cols-2 gap-3">{[['ClamAV', fileReport.clamav], ['YARA', fileReport.yara]].map(([title, engine]: any) => <div key={title} className="rounded-lg bg-surface p-3"><div className="text-xs text-text-dim">{title}</div><div className="font-bold text-sm mt-1">{engine?.verdict || 'not_run'}</div><p className="text-xs text-text-dim mt-1 whitespace-pre-wrap break-words">{engine?.message || engine?.output || engine?.matches?.join('\n') || engine?.error || (engine?.available ? 'No matching rule was reported.' : 'Engine not available.')}</p></div>)}</div>
        <p className="text-xs text-amber-200">{fileReport.note} Splunk: {fileReport.splunk?.sent ? 'summary sent' : fileReport.splunk?.reason || 'not configured'}.</p>
      </div>}
    </div>}

    {showNetwork && <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5 space-y-4">
      <div className="flex gap-3 items-center"><Activity className="text-primary" size={21}/><div><h3 className="font-bold">Live packet capture — Wireshark / TShark</h3><p className="text-xs text-text-dim">Select an interface and a short duration to start a user-initiated capture on this computer. The resulting PCAPNG is analyzed by the same TShark/Suricata pipeline.</p></div></div>
      <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3 items-end">
        <label className="block text-xs text-text-dim">Network interface
          <select value={selectedInterface} onChange={e => setSelectedInterface(e.target.value)} disabled={!sensorStatus || !!working || !interfaces.length} className="block w-full mt-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-main disabled:opacity-50">
            <option value="">Select interface</option>{interfaces.map(item => <option key={item.id} value={item.id}>{item.id}. {item.label}</option>)}
          </select>
        </label>
        <label className="block text-xs text-text-dim">Capture duration
          <select value={captureSeconds} onChange={e => setCaptureSeconds(e.target.value)} disabled={!!working} className="block w-full mt-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-main"><option value="10">10 seconds</option><option value="15">15 seconds</option><option value="30">30 seconds</option></select>
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={loadInterfaces} disabled={!sensorStatus || !!working} className="rounded-xl border border-border px-3 py-2.5 text-xs font-bold disabled:opacity-40">Refresh interfaces</button>
          <button type="button" onClick={startLiveCapture} disabled={!sensorStatus || !selectedInterface || !!working || !connectedTools.tshark?.installed} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2">{working === 'capture' ? <RefreshCw size={14} className="animate-spin"/> : <Activity size={14}/>} {working === 'capture' ? 'Capturing…' : 'Capture & analyze'}</button>
        </div>
      </div>
      <p className="text-xs text-text-dim">{interfaceMessage}</p>
      <p className="text-xs text-amber-200">Capture runs only after you press the button and lasts at most 30 seconds. On Windows, Wireshark's Npcap and permission to capture on the chosen adapter may be required. It does not block or modify traffic.</p>
    </div>}

    {showNetwork && <div className="rounded-xl border border-border p-4 md:p-5 space-y-4">
      <div className="flex gap-3 items-center"><Activity className="text-primary" size={21}/><div><h3 className="font-bold">Saved PCAP / PCAPNG analysis</h3><p className="text-xs text-text-dim">Upload a capture from Wireshark. TShark decodes real packets; Suricata may add IDS alerts if installed and configured.</p></div></div>
      <div className="flex flex-col md:flex-row gap-3"><input type="file" accept=".pcap,.pcapng,.cap,.dmp,application/vnd.tcpdump.pcap" onChange={e => {setPcap(e.target.files?.[0] || null); setPcapReport(null);}} className="block flex-1 min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white"/><button type="button" onClick={analyzePcap} disabled={!sensorStatus || !token || !pcap || !!working} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2">{working === 'pcap' ? <RefreshCw size={15} className="animate-spin"/> : <Upload size={15}/>} {working === 'pcap' ? 'Analyzing capture…' : 'Analyze PCAP'}</button></div>
      <p className="text-xs text-text-dim">This reads a saved capture. It does not initiate live capture, enable promiscuous mode or block network connections.</p>
      {pcapReport && <div className="rounded-xl border border-border bg-bg/40 p-4 space-y-4">
        <div className="flex flex-wrap gap-2 justify-between items-center"><div><div className="text-sm font-bold">{pcapReport.fileName}</div><div className="text-xs text-text-dim">{pcapReport.sampledPackets} rows shown · limit {pcapReport.packetLimit} · {pcapReport.engine}{pcapReport.capture ? ` · Live capture on interface ${pcapReport.capture.interfaceId} for ${pcapReport.capture.requestedDurationSeconds}s` : ''}</div></div><button type="button" onClick={() => saveJSON(pcapReport, 'cyberamour-pcap-analysis.json')} className="text-xs text-primary flex gap-1 items-center"><Download size={13}/> Export JSON</button></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Protocols', Object.keys(pcapReport.protocolCounts || {}).length], ['Bytes', (pcapReport.estimatedBytesForAnalyzedRows || 0).toLocaleString()], ['Peers', (pcapReport.topPeers || []).length], ['Suricata alerts', (pcapReport.suricata?.alerts || []).length]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-surface p-3"><div className="text-xs text-text-dim">{label}</div><div className="text-lg font-black">{value}</div></div>)}</div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div><h4 className="text-sm font-bold mb-2">Protocol counts</h4><div className="space-y-1 max-h-44 overflow-auto">{Object.entries(pcapReport.protocolCounts || {}).map(([proto, count]: any) => <div key={proto} className="flex justify-between gap-2 border-b border-border/60 py-1 text-xs"><span>{proto}</span><strong>{count}</strong></div>)}</div></div>
          <div><h4 className="text-sm font-bold mb-2">Top source/destination IPs</h4><div className="space-y-1 max-h-44 overflow-auto">{(pcapReport.topPeers || []).map((peer: any) => <div key={peer.ip} className="flex justify-between gap-2 border-b border-border/60 py-1 text-xs"><span className="font-mono break-all">{peer.ip}</span><strong>{peer.observations}</strong></div>)}</div></div>
        </div>
        <div><h4 className="text-sm font-bold mb-2">Decoded packet rows (first 500)</h4><div className="overflow-auto max-h-64 rounded-lg border border-border"><table className="w-full text-xs min-w-[680px]"><thead className="sticky top-0 bg-surface"><tr>{['No.','Source','Destination','Protocol','Length','DNS / HTTP / TLS name'].map(x => <th key={x} className="p-2 text-left">{x}</th>)}</tr></thead><tbody>{(pcapReport.packets || []).map((pkt: any, i: number) => <tr key={`${pkt.number}-${i}`} className="border-t border-border/50"><td className="p-2">{pkt.number}</td><td className="p-2 font-mono">{pkt.source || '—'}{pkt.sourcePort ? `:${pkt.sourcePort}` : ''}</td><td className="p-2 font-mono">{pkt.destination || '—'}{pkt.destinationPort ? `:${pkt.destinationPort}` : ''}</td><td className="p-2">{pkt.protocol}</td><td className="p-2">{pkt.length}</td><td className="p-2 break-all">{pkt.dnsQuery || pkt.httpHost || pkt.tlsServerName || '—'}</td></tr>)}</tbody></table></div></div>
        <div className="rounded-lg bg-surface p-3"><h4 className="font-bold text-sm">Suricata IDS</h4>{!pcapReport.suricata?.available ? <p className="text-xs text-text-dim mt-1">{pcapReport.suricata?.message}</p> : pcapReport.suricata?.error ? <p className="text-xs text-amber-200 mt-1">Suricata exited with an error: {pcapReport.suricata.error}</p> : (pcapReport.suricata?.alerts || []).length ? <div className="mt-2 space-y-2">{pcapReport.suricata.alerts.map((a: any, i: number) => <div key={i} className="text-xs border-t border-border pt-2"><strong className="text-red-300">{a.signature || 'Suricata alert'}</strong><div>{a.source}:{a.sourcePort} → {a.destination}:{a.destinationPort} · severity {a.severity ?? '—'} · {a.category || 'Uncategorized'}</div></div>)}</div> : <p className="text-xs text-text-dim mt-1">Suricata reported no alerts under its current ruleset. This is not proof of safe traffic.</p>}</div>
        <p className="text-xs text-amber-200">{pcapReport.note} Splunk: {pcapReport.splunk?.sent ? 'summary sent' : pcapReport.splunk?.reason || 'not configured'}.</p>
      </div>}
    </div>}

    {showNetwork && <div className="rounded-xl border border-border p-4 md:p-5 space-y-4">
      <div className="flex gap-3 items-center"><Cloud className="text-primary" size={21}/><div><h3 className="font-bold">Public vulnerability feed — CISA KEV</h3><p className="text-xs text-text-dim">Searches the official public Known Exploited Vulnerabilities catalog through the local sensor. This is a vulnerability feed, not an antivirus feed.</p></div></div>
      <div className="flex flex-col sm:flex-row gap-2"><input value={intelQuery} onChange={e => setIntelQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchKev()} placeholder="CVE ID, vendor, product or keyword" className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm"/><button onClick={searchKev} disabled={!sensorStatus || !token || !!working} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{working === 'intel' ? 'Fetching feed…' : 'Search CISA KEV'}</button></div>
      {intelReport && <div className="space-y-2"><div className="flex justify-between items-center text-xs text-text-dim"><span>{intelReport.totalMatches} match(es) · feed date {intelReport.dateReleased || 'not supplied'}</span><button onClick={() => saveJSON(intelReport, 'cyberamour-cisa-kev-results.json')} className="text-primary flex items-center gap-1"><Download size={13}/> Export JSON</button></div>{intelReport.results.map((item: any) => <div key={item.cveID} className="rounded-lg border border-border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><a className="font-bold text-primary underline" href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(item.cveID)}`} target="_blank" rel="noreferrer">{item.cveID} <ExternalLink size={11} className="inline"/></a><span className="text-[10px] text-text-dim">Due {item.dueDate || 'not listed'}</span></div><p className="text-sm mt-1">{item.vulnerabilityName || 'Known exploited vulnerability'}</p><p className="text-xs text-text-dim mt-1">{item.vendorProject} · {item.product}</p><p className="text-xs text-text-dim mt-1">{item.shortDescription}</p></div>)}</div>}
    </div>}

    <div className="border-t border-border pt-4"><h3 className="font-bold text-sm mb-3">Compatible open-source projects and services</h3><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">{OPEN_TOOLS.map(tool => <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer" className="rounded-xl border border-border p-3 hover:border-primary/50 transition-colors"><div className="flex justify-between gap-2"><strong className="text-sm">{tool.name}</strong><ExternalLink size={13} className="text-text-dim shrink-0"/></div><p className="text-xs text-text-dim mt-1">{tool.role}</p></a>)}</div><p className="mt-3 text-xs text-text-dim">Tools and rules may have different licenses and usage conditions. For commercial deployment, verify each license and data-provider terms. Splunk forwarding is optional and sends only scan/capture summaries, not raw file contents or packet payloads.</p></div>
  </section>;
}
