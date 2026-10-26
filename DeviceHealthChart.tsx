import React from 'react';
import { Activity, ShieldAlert, HardDrive, Zap, Thermometer } from 'lucide-react';

/**
 * Honest device-health placeholder. A browser-only web app cannot read privileged
 * endpoint telemetry such as CPU/RAM sensors, fan speed, battery health, installed
 * applications, or filesystem state on every supported OS. Do not synthesize values.
 */
export function DeviceHealthChart({ scoreHistory }: { logActivity?: (action: string, metadata?: any) => void; createAlert?: (title: string, message: string, severity: string) => void; scoreHistory?: any[]; optimizePhone?: () => Promise<string> }) {
  const availableHistory = Array.isArray(scoreHistory) ? scoreHistory.filter(item => typeof item?.score === 'number' && item?.createdAt) : [];
  return <section className="glass-card p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Activity className="text-primary" size={22} />
      <div>
        <h3 className="text-lg font-bold">Device Health & Telemetry</h3>
        <p className="text-xs text-text-dim">Endpoint sensor status</p>
      </div>
      <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">No endpoint agent connected</span>
    </div>
    <p className="text-sm leading-6 text-text-dim">CyberAmour is running in a browser. This environment cannot reliably read system CPU load, memory usage, temperature, fan speed, battery health, installed applications, or disk usage across supported devices. No synthetic telemetry is displayed and no device optimization has been performed.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { icon: Zap, label: 'CPU load', value: 'Unavailable' },
        { icon: HardDrive, label: 'Memory / disk', value: 'Unavailable' },
        { icon: Thermometer, label: 'Temperature / fan', value: 'Unavailable' },
        { icon: ShieldAlert, label: 'Endpoint protection', value: 'Not verified' }
      ].map(item => <div key={item.label} className="rounded-xl border border-border bg-surface/30 p-4"><item.icon size={18} className="mb-3 text-text-dim"/><div className="text-xs text-text-dim">{item.label}</div><div className="mt-1 text-sm font-bold">{item.value}</div></div>)}
    </div>
    <div className="rounded-xl border border-border bg-bg/30 p-4 text-xs leading-5 text-text-dim">A signed Windows/macOS/Linux/Android endpoint agent and a secure telemetry backend are required for real device-health monitoring. Historical security scores are available below only when a recorded score exists.</div>
    {availableHistory.length > 0 && <div className="text-xs text-text-dim">Recorded score history available: {availableHistory.length} data point(s). This is not device hardware telemetry.</div>}
  </section>;
}
