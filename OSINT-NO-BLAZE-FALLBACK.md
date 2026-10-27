# CyberAmour OSINT fallback for Firebase projects without Blaze

## What changed

The OSINT interfaces now fall back to manually opened public search links when the server-side Firebase callable fails. This lets a static GitHub Pages deployment remain useful without deploying Cloud Functions.

- Public Records & Adverse-Media Investigation creates a clearly marked manual-search report with exact-match, court/legal, regulator/enforcement, and news search links.
- Live Cybersecurity & Digital-Footprint OSINT creates a manual review result with search links for exact matches, public scam/abuse reports, and official/reputable sources.
- The fallback sets the risk to `Insufficient evidence` / `Manual review required`, records the callable error, and does not invent findings.
- Search links are not search results. CyberAmour does not automatically read search-engine pages, assert ownership, or produce grounded AI analysis in fallback mode.

## What still requires a backend

Automated Gemini / Google Search grounding, API keys kept off the browser, provider aggregation, account-level rate limiting and server-side entitlement checks require a trusted backend. Firebase Cloud Functions deployment in this project currently requires Blaze. Do not put `GEMINI_API_KEY`, VirusTotal, AbuseIPDB, OTX or Stripe secrets into frontend `.env` variables or GitHub Pages.

## Deployment and validation

This is a frontend-only fallback; it does not remove the existing callable functions. To use the fallback, build and publish the updated frontend to GitHub Pages. If functions are unavailable, the UI should display manual search links and clearly label the output as unverified. A successful frontend build and browser test are still required before release.
