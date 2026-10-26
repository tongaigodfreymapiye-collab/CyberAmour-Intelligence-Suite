import React, { useState } from 'react';
import { AlertTriangle, BookOpen, Download, ExternalLink, FileSearch, Globe, LoaderCircle, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { functions, httpsCallable } from '../firebase';

type Finding = {
  category: string; subjectRole?: string; headline: string; summary: string; status: string; eventDate: string; publishedDate: string;
  sourceType: string; sourceUrl: string; sourceName: string; identityMatchConfidence: string;
  matchRationale: string; evidenceStrength: string; relevanceToPurpose: string; counterEvidenceOrStatus: string; recommendedVerification: string;
};
type Investigation = {
  investigatedAt: string; entityName: string; entityType: string; jurisdiction: string; purpose: string; requestedCategories?: string[];
  summary: string; riskAssessment: { level: string; rationale: string }; findings: Finding[];
  coverage: { categoriesSearched: string[]; queriesUsed: string[]; dataGaps: string[]; notSearched: string[] };
  limitations: string[]; suggestedNextSteps: string[]; sources: Array<{title:string;url:string}>; grounded: boolean;
};

const box = 'rounded-xl border border-border bg-bg/40 p-4';
const field = 'w-full rounded-xl border border-border bg-bg/70 px-3 py-2.5 text-sm text-text-main outline-none focus:border-primary';
const riskTone = (level: string) => level === 'High' ? 'border-red-400/40 bg-red-400/10 text-red-200' : level === 'Moderate' ? 'border-amber-400/40 bg-amber-400/10 text-amber-200' : level === 'Low' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-slate-400/30 bg-slate-400/10 text-slate-200';
const unique = (values: unknown[]) => Array.from(new Set(values.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)));

