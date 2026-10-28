# CyberAmour Intelligence Suite

CyberAmour is a defensive security workspace by Cyber Fortress Technologies. This cleaned build preserves the existing login, logo, startup animation, colour system and layout while removing the unsupported OSINT/public-records workflows, simulated live-threat map, synthetic breach metrics, and generic scans that could not be performed by a browser.

## Supported application features

- Firebase Authentication: email sign-in, account registration, email verification and password reset.
- Security overview and account activity/alert history, using persisted records rather than generated placeholder scores.
- Windows Defender Quick Scan and Full Scan through the local Windows sensor at `127.0.0.1:8765`. Scan controls remain disabled until the sensor token is accepted.
- Bundled CISA Known Exploited Vulnerabilities (KEV) and MITRE ATT&CK reference snapshots. These are reference data, not evidence that a vulnerability or technique exists on the signed-in device. Verify freshness with the linked official sources.
- Risk assessment register, GRC control register, case notes, and CSV/JSON/PDF exports based on records entered by the user. Reports disclose that evidence is not independently validated.
- AI assistant when the authenticated Firebase Cloud Function and server-side Gemini secret are configured. Provider failures are shown as unavailable; no simulated answer or verdict is substituted.
- Account settings, notifications, tasks, billing UI, and owner/admin tools. Stripe checkout only works when server-side price IDs and webhook configuration are deployed.

## Removed from this build

- OSINT, public-records/person investigation, signup OSINT screening, and public-breach/dark-web scanning.
- Live threat maps, simulated attack locations, and external map embeds.
- Invented detection percentages, placeholder score-history points, and fake breach counts.
- Browser-only claims to scan the whole device, inspect network packets, block traffic, optimize the operating system, or monitor financial transactions.
- Unconnected file-reputation, network scan and generic scan endpoints that were not wired to a supported integration.

## Run locally

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run lint
npm run audit:release
npm run build
npm run dev
```

The Vite app uses `base: './'` for GitHub Pages. The public Firebase web configuration is in `firebase-applet-config.json`; Firebase client configuration is not a substitute for restrictive Firestore security rules. Do not place Gemini, Stripe, VirusTotal or other private provider keys in frontend files. Configure private keys only as Firebase Functions secrets.

## Windows Defender local sensor

On the Windows computer to be scanned, follow `local-sensor/README.md` and run `scripts/setup-sensor.ps1` from an elevated PowerShell session when required. Keep the sensor bound to loopback. Enter the sensor token in the app; do not publish it or paste it into chat. A browser hosted on another device cannot control a sensor installed on your PC.

## Deployment

The GitHub Actions workflow at `.github/workflows/deploy.yml` builds the Vite app and publishes `dist` to GitHub Pages on pushes to `main`. Confirm the workflow succeeds before relying on the published version. This source package has had static release checks and TypeScript/TSX syntax checks run; a full dependency install/build could not be completed in this environment because the npm registry package was not available in the local cache. Run the commands above on your computer or in GitHub Actions before production use.

## Important limitations

This is not a substitute for an EDR platform, a penetration test, a certified GRC audit, or a forensic acquisition tool. The website does not independently validate uploaded evidence or certify that a device is safe.
