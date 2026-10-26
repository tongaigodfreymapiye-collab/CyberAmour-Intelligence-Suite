# CyberAmour release audit status

## Changes made in this package
- Replaced splash/login copy with “Protected by Cyber Fortress Technologies”.
- Removed the UI-only VPN toggle; the UI now says no VPN client is connected.
- Removed simulated purchase/ad success from the web billing adapter. Purchase, restore, and rewarded-ad methods now fail closed and explain that the integration is unavailable.
- Removed false “Active Monitoring” and “Real-time” labels; the breach-intelligence page is explicitly on-demand.
- Made scan failures distinguish permission, quota, and service/configuration failures rather than claiming high traffic.
- Made failed public-breach searches surface an error instead of returning an empty result that could be interpreted as a clean result.
- Changed exposure summary wording to historical/source-backed records and clarified that no saved findings is not proof of safety.
- Added `npm run audit:release`, a dependency-light static check for key misleading claims and configuration invariants.

## Validation performed in this packaging environment
- `node --check functions/index.js`: pass.
- Python syntax compilation of `local-sensor/sensor.py`: pass.
- TypeScript/TSX transpile syntax check using the globally installed TypeScript compiler: pass (14 files, 0 syntax errors).
- `npm run audit:release`: pass (11 static assertions).
- `npm ci`: timed out in this environment. `npm run build` was attempted and failed because `vite` is unavailable in the incomplete `node_modules` installation. Full build, typecheck, browser integration tests, Firebase emulator tests and live-provider tests were **not completed**.

## Not yet production verified
- Firebase Authentication and Firestore rules on the deployed project.
- Callable functions with real Gemini / OSINT provider secrets.
- Licensed VirusTotal commercial access, AbuseIPDB and OTX credentials.
- Local sensor pairing, TShark/ClamAV/Suricata presence and Splunk HEC credentials on a real Windows machine.
- Stripe checkout/webhook and real ad provider integration.

Do not describe the application as fully production-ready until the dependency installation, production build, automated tests, deployed backend and real integration tests all pass.
