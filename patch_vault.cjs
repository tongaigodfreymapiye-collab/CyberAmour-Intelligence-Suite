const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const startIndex = code.indexOf('function Vault({ vault, logActivity, profile, setActiveScreen }: any) {');
const endIndex = code.indexOf('function Alerts({ alerts, profile }: any) {');

if (startIndex > -1 && endIndex > -1) {
  const newFunction = `function KeyFeatures() {
  const features = [
    { name: 'Security Score Dashboard', desc: 'with animated gauge', icon: <Shield size={24} className="text-primary" /> },
    { name: 'Password Leak Detection', desc: 'email breach check via AI', icon: <Search size={24} className="text-secondary" /> },
    { name: 'Phishing Detection', desc: 'AI-powered link/email/SMS analysis', icon: <ShieldAlert size={24} className="text-danger" /> },
    { name: 'Device Security Scanner', desc: 'simulated', icon: <Smartphone size={24} className="text-[#3B82F6]" /> },
    { name: 'AI Security Assistant', desc: 'chat interface', icon: <MessageSquare size={24} className="text-primary" /> },
    { name: 'Alerts Center', desc: 'Real-time threat feeds', icon: <Bell size={24} className="text-[#F59E0B]" /> },
    { name: 'Phone Optimizer', desc: 'simulated', icon: <Zap size={24} className="text-success" /> },
    { name: 'Dark Web Monitoring', desc: 'Constant surveillance', icon: <Ghost size={24} className="text-text-dim" /> },
    { name: 'Settings', desc: 'with premium tiers', icon: <Settings size={24} className="text-text-dim" /> }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Star className="text-accent" /> Key Features
        </h2>
        <p className="text-text-dim text-sm">Explore the advanced capabilities of the CyberAmour platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i} 
            className="glass-card p-6 flex items-start gap-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all border border-border/50 hover:border-primary/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              {f.icon}
            </div>
            <div className="p-3 bg-surface/50 rounded-xl border border-border">
              {f.icon}
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">{f.name}</h3>
              <p className="text-xs text-text-dim leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

`;

  const newCode = code.substring(0, startIndex) + newFunction + code.substring(endIndex);
  fs.writeFileSync('src/App.tsx', newCode);
  console.log("Patched successfully");
} else {
  console.log("Could not find boundaries");
}
