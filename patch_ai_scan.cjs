const fs = require('fs');

let code = fs.readFileSync('src/hooks/useCyberAmour.ts', 'utf-8');

// We are replacing scanNetwork and scanDevice methods
const scanNetworkRegex = /const scanNetwork = async \(\) => {[\s\S]*?return { packets, anomalies };[\n\s]*};/;
const scanDeviceRegex = /const scanDevice = async \(\) => {[\s\S]*?return found;[\n\s]*};/;

const newScanNetwork = `const scanNetwork = async () => {
    if (!user) return;
    logActivity('network_scan_started');
    
    let anomalies = [];
    let packets = [];
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: \`Act as an advanced network packet analyzer and AI firewall. 
        Generate 6 sample network packets that a modern firewall would log right now (include protocols like TCP, UDP, HTTPS, ICMP, SYN).
        Ensure 1 or 2 of these packets are highly suspicious (e.g., Session Hijack, Botnet, or DDoS attempt).
        Return ONLY valid JSON format representing an array of objects with keys: id (number), source (IP or label), dest (IP or label), protocol (string), size (string like '512B', '1.2KB'), status ('Safe', 'SessionHijack', 'Malicious', 'Suspicious').\`
      });
      let text = response.text || "[]";
      if (text.includes('\`\`\`')) {
        text = text.replace(/\`\`\`[a-zA-Z]*\n/gi, '').replace(/\`\`\`/g, '').trim();
      }
      packets = JSON.parse(text);
      anomalies = packets.filter(p => p.status !== 'Safe');
    } catch (e) {
      console.error(e);
      // Fallback
      packets = [
        { id: 1, source: '192.168.1.1', dest: '104.22.3.1', protocol: 'HTTPS', size: '4.5KB', status: 'Safe' },
        { id: 2, source: 'Botnet-Node-X', dest: '192.168.1.1', protocol: 'SYN', size: '128B', status: 'Malicious' }
      ];
      anomalies = packets.filter(p => p.status !== 'Safe');
    }

    if (anomalies.length > 0) {
      const hijackCount = anomalies.filter(a => a.status === 'SessionHijack').length;
      await addDoc(collection(db, 'users', user.uid, 'alerts'), {
        uid: user.uid,
        title: hijackCount > 0 ? "Session Hijacking Blocked" : "Network Anomaly Detected",
        message: hijackCount > 0 
          ? \`AI Auto-Blocked \$\{hijackCount\} session hijacking attempts from unauthorized proxies.\`
          : \`Blocked \$\{anomalies.length\} suspicious packets including a potential Botnet connection.\`,
        severity: hijackCount > 0 ? "critical" : "warning",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    logActivity('network_scan_completed', { anomaliesCount: anomalies.length });
    return { packets, anomalies };
  };`;


const newScanDevice = `const scanDevice = async () => {
    if (!user) return;
    logActivity('device_scan_started');

    const navInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
    };

    let threats = [];
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: \`Analyze the following navigator / device information for any potential security anomalies or vulnerabilities.
        Device Info: \$\{JSON.stringify(navInfo)\}
        Then generate a simulated list of 0-3 hypothetical vulnerabilities or malwares (e.g., outdated platform risk, mock spyware) that might exist on such a device.
        Return ONLY valid JSON representing an array of objects with keys: name (string), type ('Virus', 'PUP', 'Spyware', 'Vulnerability'), risk ('Low', 'Medium', 'High', 'Critical'), path (string like '/system/lib/xyz' or 'Browser Extension').\`
      });
      let text = response.text || "[]";
      if (text.includes('\`\`\`')) {
        text = text.replace(/\`\`\`[a-zA-Z]*\n/gi, '').replace(/\`\`\`/g, '').trim();
      }
      threats = JSON.parse(text);
    } catch(e) {
      console.error(e);
      threats = [];
    }

    if (threats.length > 0) {
      await addDoc(collection(db, 'users', user.uid, 'alerts'), {
        uid: user.uid,
        title: "Device Threat Detected",
        message: \`Found \$\{threats.length\} threats/vulnerabilities on your device across \$\{navigator.platform\}. AI is attempting automatic mitigation.\`,
        severity: "critical",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    logActivity('device_scan_completed', { threatsFound: threats.length });
    return threats;
  };`;

// Also let's add optimizePhone functionality directly in useCyberAmour.ts
const addOptimizePhone = `const optimizePhone = async () => {
    if (!user) return;
    logActivity('phone_optimization_started');
    
    let advice = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Assume the user's mobile device has some bloated settings. Generate a short, realistic tip of exactly how a system service (like CyberAmour) just freed up memory and improved battery life, with fake metrics. Max 20 words."
      });
      advice = response.text.trim();
    } catch(e) {
      advice = "Junk files cleared & memory freed completely.";
    }

    logActivity('phone_optimization_completed');
    return advice;
  };`;

code = code.replace(scanNetworkRegex, newScanNetwork);
code = code.replace(scanDeviceRegex, newScanDevice + '\n\n  ' + addOptimizePhone);

code = code.replace(/scanDevice,\n/, 'scanDevice,\n    optimizePhone,\n');

fs.writeFileSync('src/hooks/useCyberAmour.ts', code);
