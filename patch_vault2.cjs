const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace activeScreen enum
code = code.replace(/type Screen = 'dashboard' \| 'scan' \| 'alerts' \| 'ai' \| 'vault' \| 'settings' \| 'pricing' \| 'darkweb' \| 'network' \| 'admin';/, "type Screen = 'dashboard' | 'scan' | 'alerts' | 'ai' | 'features' | 'settings' | 'pricing' | 'darkweb' | 'network' | 'admin';");

// Replace vault prop in App component declaration
// Actually, `vault` was extracted from `const { vault, ... } = useCyberAmour()`
code = code.replace(/vault,\s*/g, '');

// Removing vault prop passed to Dashboard
code = code.replace(/vault=\{vault\}/g, '');

code = code.replace(/function Dashboard\(\{ profile, breaches, scans, globalThreats/g, "function Dashboard({ profile, breaches, scans, globalThreats");

// Replace secure vault box in Dashboard with empty string or keep it? The prompt wants to replace Secure vault.
code = code.replace(/<div className="glass-card p-6 space-y-4 border-accent\/30 bg-accent\/5">[\s\S]*?Assets encrypted locally<\/div>\s*<\/div>/g, 
`<div className="glass-card p-6 space-y-4 border-accent/30 bg-accent/5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Key Features</span>
            <button className="bg-accent text-bg px-2 py-0.5 rounded text-[10px] font-black">PRO</button>
          </div>
          <div className="text-4xl font-bold">9</div>
          <div className="text-xs text-text-dim">Powerful capabilities</div>
        </div>`);

// Sidebar Item
code = code.replace(/<SidebarItem active=\{activeScreen === 'vault'\} onClick=\{\(\) => setActiveScreen\('vault'\)\} icon=\{<Lock size=\{18\} \/>\} label="Secure Vault" \/>/g,
`<SidebarItem active={activeScreen === 'features'} onClick={() => setActiveScreen('features')} icon={<Star size={18} className="text-accent"/>} label="Key Features" />`);

// Routing logic
code = code.replace(/\{activeScreen === 'vault' && <Vault key="vault" logActivity=\{logActivity\} profile=\{profile\} setActiveScreen=\{setActiveScreen\} \/>\}/g,
`{activeScreen === 'features' && <KeyFeatures key="features" />}`);

code = code.replace(/\{activeScreen === 'vault' && <Vault key="vault" vault=\{vault\} logActivity=\{logActivity\} profile=\{profile\} setActiveScreen=\{setActiveScreen\} \/>\}/g,
`{activeScreen === 'features' && <KeyFeatures key="features" />}`);

// Mobile Nav
code = code.replace(/<NavButton active=\{activeScreen === 'vault'\} onClick=\{\(\) => setActiveScreen\('vault'\)\} icon=\{<Lock size=\{20\} \/>\} label="Vault" \/>/g,
`<NavButton active={activeScreen === 'features'} onClick={() => setActiveScreen('features')} icon={<Star size={20} className="text-accent"/>} label="Features" />`);

// AIAssistant reference
code = code.replace(/<button onClick=\{\(\) => setActiveScreen\('vault'\)\}/g, `<button onClick={() => setActiveScreen('features')}`);
code = code.replace(/Check Vault/g, 'Check Features');

fs.writeFileSync('src/App.tsx', code);
