# Integration notes — CyberAmour Intelligence Suite

## Preserved from the original CyberAmour project

The original React/Vite application files and existing screens have been retained. This includes dashboard, phishing/security scan center, network/device monitor, dark-web monitor, AI assistant, alerts, features, user guide, tasks, world clock, pricing, admin queue, settings, Firebase hook, and `src/utils/sounds.ts` sound utilities. Existing click and scan/action sound calls remain in the app and are also used by the new workspace.

## Added

- New Risk Intelligence, GRC Assessments, OSINT Workspace, Investigation Cases and Risk Reports sidebar destinations.
- Weighted security-control questionnaire with explainable risk bands and PDF assessment reports.
- CSV risk register export and JSON exports for assessments, GRC controls, OSINT notes and case records.
- Local browser persistence for prototype records.
- User-provided CyberAmour lion/shield logo at `public/assets/cyberamour-logo.png`.
- Developer attribution throughout the relevant interface and reports.

## Validation performed

TypeScript/TSX syntax transpilation was checked for `App.tsx`, the new workspace component and the existing hook. A complete Vite build could not be run in this environment because `npm ci` did not complete before timeout. Run `npm ci`, `npm run lint`, and `npm run build` on a machine with registry access before deployment.

## Important pre-production tasks

1. Move Gemini requests behind a backend; never ship real API keys in browser code. Review and rotate any key that may have been exposed by a previous client build.
2. Review Firebase configuration, Firestore security rules, authentication, role checks and tenant isolation.
3. Replace localStorage persistence with authenticated, tenant-scoped database records before storing sensitive/customer data.
4. Connect only approved OSINT providers and document collection scope, licensing, privacy, provenance and rate limits.
5. Validate the risk scoring method against an agreed standard and expert-reviewed scenarios. Current scores are screening estimates based on entered responses, not audit/certification outcomes.
6. Forensics module currently records case metadata and optional SHA-256 strings; it is not a forensic acquisition or evidence-preservation engine.
7. Run unit, integration, accessibility, dependency, privacy and security tests.
