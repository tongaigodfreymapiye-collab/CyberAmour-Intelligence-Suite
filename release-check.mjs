import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/App.tsx');
const hook = read('src/hooks/useCyberAmour.ts');
const billing = read('src/utils/billing.ts');
const vite = read('vite.config.ts');
const sensor = read('local-sensor/sensor.py');
const enterprise = read('src/components/EnterpriseRiskWorkspace.tsx');
const css = read('src/index.css');
const functions = read('functions/index.js');
const failures = [];
function check(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (e) { failures.push(`${name}: ${e.message}`); console.error(`FAIL ${name}: ${e.message}`); }
}

check('branding, logo and startup animation are preserved', () => {
  assert.match(app, /Protected by Cyber Fortress Technologies/);
  assert.match(app, /CyberAmourLogo/);
  assert.match(app, /animate=\{\{ scale: \[1, 1\.2, 1\] \}\}/);
  assert.match(css, /CyberAmour sidebar brand layout fix/);
});
check('Firebase login, signup and password reset remain wired', () => {
  assert.match(app, /signInWithEmailAndPassword/);
  assert.match(app, /createUserWithEmailAndPassword/);
  assert.match(app, /sendPasswordResetEmail/);
  assert.match(hook, /onAuthStateChanged/);
});
check('retired OSINT and public-records integrations are removed', () => {
  assert.doesNotMatch(app, /Threat Intelligence & OSINT|Public Breach Intelligence|osintVerdict|investigatePublicRecords/);
  assert.doesNotMatch(hook, /runSignupOSINT|analyzeCyberIntel|scanDarkWeb|performPhishingScan/);
  assert.doesNotMatch(functions, /investigatePublicRecords|analyzeCyberIntel|lookupFileReputation/);
  assert.doesNotMatch(enterprise, /OSINT workspace|Live Cybersecurity & Digital-Footprint OSINT/);
});
check('simulated threat maps and fabricated performance metrics are removed', () => {
  assert.doesNotMatch(app, /threatmap\.checkpoint\.com|Live Threat Map|Global Activity Map|ComposableMap|99\.4%|mockData/);
  assert.match(app, /does not display simulated attack locations/);
  assert.match(hook, /an empty history stays empty rather than inventing trend points/);
});
check('AI provider failures do not produce fabricated anomaly verdicts', () => {
  assert.match(hook, /No anomaly verdict was produced/);
  assert.match(hook, /No security assessment was performed/);
  assert.doesNotMatch(hook, /Activity normal based on heuristic analysis|Anomaly Detected \(Heuristic\)/);
});
check('Windows Defender scanning uses the local sensor without website file uploads', () => {
  assert.match(app, /WindowsEndpointScan/);
  const endpoint = read('src/components/WindowsEndpointScan.tsx');
  const sensorUi = read('src/components/LocalSecuritySensor.tsx');
  assert.match(endpoint, /LocalSecuritySensor/);
  assert.match(sensorUi, /Start Quick Scan/);
  assert.match(sensorUi, /Start Full Scan/);
  assert.doesNotMatch(sensorUi, /type="file"/);
  assert.match(sensor, /@app.post\("\/api\/defender\/scan"\)/);
  assert.match(sensor, /Start-MpScan/);
  assert.match(sensor, /127\.0\.0\.1/);
  assert.doesNotMatch(sensor, /@app\.post\(\"\/api\/scan\/file|@app\.post\(\"\/api\/network\/capture|@app\.post\(\"\/api\/pcap\/analyze/);
});
check('ATT&CK and KEV intelligence uses bundled reference snapshots and official source links', () => {
  assert.match(app, /ATT&CK \+ KEV Intelligence/);
  const module = read('src/components/AttackKevIntelligence.tsx');
  const data = JSON.parse(read('src/data/attackSnapshot.json'));
  assert.ok(data.techniques.length >= 30);
  assert.ok(data.kev.length >= 1000);
  assert.match(module, /cisa.gov\/known-exploited-vulnerabilities-catalog/);
  assert.match(module, /attack\.mitre\.org/);
});
check('risk, GRC, case and export reports are evidence-led and scoped', () => {
  assert.match(enterprise, /const generateGrcReport = \(\) =>/);
  assert.match(enterprise, /Generate GRC PDF report/);
  assert.match(enterprise, /Evidence references are not uploaded or independently verified/);
  assert.match(enterprise, /Not assessed.*unknown, not compliant/i);
});
check('billing does not simulate successful payment', () => {
  assert.doesNotMatch(billing, /Simulating successful purchase|setTimeout\(\(\) => resolve\(true\)/);
});
check('client build does not inject provider secrets', () => {
  assert.doesNotMatch(vite, /define\s*:[\s\S]{0,300}GEMINI_API_KEY/);
  assert.match(functions, /cyberAmourAssistant/);
});

if (failures.length) {
  console.error(`\nRelease audit failed: ${failures.length} check(s).`);
  process.exitCode = 1;
} else {
  console.log('\nRelease audit passed. This is a static configuration/truthfulness check, not an end-to-end integration test.');
}
