# CyberAmour live OSINT and AI deployment

This release routes Gemini calls through authenticated Firebase Cloud Functions and adds a live indicator aggregation callable. The public GitHub Pages site is only the frontend; it does not run the provider integrations by itself.

## Live sources

- **VirusTotal**: domain, IP, URL and file-hash reputation. Commercial products must use a VirusTotal plan/license whose current terms explicitly permit this use. The public/community API terms prohibit integration into commercial products. See https://docs.virustotal.com/reference/overview and https://virustotal.readme.io/docs/api-overview.
- **AbuseIPDB**: IP reputation and abuse-confidence reports. Requires an API key; free account quotas apply. See https://docs.abuseipdb.com/.
- **AlienVault OTX**: public indicator context and pulse references. Requires an OTX account/API key. See https://otx.alienvault.com/api.
- **Google Gemini with Google Search grounding**: server-side AI interpretation and source references when grounding sources are returned. See https://ai.google.dev/gemini-api/docs/api-key.

Provider keys are optional at runtime, but the Cloud Functions secret names must be provisioned for deployment. If a provider is intentionally disabled, set its secret value to `DISABLED`; the function treats that as unconfigured. Do not use a free VirusTotal community key in the commercial product.

## Configure Firebase secrets

From the project root, sign in to the correct Firebase account and select the Firebase project that matches `firebase-applet-config.json`:

```bash
firebase login
firebase use gen-lang-client-0695458456
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set VIRUSTOTAL_API_KEY
firebase functions:secrets:set ABUSEIPDB_API_KEY
firebase functions:secrets:set ALIENVAULT_OTX_API_KEY
firebase deploy --only functions,firestore:rules
```

For a provider you are not using, enter `DISABLED` at the secret prompt. For VirusTotal, only enter a key that is licensed for your intended commercial use. Never paste secrets into source code, Vite environment variables, GitHub commits, screenshots, or chat.

The backend functions added/used by this release are `analyzeCyberIntel`, `cyberAmourAssistant`, `cyberAmourGenerateContent`, `lookupFileReputation`, and `generateActivationCode`. They require authenticated Firebase users and apply a per-user request-rate limit. Confirm the deployed functions use the intended Firestore database and project.

## Deploy the web frontend

1. Copy the contents of `CyberAmour-main` into the existing GitHub repository.
2. Commit and push to `main`.
3. In GitHub repository Settings → Pages, select **GitHub Actions** as the build/deployment source.
4. Open Actions and confirm both build and deploy jobs pass.
5. Open the Pages site and force-refresh with `Ctrl+Shift+R`.

GitHub Pages deployment does not deploy Firebase Functions or Firestore rules. Those are deployed separately using the Firebase CLI above.

## What the app can and cannot truthfully claim

- OSINT lookups show configured provider results and grounding-source links. A missing result means **unknown**, not safe.
- AI findings are advisory. Verify source references and findings before acting.
- The browser file page computes a local SHA-256 hash and checks reputation; it does not scan the whole computer and does not upload the file.
- Live packet capture, endpoint antivirus/EDR, process inspection, financial transaction monitoring, and automatic system remediation require separate trusted integrations or signed endpoint agents. These features must remain clearly marked as unavailable until those integrations are built and tested.
- Risk score is shown as “Not assessed” until a validated assessment source is recorded. No synthetic score or sample packet telemetry should be presented as live data.

## Release checks

- [ ] `npm ci` and `npm run build` succeed in GitHub Actions.
- [ ] Firebase Functions deploy successfully and logs show no missing-secret errors.
- [ ] Test an IP/domain/URL with each provider configured and unconfigured; verify errors are explicit and no missing data is called safe.
- [ ] Confirm grounding sources are clickable and the AI output does not invent unsupported source links.
- [ ] Confirm owner account `tongaigodfreymapiye@gmail.com` sees lifetime Premium without upgrade prompts.
- [ ] Confirm a separate customer account cannot self-grant Premium and sees only its plan entitlements.
- [ ] Test rate limiting, access rules, privacy, retention, deletion, backups, and incident response before inviting paying customers.
