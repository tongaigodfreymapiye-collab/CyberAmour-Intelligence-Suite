import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/App.tsx');
const hook = read('src/hooks/useCyberAmour.ts');
const billing = read('src/utils/billing.ts');
const vite = read('vite.config.ts');
const firebase = read('firebase.json');
const sensor = read('local-sensor/sensor.py');
const enterprise = read('src/components/EnterpriseRiskWorkspace.tsx');
const css = read('src/index.css');
const failures = [];
function check(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (e) { failures.push(`${name}: ${e.message}`); console.error(`FAIL ${name}: ${e.message}`); }
}

check('branding uses Cyber Fortress Technologies', () => assert.match(app, /Protected by Cyber Fortress Technologies/));
check('sidebar brand has responsive overflow-safe layout', () => assert.match(css, /CyberAmour sidebar brand layout fix[\s\S]*overflow-x: hidden/));
check('no fake VPN toggle state remains', () => assert.doesNotMatch(app, /isVpnEnabled|setIsVpnEnabled/));
check('VPN is reported disconnected when no client is connected', () => assert.match(app, /No VPN client connected/));
check('background monitoring is not falsely advertised', () => {
  assert.doesNotMatch(app, /✓ Active Monitoring|Frequency: Real-time|Ad-free unlimited protection/);
  assert.match(app, /no background monitoring/i);
});
check('billing does not simulate purchases or ads', () => {
  assert.doesNotMatch(billing, /Simulating successful purchase|Simulating the user watched|setTimeout\(\(\) => resolve\(true\)/);
  assert.match(billing, /not integrated in this web build/i);
});
check('scan failures are not reported as generic high traffic', () => {
  assert.doesNotMatch(hook, /Scan could not be completed at this time due to high traffic/);
  assert.match(hook, /No scan result was produced/);
});
check('unanswered risk questionnaires remain unscored', () => {
  assert.match(enterprise, /answered\.length === 0[\s\S]{0,120}score: null/);
  assert.match(enterprise, /answered\.length < domains\.length[\s\S]{0,100}score: null/);
});
check('Firebase rules target the named database', () => assert.match(firebase, /ai-studio-aedf79c6-715c-41ba-9eb4-c9841d6f453b/));
check('client build does not inject Gemini API key', () => assert.doesNotMatch(vite, /define\s*:[\s\S]{0,300}GEMINI_API_KEY/));
check('local sensor binds only to loopback', () => assert.match(sensor, /127\.0\.0\.1/));
check('network and device scans disclose browser limitations', () => {
  assert.match(hook, /Live packet capture is not available to a normal web page/);
  assert.match(hook, /A browser page cannot scan your installed applications/);
});

if (failures.length) {
  console.error(`\nRelease audit failed: ${failures.length} check(s).`);
  process.exitCode = 1;
} else {
  console.log('\nRelease audit passed. This is a static truthfulness/configuration check, not an end-to-end integration test.');
}
