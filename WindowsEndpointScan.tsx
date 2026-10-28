import React from 'react';
import LocalSecuritySensor from './LocalSecuritySensor';
export default function WindowsEndpointScan() {
  return <div className="max-w-6xl mx-auto space-y-6"><header><div className="text-xs uppercase tracking-[.2em] text-primary font-bold">Defensive endpoint inventory</div><h1 className="text-3xl font-black mt-2">Windows Endpoint Scan</h1><p className="text-text-dim mt-2 max-w-3xl">Start a Quick Scan or Full Scan on this Windows computer through the local sensor and Microsoft Defender. No reports or files need to be uploaded to the website.</p></header><LocalSecuritySensor mode="antivirus"/></div>;
}
