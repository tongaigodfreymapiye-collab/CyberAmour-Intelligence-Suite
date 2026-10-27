# Investigating By Identity — Implementation Notes

## What changed

The Scan Center's **Investigating By Identity** controls (Email Leaks, Phone, Name, Company, Username, Domain) now have an explicit no-Blaze fallback. If the configured automated service fails, CyberAmour displays a `Manual review required` result with public search portals relevant to the selected identifier type.

## Evidence and accuracy safeguards

- The fallback does not claim that the search engines or websites were queried by CyberAmour.
- Search URLs are labeled as public search links, not provider evidence.
- It does not infer a person's identity from a name alone or assign a risk score without evidence.
- The failure message is preserved in the result explanation so the investigator can distinguish an unavailable automated service from a completed search.
- For phone searches, links include public caller-reporting/search portals; access, coverage and correctness are controlled by those third-party websites.
- For email, Have I Been Pwned is linked as an official destination; the investigator must enter the address there and comply with that service's terms.

## Limitation

This is a functional manual fallback, not an automated web crawler or a replacement for the server-side Gemini/Google Search grounding integration. Automated search still requires a working backend. Never treat a search link, an empty search result, or an unavailable provider as proof that an identity is genuine or safe.

## Verification

- `npm run audit:release`: passed all 16 static checks.
- `src/App.tsx` TSX syntax transpilation: passed.
- Full Vite production build and live browser test were not run in this environment because dependencies were not installed here.
