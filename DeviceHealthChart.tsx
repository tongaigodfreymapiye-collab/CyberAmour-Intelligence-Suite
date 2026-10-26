import React, { useState, useEffect, useRef } from 'react';
import { Activity, HardDrive, Zap, Thermometer, Wind, Loader2, Trash2, XCircle, AlertTriangle, Download, Printer, Settings, X, FileJson, FileText, Database } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Toaster, toast } from 'react-hot-toast';
import { 
  LineChart, 
  Line as RechartsLine, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function DeviceHealthChart({ logActivity, createAlert, scoreHistory, optimizePhone }: { logActivity?: (action: string, metadata?: any) => void, createAlert?: (title: string, message: string, severity: string) => void, scoreHistory?: any[], optimizePhone?: () => Promise<string> }) {
  const [processingMode, setProcessingMode] = useState<'light'|'heavy'>('light');
  const [batteryAlertSent, setBatteryAlertSent] = useState(false);
  const hardwareAlertSentRef = useRef(false);
  const [viewMode, setViewMode] = useState<'realtime' | 'historical'>('realtime');

  const [data, setData] = useState(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      time: i,
      cpu: Math.random() * 20 + 10,
      ram: Math.random() * 10 + 40,
      temp: Math.random() * 5 + 40,
      fan: Math.random() * 200 + 1200
    }));
  });

  const [disk, setDisk] = useState({ used: 45, free: 55 });
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [battery, setBattery] = useState({ level: 86, isCharging: false });

  const [refreshRate, setRefreshRate] = useState(1);
  const [animationsPaused, setAnimationsPaused] = useState(false);

  // Use refs for the latest value to avoid closure hell in setInterval
  const modeRef = useRef(processingMode);
  
  useEffect(() => {
    if (battery.level < 20 && !batteryAlertSent) {
      createAlert?.('Low Battery Warning', 'Battery level has dropped below 20%. Consider switching to Light Mode.', 'high');
      setBatteryAlertSent(true);
    } else if (battery.level >= 20) {
      if (batteryAlertSent) {
        setBatteryAlertSent(false);
      }
    }
  }, [battery.level, batteryAlertSent]);
  modeRef.current = processingMode;

  useEffect(() => {
    if (animationsPaused) return;

    const interval = setInterval(() => {
      setData(prev => {
        const next = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        const mode = modeRef.current;

        const targetCpu = mode === 'heavy' ? 85 : 20;
        const targetTemp = mode === 'heavy' ? 80 : 45;
        const targetFan = mode === 'heavy' ? 4500 : 1500;
        
        const nextCpu = last.cpu + (targetCpu - last.cpu) * 0.2 + (Math.random() * 10 - 5);
        const nextTemp = last.temp + (targetTemp - last.temp) * 0.1 + (Math.random() * 4 - 2);
        const nextFan = last.fan + (targetFan - last.fan) * 0.15 + (Math.random() * 100 - 50);

        next.push({
          time: last.time + 1,
          cpu: Math.min(100, Math.max(0, nextCpu)),
          ram: Math.min(100, Math.max(0, last.ram + (Math.random() * 4 - 2))),
          temp: Math.min(120, Math.max(30, nextTemp)),
          fan: Math.min(6000, Math.max(800, nextFan))
        });
        return next;
      });

      if (modeRef.current === 'heavy') {
         setBattery(prev => ({ ...prev, level: Math.max(0, prev.level - 0.25) }));
      }
    }, refreshRate * 1000);
    return () => clearInterval(interval);
  }, [refreshRate, animationsPaused]);

  const handleOptimizeDisk = () => {
    if (optimizing) return;
    setOptimizing(true);
    setOptimizationProgress(0);

    const progInterval = setInterval(() => {
      setOptimizationProgress(p => {
        if (p >= 100) {
          clearInterval(progInterval);
          return 100;
        }
        return p + 10;
      });
    }, 200);
    
    setTimeout(() => {
      setDisk(prev => {
        const newUsed = Math.max(10, prev.used - Math.floor(Math.random() * 10 + 5));
        return { used: newUsed, free: 100 - newUsed };
      });
      setOptimizing(false);
      setOptimizationProgress(0);
      clearInterval(progInterval);
      logActivity?.('disk_optimized', { savedSpace: 'System temp and cache cleared' });
    }, 2000);
  };

  const [closingApps, setClosingApps] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const handleCloseApps = () => {
    if (closingApps || viewMode === 'historical') return;
    setClosingApps(true);
    setTimeout(() => {
      setData(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        last.ram = Math.max(20, last.ram - 40);
        return next;
      });
      setClosingApps(false);
      logActivity?.('high_memory_apps_closed', { savedMemory: '1.2 GB' });
      createAlert?.('High-Memory Apps Closed', 'Freed up 1.2 GB of RAM.', 'success');
    }, 1500);
  };

  const handleClearCache = () => {
    if (clearingCache || viewMode === 'historical') return;
    setClearingCache(true);
    setTimeout(() => {
      setData(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        last.cpu = Math.max(10, last.cpu - 30);
        return next;
      });
      setClearingCache(false);
      logActivity?.('cache_cleared', { target: 'CPU overhead' });
      createAlert?.('Cache Cleared', 'Freed CPU resources by clearing system cache.', 'success');
    }, 1500);
  };

  const handleModeToggle = (mode: 'light' | 'heavy') => {
    setProcessingMode(mode);
    logActivity?.('processing_mode_changed', { mode });
  };

  const totalDiskSpaceGB = 512;
  const diskUsedGB = Math.round((disk.used / 100) * totalDiskSpaceGB);
  const diskFreeGB = Math.round((disk.free / 100) * totalDiskSpaceGB);

  const historicalData = (scoreHistory || []).map((entry: any) => {
    const usage = 100 - (entry.score || 80);
    return {
      time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) as any,
      cpu: Math.max(10, Math.min(100, usage + (Math.random() * 20 - 10))),
      ram: Math.max(20, Math.min(100, (usage * 0.8) + 20)),
      temp: 40 + (usage * 0.4),
      fan: 1500 + (usage * 30)
    };
  });

  const chartData = viewMode === 'historical' && historicalData.length > 0 ? historicalData : data;
  const currentData = chartData[chartData.length - 1] || data[data.length - 1];

  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'txt' | 'csv' | 'json'>('txt');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [autoExportInterval, setAutoExportInterval] = useState('none');
  const [cloudStorageLocation, setCloudStorageLocation] = useState('');
  const [showGlobalOverlay, setShowGlobalOverlay] = useState(false);

  useEffect(() => {
    // Generate color based on cpu usage (could be simplified but let's just make it general 'sys' color)
    const current = data[data.length - 1];
    let color = 'bg-success';
    if (current) {
        if (current.cpu > 80 || current.temp > 80) color = 'bg-danger';
        else if (current.cpu > 50 || current.temp > 60) color = 'bg-[#F59E0B]';
        
        if (current.cpu > 85 || current.temp > 85) {
          if (!hardwareAlertSentRef.current) {
            hardwareAlertSentRef.current = true;
            createAlert?.('Hardware Alert', 'CPU or Temperature exceeded 85%!', 'critical');
            if ("Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification("Hardware Alert", { body: "CPU or Temperature exceeded 85%!" });
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") {
                    new Notification("Hardware Alert", { body: "CPU or Temperature exceeded 85%!" });
                  }
                });
              }
            } else {
              toast.error("Hardware Alert: CPU or Temperature exceeded 85%!");
            }
          }
        } else if (current.cpu <= 80 && current.temp <= 80) {
          if (hardwareAlertSentRef.current) {
            hardwareAlertSentRef.current = false;
          }
        }
    }

    if (showGlobalOverlay) {
        window.dispatchEvent(new CustomEvent('updateGlobalHardwareDot', { detail: { show: true, color } }));
    } else {
        window.dispatchEvent(new CustomEvent('updateGlobalHardwareDot', { detail: { show: false, color: '' } }));
    }
  }, [showGlobalOverlay, data]);

  const [systemOptimizing, setSystemOptimizing] = useState(false);
  const handleOptimizeSystem = async () => {
    if (systemOptimizing) return;
    setSystemOptimizing(true);
    createAlert?.('Optimization Started', 'Clearing system junk and cache...', 'info');
    
    if (optimizePhone) {
      await optimizePhone();
    } else {
      // Fallback
      await new Promise(r => setTimeout(r, 2000));
    }
    
    logActivity?.('system_optimized', { detail: 'Cleared system junk and cache' });
    createAlert?.('Optimization Complete', 'System junk and cache cleared successfully.', 'success');
    setSystemOptimizing(false);
  };

  const handleExportDiagnostics = async () => {
    setExporting(true);
    createAlert?.('Export in Progress', 'Generating diagnostics files...', 'info');

    const exportPromise = new Promise(async (resolve, reject) => {
      try {
        // Simulate processing time to allow the progress indicator to show
        await new Promise(r => setTimeout(r, 1200));

        const current = chartData[chartData.length - 1] || data[data.length - 1];
        
        let content = '';
        let formatExt = exportFormat;
        let mimeType = 'text/plain';

        if (exportFormat === 'json') {
          content = JSON.stringify({
            date: new Date().toLocaleString(),
            cpu: Math.round(current.cpu),
            ram: Math.round(current.ram),
            temp: Math.round(current.temp),
            fan: Math.round(current.fan),
            battery: { level: Math.round(battery.level * 100), health: "Good" },
            disk: { total: totalDiskSpaceGB, used: diskUsedGB, free: diskFreeGB }
          }, null, 2);
          mimeType = 'application/json';
        } else if (exportFormat === 'csv') {
          content = `Metric,Value\nDate,${new Date().toLocaleString()}\nCPU,${Math.round(current.cpu)}\nRAM,${Math.round(current.ram)}\nTemp,${Math.round(current.temp)}\nFan,${Math.round(current.fan)}\nBattery Level,${Math.round(battery.level * 100)}\nBattery Health,Good\nDisk Total,${totalDiskSpaceGB}\nDisk Used,${diskUsedGB}\nDisk Free,${diskFreeGB}`;
          mimeType = 'text/csv';
        } else {
          content = `Hardware Diagnostics Summary\nDate: ${new Date().toLocaleString()}\n\nCPU Usage: ${Math.round(current.cpu)}%\nRAM Usage: ${Math.round(current.ram)}%\nTemperature: ${Math.round(current.temp)}°C\nFan Speed: ${Math.round(current.fan)} RPM\n\nBattery Level: ${Math.round(battery.level * 100)}%\nBattery Health: Good\n\nDisk Total Space: ${totalDiskSpaceGB} GB\nDisk Used Space: ${diskUsedGB} GB\nDisk Free Space: ${diskFreeGB} GB\n`;
        }

        const blob = new Blob([content], { type: mimeType });
        const docUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = docUrl;
        a.download = `hardware_diagnostics.${formatExt}`;
        a.click();
        URL.revokeObjectURL(docUrl);

        // Export as PDF (always)
        const doc = new jsPDF();
        doc.text(content, 10, 10);
        doc.save('hardware_diagnostics.pdf');

        logActivity?.('exported_diagnostics', { format: `${formatExt} and pdf` });
        createAlert?.('Diagnostics Exported', `Hardware diagnostics downloaded as ${formatExt.toUpperCase()} and PDF.`, 'success');
        setShowExportModal(false);
        resolve("Export successful");
      } catch (err) {
        console.error(err);
        createAlert?.('Export Failed', 'An error occurred during export.', 'error');
        reject(err);
      } finally {
        setExporting(false);
      }
    });

    toast.promise(exportPromise, {
      loading: 'Preparing hardware stats for export...',
      success: 'Export successful!',
      error: 'Failed to export.',
    });
  };

  const handleQuickPrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const current = chartData[chartData.length - 1] || data[data.length - 1];
      printWindow.document.write(`
        <html>
          <head>
            <title>Hardware Diagnostics - CyberAmour</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #111; background: #fff; margin: 0; }
              .header { border-bottom: 2px solid #8B5CF6; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
              .branding { color: #8B5CF6; font-size: 24px; font-weight: bold; letter-spacing: 1px; }
              .title { font-size: 18px; color: #555; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
              th { background-color: #f9f9f9; color: #333; font-weight: bold; }
              .section-title { font-size: 16px; font-weight: bold; color: #333; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
              .footer { margin-top: 40px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
              
              @media print {
                body { padding: 0; }
                .header { border-bottom: 2px solid #8B5CF6 !important; }
                th { background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="branding">CyberAmour</div>
              <div class="title">Hardware Diagnostics Summary</div>
            </div>
            
            <table>
              <tr>
                <th>Detail</th>
                <th>Value</th>
              </tr>
              <tr>
                <td><b>Date & Time</b></td>
                <td>${new Date().toLocaleString()}</td>
              </tr>
            </table>

            <div class="section-title">Core Performance</div>
            <table>
              <tr>
                <th>Component</th>
                <th>Status / Usage</th>
              </tr>
              <tr>
                <td>CPU Usage</td>
                <td>${Math.round(current.cpu)}%</td>
              </tr>
              <tr>
                <td>RAM Usage</td>
                <td>${Math.round(current.ram)}%</td>
              </tr>
              <tr>
                <td>Temperature</td>
                <td>${Math.round(current.temp)}&deg;C</td>
              </tr>
              <tr>
                <td>Fan Speed</td>
                <td>${Math.round(current.fan)} RPM</td>
              </tr>
            </table>

            <div class="section-title">Power & Storage</div>
            <table>
              <tr>
                <th>Component</th>
                <th>Status / Usage</th>
              </tr>
              <tr>
                <td>Battery Level</td>
                <td>${Math.round(battery.level * 100)}%</td>
              </tr>
              <tr>
                <td>Battery Health</td>
                <td>Good</td>
              </tr>
              <tr>
                <td>Disk Space Total</td>
                <td>${totalDiskSpaceGB} GB</td>
              </tr>
              <tr>
                <td>Disk Space Used</td>
                <td>${diskUsedGB} GB</td>
              </tr>
              <tr>
                <td>Disk Space Free</td>
                <td>${diskFreeGB} GB</td>
              </tr>
            </table>
            
            <div class="footer">
              Generated securely by CyberAmour Systems
            </div>

            <script>
              window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      logActivity?.('quick_print', { status: 'success' });
    }
  };

  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    createAlert?.('PDF Generation Started', 'Generating CyberAmour hardware report...', 'info');

    const pdfPromise = new Promise(async (resolve, reject) => {
      try {
        await new Promise(r => setTimeout(r, 1200));

        const current = chartData[chartData.length - 1] || data[data.length - 1];
        
        const doc = new jsPDF();
        
        // Add CyberAmour branding
        doc.setFontSize(22);
        doc.setTextColor(139, 92, 246); // Primary purple
        doc.text("CyberAmour", 14, 20);
        
        doc.setFontSize(16);
        doc.setTextColor(50, 50, 50);
        doc.text("Hardware Diagnostics Report", 14, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);
        
        doc.line(14, 42, 196, 42); // Header line
        
        // Target metrics
        doc.setFontSize(14);
        doc.setTextColor(20, 20, 20);
        doc.text("Key Metrics", 14, 52);
        
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        
        // CPU Temperature
        doc.text(`CPU Temperature:`, 14, 62);
        doc.text(`${Math.round(current.temp)}°C`, 70, 62);
        
        // Fan Speed
        doc.text(`Fan Speed:`, 14, 72);
        doc.text(`${Math.round(current.fan)} RPM`, 70, 72);
        
        // Disk Usage
        doc.text(`Disk Space Used:`, 14, 82);
        doc.text(`${diskUsedGB} GB of ${totalDiskSpaceGB} GB`, 70, 82);

        // Disk Free
        doc.text(`Disk Space Free:`, 14, 92);
        doc.text(`${diskFreeGB} GB`, 70, 92);
        
        doc.save('CyberAmour_Hardware_Report.pdf');
        
        createAlert?.('PDF Generated', 'Hardware diagnostics PDF has been downloaded.', 'success');
        logActivity?.('exported_pdf', { format: 'pdf' });
        resolve("PDF Generated");
      } catch (error) {
        console.error(error);
        createAlert?.('Export Failed', 'An error occurred during PDF generation.', 'error');
        reject(error);
      } finally {
        setGeneratingPDF(false);
      }
    });

    toast.promise(pdfPromise, {
      loading: 'Preparing PDF Report...',
      success: 'PDF downloaded!',
      error: 'Failed to generate PDF.',
    });
  };

  const saveSettings = () => {
    setShowSettingsModal(false);
    logActivity?.('updated_auto_export_settings', { interval: autoExportInterval, location: cloudStorageLocation });
    createAlert?.('Settings Saved', 'Auto-export configuration updated successfully.', 'success');
  };

  return (
    <div id="HardwareHealthSection" className="glass-card p-6 space-y-6 relative">
      <Toaster position="top-right" />
      {/* Export Modal */}
      {showExportModal && (
        <div className="absolute top-16 right-6 z-50 bg-[#1E293B] border border-border rounded-xl shadow-2xl p-4 w-72">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold">Export Format</h4>
            <button onClick={() => setShowExportModal(false)} className="text-text-dim hover:text-white"><X size={16} /></button>
          </div>
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-3 p-2 rounded relative bg-surface/50 cursor-pointer">
              <input type="radio" name="exportFormat" value="txt" checked={exportFormat === 'txt'} onChange={(e) => setExportFormat(e.target.value as any)} className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                 <span className="text-sm font-bold">TXT</span>
                 <span className="text-[10px] text-text-dim">Standard text layout</span>
              </div>
            </label>
            <label className="flex items-center gap-3 p-2 rounded relative bg-surface/50 cursor-pointer">
              <input type="radio" name="exportFormat" value="csv" checked={exportFormat === 'csv'} onChange={(e) => setExportFormat(e.target.value as any)} className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                 <span className="text-sm font-bold">CSV</span>
                 <span className="text-[10px] text-text-dim">Spreadsheet layout</span>
              </div>
            </label>
            <label className="flex items-center gap-3 p-2 rounded relative bg-surface/50 cursor-pointer">
              <input type="radio" name="exportFormat" value="json" checked={exportFormat === 'json'} onChange={(e) => setExportFormat(e.target.value as any)} className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                 <span className="text-sm font-bold">JSON</span>
                 <span className="text-[10px] text-text-dim">Developer layout</span>
              </div>
            </label>
          </div>
          <button
            onClick={handleExportDiagnostics}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="absolute top-16 right-6 z-50 bg-[#1E293B] border border-border rounded-xl shadow-2xl p-4 w-72">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold flex items-center gap-2"><Settings size={16} /> Auto-Export</h4>
            <button onClick={() => setShowSettingsModal(false)} className="text-text-dim hover:text-white"><X size={16} /></button>
          </div>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-xs text-text-dim mb-1">Interval</label>
              <select value={autoExportInterval} onChange={(e) => setAutoExportInterval(e.target.value)} className="w-full bg-surface border border-border rounded-lg p-2 text-sm">
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-dim mb-1">Cloud Storage Location</label>
              <input type="text" value={cloudStorageLocation} onChange={(e) => setCloudStorageLocation(e.target.value)} placeholder="s3://backup-bucket" className="w-full bg-surface border border-border rounded-lg p-2 text-sm" />
            </div>
            <label className="flex items-center gap-3 p-2 rounded relative bg-surface/50 cursor-pointer mb-2 border border-border/50">
              <input 
                type="checkbox" 
                checked={animationsPaused} 
                onChange={(e) => setAnimationsPaused(e.target.checked)} 
                className="w-4 h-4 text-primary rounded" 
              />
              <div className="flex flex-col">
                 <span className="text-sm font-bold">Pause Animations</span>
                 <span className="text-[10px] text-text-dim">Stop real-time data updates</span>
              </div>
            </label>
          </div>
          <button
            onClick={saveSettings}
            className="w-full py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-success/90 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="text-primary" size={24} />
          <h3 className="text-xl font-bold">Hardware Health Monitoring</h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(!showSettingsModal)}
              className="flex items-center gap-2 px-2 py-1.5 bg-surface/50 border border-border rounded-lg text-xs font-bold hover:bg-white/5 transition-colors text-text-dim"
              title="Auto-Export Settings"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={handleOptimizeSystem}
              disabled={systemOptimizing}
              className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg text-xs font-bold hover:bg-success/20 transition-colors text-success disabled:opacity-50"
            >
              {systemOptimizing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              Optimize Now
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface/50 border border-border rounded-lg text-xs font-bold hover:bg-white/5 transition-colors text-text-main"
            >
              {generatingPDF ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Generate PDF
            </button>
            <button
              onClick={handleQuickPrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface/50 border border-border rounded-lg text-xs font-bold hover:bg-white/5 transition-colors text-text-main"
            >
              <Printer size={14} />
              Quick Print
            </button>
            <button
              onClick={() => setShowExportModal(!showExportModal)}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface/50 border border-border rounded-lg text-xs font-bold hover:bg-white/5 transition-colors text-text-main"
            >
              <Download size={14} />
              Export Diagnostics
            </button>
          </div>
          <div className="flex items-center p-1 bg-surface/50 border border-border rounded-xl">
            <button 
              onClick={() => setViewMode('realtime')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'realtime' ? 'bg-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
            >
              Real-Time
            </button>
            <button 
              onClick={() => setViewMode('historical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'historical' ? 'bg-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
            >
              Historical (24h)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Global Dot</span>
            <button
               onClick={() => setShowGlobalOverlay(!showGlobalOverlay)}
               className={`w-10 h-5 rounded-full relative transition-colors ${showGlobalOverlay ? "bg-primary" : "bg-surface border border-border"}`}
            >
               <div className={`w-3 h-3 bg-white rounded-full absolute top-[3px] transition-all ${showGlobalOverlay ? "left-6 bg-white" : "left-1 bg-text-dim"}`} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Refresh Interval</span>
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              disabled={viewMode === 'historical'}
              className="bg-surface/50 border border-border rounded-lg px-2 py-1.5 text-xs font-bold text-text-main outline-none focus:border-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              <option value={1}>1s</option>
              <option value={3}>3s</option>
              <option value={5}>5s</option>
            </select>
          </div>
          <div className="flex items-center p-1 bg-surface/50 border border-border rounded-xl">
          <button 
            onClick={() => handleModeToggle('light')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${processingMode === 'light' ? 'bg-[#00C853] text-black shadow-[0_0_10px_rgba(0,200,83,0.3)]' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
          >
            Light Mode
          </button>
          <button 
            onClick={() => handleModeToggle('heavy')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${processingMode === 'heavy' ? 'bg-[#FF3B30] text-white shadow-[0_0_10px_rgba(255,59,48,0.3)]' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
          >
            Heavy Mode
          </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: CPU & RAM */}
        <div className="space-y-2 bg-surface/30 p-4 rounded-xl border border-border/50">
          <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-text-dim flex-wrap gap-2">
            <span>CPU & RAM Usage {viewMode === 'historical' && <span className="text-secondary ml-2">(Historical)</span>}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCloseApps}
                disabled={closingApps || viewMode === 'historical'}
                className="text-[10px] px-2 py-1 bg-surface border border-accent rounded text-accent hover:bg-accent/10 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {closingApps ? <Loader2 size={10} className="animate-spin" /> : <XCircle size={10} />}
                Close High-Memory Apps
              </button>
              <button
                onClick={handleClearCache}
                disabled={clearingCache || viewMode === 'historical'}
                className="text-[10px] px-2 py-1 bg-surface border border-accent rounded text-accent hover:bg-accent/10 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {clearingCache ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                Clear Cache
              </button>
              <span className={currentData.cpu > 80 ? "text-[#FF3B30] ml-2" : "text-primary ml-2"}>{Math.round(currentData.cpu)}% CPU</span>
            </div>
          </div>
          <div className="h-[180px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" hide={viewMode !== 'historical'} stroke="rgba(255, 255, 255, 0.3)" fontSize={10} tickMargin={8} />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E1228', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#FFFFFF', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  labelFormatter={viewMode === 'historical' ? undefined : () => ''}
                  formatter={(value: number, name: string) => {
                    const isBreached = name === 'CPU Usage' && value > 85;
                    if (isBreached) {
                      return [
                        <span className="text-danger font-bold flex items-center gap-1">
                          {value.toFixed(1)}% <AlertTriangle size={12} /> Alert
                        </span>,
                        <span className="text-danger font-bold">{name}</span>
                      ];
                    }
                    return [`${value.toFixed(1)}%`, name];
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <RechartsLine type="monotone" dataKey="cpu" name="CPU Usage" stroke={currentData.cpu > 85 ? "#FF2A2A" : "#00E5FF"} strokeWidth={currentData.cpu > 85 ? 3 : 2} style={{ filter: currentData.cpu > 85 ? 'drop-shadow(0px 0px 8px rgba(255,42,42,0.8))' : 'none', transition: 'all 0.3s ease' }} dot={viewMode === 'historical'} isAnimationActive={false} />
                <RechartsLine type="monotone" dataKey="ram" name="RAM Usage" stroke="#8B5CF6" strokeWidth={2} dot={viewMode === 'historical'} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: CPU Temperature & Fan Speed */}
        <div className={`space-y-2 bg-surface/30 p-4 rounded-xl border ${currentData.temp > 90 ? 'border-danger/50 shadow-[0_0_15px_rgba(255,59,48,0.2)]' : 'border-border/50'}`}>
          <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-text-dim flex-wrap gap-2">
            <div className="flex gap-4 items-center">
              <span className="flex items-center gap-1"><Thermometer size={14}/> Temp</span>
              <span className="flex items-center gap-1"><Wind size={14}/> Fan</span>
              {currentData.temp > 90 && (
                <span className="text-danger flex items-center gap-1 animate-pulse ml-2 text-[10px] bg-danger/10 px-2 py-0.5 rounded">
                  <AlertTriangle size={12} /> CRITICAL
                </span>
              )}
            </div>
            <span className={currentData.temp > 90 ? "text-danger animate-pulse" : currentData.temp > 75 ? "text-[#FF3B30]" : "text-[#FF9500]"}>
              {Math.round(currentData.temp)}°C / {Math.round(currentData.fan)} RPM
            </span>
          </div>
          <div className="h-[180px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" hide={viewMode !== 'historical'} stroke="rgba(255, 255, 255, 0.3)" fontSize={10} tickMargin={8} />
                <YAxis yAxisId="left" domain={[20, 100]} stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 6000]} stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E1228', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#FFFFFF', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  labelFormatter={viewMode === 'historical' ? undefined : () => ''}
                  formatter={(value: number, name: string) => {
                    const isBreached = name === 'CPU Temperature' && value > 85;
                    if (isBreached) {
                      return [
                        <span className="text-danger font-bold flex items-center gap-1">
                          {value.toFixed(1)}°C <AlertTriangle size={12} /> Alert
                        </span>,
                        <span className="text-danger font-bold">{name}</span>
                      ];
                    }
                    return [name === 'CPU Temperature' ? `${value.toFixed(1)}°C` : `${value.toFixed(0)} RPM`, name];
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <RechartsLine yAxisId="left" type="monotone" dataKey="temp" name="CPU Temperature" stroke={currentData.temp > 85 ? "#FF2A2A" : "#FF9500"} strokeWidth={currentData.temp > 85 ? 3 : 2} style={{ filter: currentData.temp > 85 ? 'drop-shadow(0px 0px 8px rgba(255,42,42,0.8))' : 'none', transition: 'all 0.3s ease' }} dot={viewMode === 'historical'} isAnimationActive={false} />
                <RechartsLine yAxisId="right" type="stepAfter" dataKey="fan" name="Fan Speed" stroke="#3B82F6" strokeWidth={2} dot={viewMode === 'historical'} isAnimationActive={false} opacity={0.7} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
         {/* Disk Space */}
         <div className="space-y-4 flex flex-col items-center justify-center relative">
          <div className="flex w-full justify-between items-center mb-2">
             <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">Disk Space (Total: {totalDiskSpaceGB} GB)</h4>
             <button
               onClick={handleOptimizeDisk}
               disabled={optimizing}
               className="relative overflow-hidden px-3 py-1 bg-surface border border-accent rounded-lg text-[10px] font-bold text-accent hover:bg-accent/10 transition-colors flex items-center justify-center gap-1 disabled:opacity-80 min-w-[120px]"
             >
               {optimizing && (
                 <div className="absolute left-0 top-0 bottom-0 bg-accent/20 transition-all duration-200" style={{ width: `${optimizationProgress}%` }} />
               )}
               <span className="relative z-10 flex items-center gap-1">
                 {optimizing ? (
                   <><Loader2 size={12} className="animate-spin" /> {optimizationProgress}%</>
                 ) : (
                   <><HardDrive size={12} /> Optimize Disk</>
                 )}
               </span>
             </button>
          </div>
          <div className="h-[140px] w-full min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[{name: 'Used', value: diskUsedGB}, {name: 'Free', value: diskFreeGB}]} 
                  innerRadius={45} 
                  outerRadius={65} 
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={false}
                  stroke="none"
                >
                  <Cell fill="#FF3B30" />
                  <Cell fill="#00C853" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E1228', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#FFFFFF', fontSize: '12px' }}
                  formatter={(value: number) => [`${value} GB`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 text-xs font-bold w-full justify-center">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div> Used ({diskUsedGB} GB)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00C853]"></div> Free ({diskFreeGB} GB)</div>
          </div>
        </div>

        {/* Battery Health */}
        <div className="space-y-4 flex flex-col pt-2 relative md:pl-6 md:border-l md:border-border/50">
          <div className="flex w-full justify-between items-center mb-2">
             <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">Battery Health</h4>
             <Zap size={14} className="text-[#00C853]" />
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-8 rounded-lg border-2 border-border relative flex items-center p-0.5">
                <div className="w-1 h-3 bg-border absolute -right-1.5 rounded-r"></div>
                <div className={`h-full rounded flex-1 transition-all ${battery.level > 20 ? 'bg-[#00C853]' : 'bg-[#FF3B30]'}`} style={{ width: `${battery.level}%`, maxWidth: '100%' }}></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{Math.floor(battery.level)}%</span>
                <span className="text-[10px] text-[#00C853] uppercase tracking-wider font-bold">{battery.isCharging ? 'Charging' : 'Discharging'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:max-w-[280px]">
              <div className="bg-surface/50 rounded-xl p-3 border border-border">
                <div className="text-xs text-text-dim mb-1">Time Remaining</div>
                <div className="text-sm font-bold text-text-main">{Math.floor(battery.level * 5.5 / 60)}h {Math.floor(battery.level * 5.5 % 60)}m</div>
              </div>
              <div className="bg-surface/50 rounded-xl p-3 border border-border">
                <div className="text-xs text-text-dim mb-1">Power Draw</div>
                <div className="text-sm font-bold text-text-main">{processingMode === 'heavy' ? '24.5 W' : '4.2 W'}</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs lg:max-w-[280px]">
              <span className="text-text-dim">Battery Condition</span>
              <span className={processingMode === 'heavy' ? "text-[#FF9500] font-bold" : "text-[#00C853] font-bold"}>{processingMode === 'heavy' ? 'High Load' : 'Good'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