function downloadJSON(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function exportPDF(report: Investigation) {
  const pdf = new jsPDF();
  pdf.setFillColor(7, 19, 36); pdf.rect(0, 0, 210, 35, 'F');
  pdf.setTextColor(255, 255, 255); pdf.setFontSize(17); pdf.text('CYBERAMOUR | PUBLIC-RECORDS INVESTIGATION', 14, 16);
  pdf.setFontSize(8.5); pdf.text('Cyber Fortress Technologies · Evidence-led open-source review', 14, 26);
  pdf.setTextColor(25, 35, 50); pdf.setFontSize(12); pdf.text(`Subject: ${report.entityName}`, 14, 47);
  pdf.setFontSize(9.5); pdf.text(`Entity type: ${report.entityType}   |   Jurisdiction: ${report.jurisdiction}`, 14, 55);
  pdf.text(`Collected: ${new Date(report.investigatedAt).toLocaleString()}`, 14, 63);
  pdf.text(`Scope-bound risk relevance: ${report.riskAssessment?.level || 'Insufficient evidence'}`, 14, 71);
  pdf.setFontSize(9); pdf.text(pdf.splitTextToSize(`Purpose: ${report.purpose}`, 180), 14, 80);
  let y = 92;
  const summaryLines = pdf.splitTextToSize(`Executive summary: ${report.summary || 'No summary returned.'}`, 180);
  pdf.text(summaryLines, 14, y); y += summaryLines.length * 4.5 + 4;
  const rationaleLines = pdf.splitTextToSize(`Risk rationale: ${report.riskAssessment?.rationale || 'Insufficient evidence to assign a risk level.'}`, 180);
  pdf.text(rationaleLines, 14, y); y += rationaleLines.length * 4.5 + 6;
  autoTable(pdf, { startY: y, head: [['Category / headline', 'Case status', 'Dates', 'Identity match', 'Evidence strength', 'Source']], body: (report.findings || []).map(f => [`${f.category}\n${f.headline}\n${f.summary}`, `${f.status}\nSubject role: ${f.subjectRole || 'Unclear'}`, `Event: ${f.eventDate}\nPublished: ${f.publishedDate}`, `${f.identityMatchConfidence}\n${f.matchRationale}`, f.evidenceStrength, `${f.sourceName}\n${f.sourceUrl}`]), styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' }, headStyles: { fillColor: [11, 87, 112] }, columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 }, 3: { cellWidth: 27 }, 4: { cellWidth: 23 }, 5: { cellWidth: 38 } }, didDrawPage: () => { pdf.setFontSize(7); pdf.setTextColor(100); pdf.text(`CyberAmour · ${report.entityName} · Public-source research only`, 14, 290); } });
  pdf.addPage(); pdf.setTextColor(25, 35, 50); pdf.setFontSize(13); pdf.text('Coverage, verification and limitations', 14, 18);
  pdf.setFontSize(9); let py = 28;
  const sections: Array<[string,string[]]> = [
    ['Requested investigation categories', report.requestedCategories || []],
    ['Categories searched by AI provider', report.coverage?.categoriesSearched || []],
    ['Search queries returned by provider', report.coverage?.queriesUsed || []],
    ['Data gaps', report.coverage?.dataGaps || []],
    ['Not searched / unavailable sources', report.coverage?.notSearched || []],
    ['Recommended next steps', report.suggestedNextSteps || []],
    ['Limitations', report.limitations || []],
  ];
  for (const [heading, lines] of sections) {
    if (py > 265) { pdf.addPage(); py = 18; }
    pdf.setFontSize(10); pdf.text(heading, 14, py); py += 5; pdf.setFontSize(8.5);
    const content = lines.length ? lines : ['None returned.'];
    for (const item of content.slice(0, 20)) {
      const split = pdf.splitTextToSize(`• ${String(item)}`, 180);
      if (py + split.length * 4.2 > 280) { pdf.addPage(); py = 18; }
      pdf.text(split, 16, py); py += split.length * 4.2 + 1.5;
    }
    py += 3;
  }
  pdf.setFontSize(8); pdf.text(pdf.splitTextToSize('This report covers only public-source results returned by the provider; it is not exhaustive. Allegations and charges are not findings of guilt. Verify original records, identity matches and outcomes. Where selected, intimate-image abuse is covered only through non-graphic public reporting and legal proceedings—never image files or direct media links. Any publicly disclosed marital-status facts are context only and are not scored adversely. Documented conduct is evaluated for source quality, procedural status and relevance to the stated purpose; no general moral-character, fidelity or personality score is produced.', 180), 14, Math.min(py + 4, 280));
  pdf.save(`CyberAmour-Public-Records-${report.entityName.replace(/[^a-z0-9_-]+/gi, '-').slice(0,60)}.pdf`);
}

export default function PublicRecordsInvestigation() {
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<'Individual' | 'Company / organisation'>('Individual');
  const [jurisdiction, setJurisdiction] = useState('');
  const [context, setContext] = useState('');
  const [purpose, setPurpose] = useState('');
  const [includePublicSocial, setIncludePublicSocial] = useState(true);
  const [includePublicImageAbuseReporting, setIncludePublicImageAbuseReporting] = useState(false);
  const [includePublicMaritalStatus, setIncludePublicMaritalStatus] = useState(false);
  const [includeIntegrityConduct, setIncludeIntegrityConduct] = useState(true);
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Investigation | null>(null);

  const runInvestigation = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setReport(null);
    if (purpose.trim().length < 10) { setError('Enter a specific lawful investigation purpose (at least 10 characters).'); return; }
    if (!authorizationConfirmed) { setError('Confirm the lawful-purpose and public-source-only acknowledgement before running the search.'); return; }
    setLoading(true);
    try {
      const call = httpsCallable(functions, 'investigatePublicRecords', { timeout: 90000 });
      const result: any = await call({ entityName: entityName.trim(), entityType, jurisdiction: jurisdiction.trim(), disambiguatingContext: context.trim(), purpose: purpose.trim(), includePublicSocial, includePublicImageAbuseReporting, includePublicMaritalStatus, includeIntegrityConduct, authorizationConfirmed });
      setReport(result.data as Investigation);
    } catch (e: any) {
      const code = e?.code || '';
      setError(code.includes('permission-denied') ? 'This feature requires a verified Premium / Forensics entitlement. Confirm the account subscription, then deploy the updated Cloud Functions.' : e?.message || 'The public-source investigation could not be completed. No result has been fabricated.');
    } finally { setLoading(false); }
  };

  return <section className="glass-card space-y-5 p-5 md:p-6 xl:col-span-2" aria-label="Public records forensic investigation">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3"><div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary"><FileSearch size={22}/></div><div><div className="text-xs font-bold uppercase tracking-[.2em] text-primary">Forensics · public-source research</div><h2 className="mt-1 text-xl font-bold">Public Records & Adverse-Media Investigation</h2><p className="mt-1 max-w-3xl text-sm text-text-dim">Search-grounded research across public news, official legal/regulatory records, business registers and (optionally) public social posts. Every finding must link to a source returned by the provider.</p></div></div>
      {report && <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${riskTone(report.riskAssessment?.level || 'Insufficient evidence')}`}>{report.riskAssessment?.level || 'Insufficient evidence'}</span>}
    </div>
    <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
      <form onSubmit={runInvestigation} className="space-y-4 rounded-2xl border border-border bg-bg/30 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-text-dim">Person or organisation name</span><input required minLength={2} maxLength={180} className={field} value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="Full name or registered entity"/></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-text-dim">Entity type</span><select className={field} value={entityType} onChange={e => setEntityType(e.target.value as any)}><option>Individual</option><option>Company / organisation</option></select></label>
        </div>
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-text-dim">Jurisdiction / country / relevant court system</span><input className={field} maxLength={100} value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="e.g. Zimbabwe, South Africa, Portugal"/></label>
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-text-dim">Disambiguation context (optional)</span><textarea className={field} rows={2} maxLength={700} value={context} onChange={e => setContext(e.target.value)} placeholder="Public role, organisation, industry or other non-sensitive context to reduce same-name errors"/></label>
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-text-dim">Lawful purpose and scope</span><textarea required minLength={10} maxLength={700} className={field} rows={3} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Supplier due diligence relating to documented public court/regulator and financial-misconduct records"/></label>
        <div className="rounded-xl border border-border bg-bg/40 p-3 space-y-3">
          <div><h3 className="text-sm font-bold">Investigation scope options</h3><p className="mt-1 text-xs text-text-dim">Select the public-information categories relevant to the stated lawful purpose. Every finding requires a source and identity check.</p></div>
          <label className="flex items-start gap-2 text-sm text-text-dim"><input type="checkbox" checked={includeIntegrityConduct} onChange={e => setIncludeIntegrityConduct(e.target.checked)} className="mt-1"/><span><strong className="text-text-main">Documented integrity / conduct evidence.</strong> Search relevant public fraud, theft, embezzlement, bribery, deceptive business dealings, fiduciary misconduct, official sanctions and court/regulator findings. Reports assess evidence quality and outcome, not a broad morality rating.</span></label>
          <label className="flex items-start gap-2 text-sm text-text-dim"><input type="checkbox" checked={includePublicImageAbuseReporting} onChange={e => setIncludePublicImageAbuseReporting(e.target.checked)} className="mt-1"/><span><strong className="text-text-main">Public reporting / court cases about non-consensual intimate-image publication.</strong> Search reputable news and official legal/regulatory reporting only. Never search for or link to image/video files, thumbnails, mirrors or leak-distribution pages. The report distinguishes alleged publisher/defendant from complainant/victim; victimisation is not adverse evidence.</span></label>
          <label className="flex items-start gap-2 text-sm text-text-dim"><input type="checkbox" checked={includePublicMaritalStatus} onChange={e => setIncludePublicMaritalStatus(e.target.checked)} className="mt-1"/><span><strong className="text-text-main">Publicly disclosed marital-status facts (context only).</strong> Include only facts publicly disclosed by the subject or stated in reputable public reporting/official proceedings, and only where relevant to this purpose. No private relationship details, fidelity allegations or intimate-life inference; these facts do not increase risk.</span></label>
          <label className="flex items-start gap-2 text-sm text-text-dim"><input type="checkbox" checked={includePublicSocial} onChange={e => setIncludePublicSocial(e.target.checked)} className="mt-1"/><span><strong className="text-text-main">Relevant public social-media posts.</strong> Include only when directly relevant to the stated purpose. Treat uncorroborated posts as claims, not facts.</span></label>
        </div>
        <label className="flex items-start gap-2 text-sm text-text-dim"><input type="checkbox" checked={authorizationConfirmed} onChange={e => setAuthorizationConfirmed(e.target.checked)} className="mt-1"/><span>I confirm this investigation has a lawful, specific purpose. I will verify original records, distinguish allegations from outcomes, not request private/intimate media, and not use this report for prohibited eligibility decisions.</span></label>
        {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">{loading ? <LoaderCircle size={16} className="animate-spin"/> : <Search size={16}/>} {loading ? 'Searching public sources…' : 'Run public-records investigation'}</button>
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-3 text-xs leading-relaxed text-amber-100">Scope safeguards: the selected intimate-image option covers public reporting and official proceedings only—never the media itself. Public marital-status information is limited to relevant, sourced facts and is never scored adversely. Documented conduct is reported with its evidence strength and legal status; CyberAmour does not create a general moral-character, fidelity or personality score. This search uses public indexed web results, not private databases, and is not exhaustive.</div>
      </form>
      <div className="space-y-4">
        {!report && !loading && <div className={`${box} flex min-h-48 flex-col items-center justify-center text-center`}><Globe size={30} className="text-primary"/><h3 className="mt-3 font-semibold">Evidence-backed findings will appear here</h3><p className="mt-2 max-w-lg text-sm text-text-dim">The report separates official records, reputable reporting and public claims; it records proceeding status, dates, identity-match confidence, direct source links, counter-evidence and data gaps.</p><p className="mt-2 text-xs text-text-dim">No search results are generated until you run an investigation.</p></div>}
        {loading && <div className={`${box} flex min-h-48 flex-col items-center justify-center text-center`}><LoaderCircle size={28} className="animate-spin text-primary"/><p className="mt-3 font-semibold">Researching indexed public sources…</p><p className="mt-1 text-xs text-text-dim">Searching is non-exhaustive. Official records and original case outcomes require analyst verification.</p></div>}
        {report && <>
          <div className={box}>
            <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs uppercase tracking-widest text-primary">Investigation result</div><h3 className="mt-1 text-lg font-bold">{report.entityName}</h3><p className="text-xs text-text-dim">{report.entityType} · {report.jurisdiction} · Collected {new Date(report.investigatedAt).toLocaleString()}</p></div><span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${riskTone(report.riskAssessment?.level || 'Insufficient evidence')}`}>{report.riskAssessment?.level || 'Insufficient evidence'}</span></div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{report.summary}</p>
            <p className="mt-3 text-sm text-text-dim"><strong>Risk rationale:</strong> {report.riskAssessment?.rationale || 'Insufficient evidence for a scope-bound risk level.'}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-lg bg-surface/50 p-3"><div className="text-xs text-text-dim">Source links</div><div className="mt-1 text-xl font-bold">{report.sources?.length || 0}</div></div><div className="rounded-lg bg-surface/50 p-3"><div className="text-xs text-text-dim">Source-linked findings</div><div className="mt-1 text-xl font-bold">{report.findings?.length || 0}</div></div><div className="rounded-lg bg-surface/50 p-3"><div className="text-xs text-text-dim">Grounded search</div><div className="mt-1 flex items-center gap-1 text-sm font-bold">{report.grounded ? <><ShieldCheck size={15} className="text-emerald-300"/> Sources returned</> : <><AlertTriangle size={15} className="text-amber-300"/> Not verified</>}</div></div></div>
          </div>
          <div className={box}>
            <div className="flex items-center justify-between gap-2"><h3 className="font-bold">Detailed findings</h3><span className="text-xs text-text-dim">{report.findings?.length || 0} item(s)</span></div>
            {!report.findings?.length && <p className="mt-3 text-sm text-text-dim">No source-linked findings were returned after evidence checks. This is not proof that no records exist. Review search coverage and consult the relevant official registries directly.</p>}
            <div className="mt-3 space-y-3">{(report.findings || []).map((f, index) => <article key={`${f.sourceUrl}-${index}`} className="rounded-xl border border-border bg-surface/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><span className="text-[10px] font-bold uppercase tracking-wider text-primary">{f.category}</span><h4 className="mt-1 font-semibold">{f.headline}</h4></div><span className="rounded-md border border-border px-2 py-1 text-[10px] font-semibold">{f.status}</span></div>
              {f.subjectRole && <p className="mt-2 text-xs text-text-dim"><strong>Subject role:</strong> {f.subjectRole}</p>}
              <p className="mt-2 text-sm leading-relaxed">{f.summary}</p>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><div><span className="text-text-dim">Event date:</span> {f.eventDate}</div><div><span className="text-text-dim">Publication date:</span> {f.publishedDate}</div><div><span className="text-text-dim">Identity match:</span> {f.identityMatchConfidence} — {f.matchRationale}</div><div><span className="text-text-dim">Evidence:</span> {f.evidenceStrength} ({f.sourceType})</div></div>
              {f.relevanceToPurpose && <p className="mt-2 text-xs text-text-dim"><strong>Relevance:</strong> {f.relevanceToPurpose}</p>}
              {f.counterEvidenceOrStatus && <p className="mt-2 text-xs text-text-dim"><strong>Case outcome / contrary information:</strong> {f.counterEvidenceOrStatus}</p>}
              {f.recommendedVerification && <p className="mt-2 text-xs text-text-dim"><strong>Verify next:</strong> {f.recommendedVerification}</p>}
              <a href={f.sourceUrl} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex items-center gap-1 break-all text-xs font-semibold text-primary underline">{f.sourceName || f.sourceUrl}<ExternalLink size={12}/></a>
            </article>)}</div>
          </div>
          <div className={box}>
            <h3 className="font-bold">Search coverage & gaps</h3>
            <div className="mt-3"><div className="text-xs font-semibold text-text-dim">Requested investigation categories</div><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{unique(report.requestedCategories || []).map(x => <li key={x}>{x}</li>)}</ul></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><div><div className="text-xs font-semibold text-text-dim">Categories reported by search provider</div><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{unique(report.coverage?.categoriesSearched || []).map(x => <li key={x}>{x}</li>)}</ul></div><div><div className="text-xs font-semibold text-text-dim">Data gaps</div><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{unique(report.coverage?.dataGaps || []).map(x => <li key={x}>{x}</li>)}</ul><div className="mt-3 text-xs font-semibold text-text-dim">Not searched / unavailable</div><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{unique(report.coverage?.notSearched || []).map(x => <li key={x}>{x}</li>)}</ul></div></div>
            {(report.coverage?.queriesUsed || []).length > 0 && <div className="mt-3"><div className="text-xs font-semibold text-text-dim">Grounding search queries</div><div className="mt-1 flex flex-wrap gap-2">{report.coverage.queriesUsed.map(q => <span key={q} className="rounded-lg border border-border px-2 py-1 text-xs">{q}</span>)}</div></div>}
          </div>
          <div className={box}>
            <h3 className="font-bold">Source links</h3>
            <div className="mt-2 space-y-2">{(report.sources || []).map((source, i) => <a key={`${source.url}-${i}`} href={source.url} target="_blank" rel="noreferrer noopener" className="block break-all rounded-lg border border-border p-3 text-sm text-primary hover:border-primary/50">{source.title}<span className="mt-1 block text-xs text-text-dim">{source.url}</span></a>)}</div>
            {(report.limitations || []).length > 0 && <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3"><h4 className="flex items-center gap-2 font-semibold"><AlertTriangle size={15}/> Limitations</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-text-dim">{report.limitations.map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}</ul></div>}
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => exportPDF(report)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-slate-950"><Download size={16}/> Download investigation PDF</button><button type="button" onClick={() => downloadJSON(report, 'cyberamour-public-records-investigation.json')} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"><Download size={16}/> Export JSON evidence</button></div>
        </>}
      </div>
    </div>
  </section>;
}
