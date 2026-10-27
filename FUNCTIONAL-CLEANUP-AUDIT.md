# CyberAmour Functional Cleanup & Forensics Scope Audit

## Changes in this update

- Removed the duplicated `GlobalIdentitySearch` component from the Scan Center. Identity investigations now use the single scan-type workflow already present in Scan Center.
- Removed the second Quick URL Scanner instance from Scan Center. The dashboard shortcut remains; Scan Center is the primary scan workflow.
- Replaced the claim “Detect threats in real-time with AI” with a description tied to supported checks and configured services.
- Added an explicit scope note: the browser app does not monitor all online activity or private accounts. It works with user-supplied content, configured providers, and public/authorized sources.
- Renamed “Clear Caches” to “Clear form & recent searches” because the button clears form/results/recent-search UI state rather than application caches.
- Added release-audit assertions for duplicate scan panels and truthful investigation scope.

## Validation performed

- `node scripts/release-check.mjs`: all 18 static checks passed.
- TypeScript transpile syntax checks passed for `src/App.tsx`, `src/hooks/useCyberAmour.ts`, and `src/components/EnterpriseRiskWorkspace.tsx`.
- ZIP integrity check passed after packaging.

## Not verified / known dependencies

- No full Vite production build was run in this packaging environment because dependencies were not installed here. Run `npm install`, `npm run audit:release`, and `npm run build` locally before deployment.
- No end-to-end browser test, live Firebase test, or provider test was performed.
- Firebase Cloud Functions deployment still requires a Firebase plan that permits the required Cloud Build API. With the current no-Blaze constraint, live server-side Gemini/search functions may remain unavailable; manual public-search fallback is not the same as automated retrieval.
- A website cannot inspect all activity across the internet, private social accounts, devices, or services without authorized integrations and appropriate permissions. This update focuses on supported checks and public/authorized evidence.
- Do not treat search results or unverified allegations as proof of wrongdoing. Verify original sources, identity matching, and case outcomes.
