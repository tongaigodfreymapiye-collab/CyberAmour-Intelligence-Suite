# CyberAmour commercial accounts and subscription launch

## Included in this package

- Email/password registration and sign-in UI, Google sign-in, password reset, and email verification gate.
- Firebase UID-based profile creation and per-user Firestore subcollections already used by the app.
- Firestore rules that prevent customers from granting themselves admin or paid-plan flags, and protect subscription documents from client writes.
- A Firebase Cloud Functions + Stripe starter for authenticated Checkout Sessions and signature-verified subscription lifecycle webhooks.

## Required before production

1. Review the Firebase project configuration in `firebase-applet-config.json`. Firebase web API keys are public identifiers, not server secrets, but must be restricted appropriately in Google Cloud. A Gemini API key must never be bundled into the static frontend; rotate any previously exposed key and move Gemini calls to a protected backend.
2. Deploy and test `firestore.rules` in the correct Firebase project. Use the Firebase Emulator Suite and test cross-user reads/writes before launch.
3. Deploy the Cloud Functions from `functions/` using a Firebase project on the Blaze plan. Set secrets `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Set parameters `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_BUSINESS_MONTHLY`, `STRIPE_PRICE_BUSINESS_YEARLY`, and `CYBERAMOUR_APP_BASE_URL` in the Functions environment.
4. Create Stripe recurring Prices for Pro and Business, then configure a Stripe webhook pointing to the deployed `stripeWebhook` endpoint. Subscribe to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and relevant subscription lifecycle events. Test signature validation and cancellation/failed-payment behavior in Stripe test mode first.
5. Configure Firebase Authentication → Settings → Authorized domains with the production hostname and the GitHub Pages hostname. Keep Google and Email/Password providers enabled.
6. Set the intended administrator identities only in trusted server-side policy. Project Owner access does not itself grant app-admin permissions. The current Firestore rules recognize the two owner emails in the `isAdmin()` helper; review whether that policy is appropriate before launch.
7. Add privacy policy, terms, data retention/deletion flow, abuse/rate controls, support process, backups, monitoring, and a documented incident-response process.
8. Verify every scan/AI/OSINT capability and clearly label demo/simulated data. Do not advertise device-wide antivirus/EDR unless independently implemented and validated.

## Subscription data model

`subscriptions/{firebaseUid}` is written by trusted backend code after Stripe webhook signature verification. Example fields: `uid`, `stripeCustomerId`, `stripeSubscriptionId`, `tier`, `status`, `currentPeriodEnd`, `updatedAt`. The browser must never write paid entitlements directly.

The front end and account creation are implemented, but live paid checkout is not active until the Stripe products, secrets, webhook, Functions deployment, and plan buttons are configured and tested.

## Permanent owner account

The verified Firebase Authentication account `tongaigodfreymapiye@gmail.com` is configured in the client as the permanent product-owner account. When this exact account is signed in and Firebase reports its email as verified, the UI derives an owner profile with lifetime premium/business access and no expiry; it does not write a customer-editable premium flag to Firestore. Other customer accounts continue to use their subscription/profile entitlements.

Important: this client-side owner entitlement controls the UI only. Before a commercial launch, enforce owner/admin and subscription entitlements on every protected Cloud Function and data resource using Firebase Admin SDK custom claims and/or verified server-side subscription records. Never trust a client-supplied `isOwner`, `isPremium`, or role field. Test owner access using the verified owner account and test customer access with a separate account.


## Product-owner premium and device access

The exact Firebase-authenticated account email `tongaigodfreymapiye@gmail.com` receives the product-owner profile override (`isOwner`, lifetime premium/business tier, no expiry) so premium UI gates such as Auto-Rectify do not show a subscription prompt. Customer accounts continue to use their own subscription records.

The owner account is limited to five active browser profiles/devices. A new browser session warns when other devices are active; a sixth distinct device is rejected. Device sessions use a Firestore transaction ledger at `users/{uid}/deviceAccess/active`, refresh their heartbeat every five minutes, and are released on sign-out. Sessions inactive for 30 days are treated as stale. The Firestore rules in `firestore.rules` must be published to the configured Firebase project for the device ledger to work.

Important: this browser/device ledger is an application-level limit, not hardware attestation; clearing browser storage can make one browser appear as a new device. For stronger commercial enforcement, move device admission to a trusted Cloud Function and apply server-side entitlement checks to every protected backend feature.


## Navigation cleanup and product structure

The main navigation has been simplified around the primary security workflows: Security Overview, Risk Assessments, GRC & Controls, Threat Intelligence & OSINT, Security Scans, Dark Web Exposure, Network & Device, Investigations & Evidence, Reports & Action Plans, and Tasks & Remediation. Account and support actions are grouped separately. Redundant top-level entries such as Key Features and World Clock have been removed from the sidebar; their underlying components are retained, and the dashboard still includes the compact clock widget.

Risk Assessments and GRC remain separate because they serve different purposes. Investigation Cases is presented as Investigations & Evidence, and Cyber Forensics is labelled Security Scans to make its scanning workflow clearer. AI is labelled AI Security Assistant. Alerts are presented as Notifications. The dashboard title is Security Overview. These changes reorganise navigation and labels; they do not claim that placeholder integrations or simulated monitoring are production-ready.

The owner entitlement is granted in the client only when Firebase Auth reports the exact owner email as verified. The owner-only five-device ledger uses Firestore under the user's own `deviceAccess/active` document. Publish the repository's Firestore rules to the correct Firebase project and test login, denial, release, and stale-session cases before relying on this limit. Because the ledger is client-driven, it is not a substitute for a trusted server-side session broker against a determined attacker.


## Final reliability improvements

- The owner entitlement is passed explicitly into the dashboard action handler to prevent an undefined-variable failure when selecting the owner-only action.
- Realtime notification banners can be dismissed; dismissed notification IDs are stored in this browser.
- The former hard-coded phone optimizer/storage figure was replaced by browser-derived device classification, a public-IP lookup via api.ipify.org, and network details only where the browser exposes them. Device classification cannot distinguish a desktop from a laptop reliably, so those are grouped.
- Removed the randomly generated “Threat Blocked” alert behavior. A browser-only web app does not have authority to block processes on the user's computer.
- The former Auto-Rectify action now only marks unread alerts as reviewed and does not fabricate endpoint repairs or inflate the security score.
- Added a dedicated Antivirus & File Reputation page. It calculates SHA-256 locally and calls a server-side VirusTotal hash reputation lookup. It is not full-device antivirus, does not upload the file, and cannot determine whether an unknown hash is safe.

### Configure live file reputation

Set the Firebase Functions secret and deploy the backend function before using live reputation: `firebase functions:secrets:set VIRUSTOTAL_API_KEY`, then deploy `lookupFileReputation` with the other functions. A valid VirusTotal API key is required. Do not put API keys in the frontend or commit them to Git.

### Device/network and antivirus limitations

A normal browser cannot enumerate the user's full file system, inspect running processes, scan installed applications, identify the exact laptop model, or scan a private LAN without a separately installed native agent and explicit permissions. Public-IP lookup sends a request to api.ipify.org. Production endpoint antivirus/EDR requires a native agent or an integration with an existing endpoint-security provider.


## Deployment / live-data warning

The browser app currently contains legacy Gemini client calls and Vite configuration that can expose `GEMINI_API_KEY` in a public build. Before a public commercial release, move Gemini calls to authenticated Cloud Functions and remove the key from client-side Vite defines; rotate any key that has already been exposed. OSINT outputs should retain actual Google Search grounding sources and must clearly label unavailable data. A GitHub Pages frontend does not itself provide endpoint antivirus, LAN discovery, or process blocking.


## Live OSINT and AI provider configuration

The OSINT callable `analyzeCyberIntel` queries VirusTotal for supported domain, IP, URL and hash indicators; AbuseIPDB for IP reputation; and AlienVault OTX for indicator context when those provider secrets are configured. Gemini AI is invoked server-side and Google Search grounding sources are returned where available. Unconfigured providers are reported as unavailable, not as clean results.

Configure secrets in the Firebase project used by this app (never in Vite or the public GitHub repository):

```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set VIRUSTOTAL_API_KEY
firebase functions:secrets:set ABUSEIPDB_API_KEY
firebase functions:secrets:set ALIENVAULT_OTX_API_KEY
firebase deploy --only functions
```

VirusTotal's public/community API has terms and rate limits that may prohibit commercial use; obtain a plan/license that permits your intended product before selling VirusTotal-backed features. AbuseIPDB and AlienVault OTX require their own accounts/API keys. A missing key means that source is not queried. Review each provider's current terms and limits.

The browser's OSINT and assistant calls are routed through authenticated Cloud Functions; do not reintroduce a Gemini key in `vite.config.ts`, frontend environment variables, or built assets. Other legacy client AI operations now use the authenticated `cyberAmourGenerateContent` proxy. Add rate limits, quotas, abuse monitoring and cost controls before open commercial access.
