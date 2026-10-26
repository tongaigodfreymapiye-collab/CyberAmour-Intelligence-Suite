# CyberAmour Intelligence Suite

Unified CyberAmour web application, retaining the original security-monitoring, scan, network/device, dark-web, AI assistant, alerts, tasks, settings, subscription and sound utility code, and adding a risk/GRC/OSINT/case-management workspace.

## Run locally

Prerequisites: Node.js 20+.

```bash
npm ci
cp .env.example .env.local
# Configure Firebase and AI service settings as appropriate for your environment.
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Vite is configured with a relative base so static assets can be served from a repository subpath. Firebase OAuth, Firestore rules and any server/API endpoints still need to be configured for the chosen deployment.

## New workspace capabilities

- Risk assessments for companies, organisations, suppliers and authorized individual cyber-exposure reviews.
- Transparent weighted questionnaire score, risk band, priority findings and downloadable PDF report.
- Saved risk register with CSV and JSON export.
- Starter GRC control register with editable status, owner, evidence reference and due date.
- Live OSINT workspace wired to the existing CyberAmour `performPhishingScan` pipeline, which uses Gemini with Google Search grounding for supported targets (domain, company, email, public username, name and phone). Results are saved by the original scan pipeline and can be exported as JSON; public-web search is not a direct system scan and is not exhaustive.
- Forensics case register with timeline notes and optional SHA-256 evidence hash metadata.
- Consolidated exports and report-quality checklist.
- CyberAmour logo asset and original sound utility functions retained and used by new assessment actions.

## Data and accuracy notes

The new workspace currently saves its records to the current browser's localStorage. This is suitable for a prototype, not multi-user or confidential production use. The live OSINT workspace reuses the existing Gemini + Google Search grounding capability. It is not a direct forensic acquisition engine, and the new workspace does not yet include an independently validated threat-intelligence feed. Risk scores are screening estimates based on user-entered responses; they are not guarantees, certifications, legal advice or independently verified audit conclusions. For individual assessments, use only authorized, lawful cybersecurity exposure assessments and do not infer character or criminality.

## Security before production

Review Firebase authentication, Firestore security rules, data retention, tenant separation, logging and access control. The original Gemini integration is configured in Vite and may bundle the API key into browser-delivered code. Do not publish a real key to GitHub Pages or another static host. For production live OSINT, route Gemini/Google Search requests through a protected backend and rotate any key that may have been exposed. Live queries require a valid configured Gemini key, Google Search grounding availability, network access and the app’s configured Firebase/account limits. Perform dependency, security and privacy testing before collecting customer data.

## Developer

**Developed by Engineer and Software Developer - Tongai Godfrey Mapiye - Cyber Fortress Technologies.**


## Customer accounts and commercial subscriptions

- Customer-facing sign-in supports Google and email/password. Email/password registrations require email verification; password-reset emails are supported.
- Firestore customer profiles and user subcollections are keyed by Firebase Authentication UID. Deploy and test `firestore.rules` before using real customer data.
- Subscription entitlements are protected from browser-side self-upgrades. The `functions/` folder contains a Firebase Cloud Functions + Stripe Checkout/webhook starter; paid plans remain inactive until Stripe Prices, secrets, webhook events, and Functions deployment are configured.
- Configure the Firebase project in `.firebaserc` and verify it matches `firebase-applet-config.json` before deployment. Deploy rules/functions with `firebase deploy --only firestore:rules,functions` from a trusted development environment.
- Cloud Functions deployment requires the Firebase Blaze billing plan. Test Stripe in test mode first. See `docs/COMMERCIAL_LAUNCH.md`.

**Important production security:** The browser bundle must not contain Gemini/server API secrets. This project has client-side AI code from the earlier implementation; move AI calls behind a protected backend and rotate any key that may have been exposed before commercial launch.


## Live OSINT and AI deployment

See [LIVE-OSINT-AI-SETUP.md](LIVE-OSINT-AI-SETUP.md) for Firebase secret setup, real threat-intelligence providers, commercial licensing notes, deployment steps, and release checks. API keys must remain server-side.
