CYBERAMOUR INTELLIGENCE SUITE — FRESH GITHUB PAGES DEPLOYMENT

WHAT THIS PACKAGE DOES
- Contains the React/Vite source project at the ZIP root.
- Includes a GitHub Actions workflow that installs dependencies, builds the site, verifies the generated HTML, and publishes dist/ to GitHub Pages.
- Configures the Vite base path for /CyberAmour-Intelligence-Suite/.
- Does not require you to upload src/main.tsx as a website entry point; Vite compiles it during deployment.

FRESH DEPLOY
1. On GitHub, create a NEW repository named exactly: CyberAmour-Intelligence-Suite
   Owner: tongaigodfreymapiye-collab
   Public is easiest for GitHub Pages on a free account.
2. Extract this ZIP on your computer. Upload all extracted contents, including hidden .github/workflows/deploy.yml, to the repository root. Best option: GitHub Desktop or git; web upload can omit hidden folders.
3. Commit to the main branch.
4. In repository Settings > Pages > Build and deployment > Source, select GitHub Actions.
5. Open Actions. Wait for “Build and deploy CyberAmour to GitHub Pages” to show a green success status.
6. Open https://tongaigodfreymapiye-collab.github.io/CyberAmour-Intelligence-Suite/ and press Ctrl+F5.

IMPORTANT LIMITATIONS / SECURITY
- A successful GitHub Pages build confirms deployment, not that external Firebase services are configured. Firebase Authentication and Firestore require correct project configuration, enabled Google sign-in, authorized domains, and Firestore rules.
- Public static websites cannot safely hide private AI API keys. This package intentionally does not embed a Gemini key. AI-powered actions need a secure server-side endpoint; without one, those actions report that AI is not configured, while the app shell can still load.
- The Firebase web apiKey in firebase-applet-config.json is client configuration, not a private server credential, but restrict it in Google Cloud to the intended APIs and website referrers. Review GitHub's secret alert and rotate any truly private/exposed keys.
- Never deploy the repository root directly as a Pages branch source. The included workflow publishes the compiled dist/ directory.
