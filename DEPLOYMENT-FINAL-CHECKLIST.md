# CyberAmour final deployment checklist

## GitHub Pages frontend
1. Replace the repository's root project files with this package's contents, including `.github/workflows/deploy.yml`.
2. In GitHub repository Settings → Pages, set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or run the workflow manually in Actions.
4. Wait for both Build and Deploy jobs to succeed. The page will not update if the build fails or Pages is still configured to deploy an old branch/root folder.
5. Open the live URL and hard-refresh with Ctrl+Shift+R.

## Firebase / live reputation
1. Check `.firebaserc` and confirm it points to the intended Firebase project before deploying anything.
2. Set the provider secret: `firebase functions:secrets:set VIRUSTOTAL_API_KEY`.
3. Deploy the callable function: `firebase deploy --only functions:lookupFileReputation`.
4. Deploy Firestore rules separately: `firebase deploy --only firestore:rules`.
5. Test with a known hash and confirm an unknown hash is reported as unknown, not clean.

## Known boundaries before selling
- This browser application cannot scan the entire host operating system, inspect running processes, block processes, or inspect the whole private LAN. Full antivirus/EDR requires a native agent or established endpoint integration.
- Public IP uses api.ipify.org and network type is shown only when the browser exposes it.
- VirusTotal hash lookup is a reputation check, not an upload-based malware scan. The selected file stays in the browser; only its SHA-256 hash is sent to the callable function.
- The legacy Gemini client path is still configured through Vite and can expose its key in public builds. Move all Gemini calls to authenticated Cloud Functions and rotate any previously exposed key before commercial launch.
- Browser-based device IDs can be reset by clearing browser data. A trusted backend/native registration is needed for tamper-resistant device enforcement.
- Production build was not verified in this environment because npm dependency installation could not complete. GitHub Actions is configured to perform the build and will report errors in the workflow logs.
