# CyberAmour: owner access, logout, and startup animation fix

## Changes in this package
- Owner recognition uses the exact Firebase-authenticated account email `tongaigodfreymapiye@gmail.com` consistently in the client. It no longer gets blocked by the UI's email-verification gate.
- The owner account bypasses the standard unverified-email screen so the product-owner account does not get trapped before reaching its lifetime entitlement profile.
- A visible **Sign Out** button is provided in the main content header and desktop sidebar, plus the mobile header.
- The branded logo loading animation is shown for six seconds on initial load and after email/password sign-in.
- The dashboard shows an `Owner · Lifetime Premium` label when the owner account is signed in.

## Deploy correctly to GitHub Pages
1. Extract this archive.
2. Open the `CyberAmour-main` folder.
3. In the GitHub repository `CyberAmour-Intelligence-Suite`, replace the project source files with the contents of this folder. Do not upload the ZIP itself into the repository as a substitute for the files.
4. Preserve and verify the repository's intended GitHub Actions deployment workflow. Ensure it installs dependencies and runs `npm run build`, then publishes the generated `dist/` directory.
5. Commit and push to `main`; wait for the deployment workflow to succeed.
6. Open the site and do a hard refresh with `Ctrl+Shift+R`. If the old sidebar still says “Cyber Forensics” and “Risk Intelligence” and the old Auto-Rectify paywall persists, the old build is still being served or the updated source was not deployed.
7. Publish `firestore.rules` to the correct Firebase project separately. GitHub Pages does not publish Firestore rules.

## Validation status
The source archive is provided with the edits above. A production build could not be verified in this environment because the local Vite executable was absent and dependency installation timed out. Run `npm ci` and `npm run build` in the repository/CI environment and fix any reported build errors before relying on the release.

## Security note
The owner entitlement is used to correct client-side access and user experience. Any protected Cloud Function or other privileged backend action must independently validate owner privileges using trusted server-side identity and authorization logic. The five-device ledger also depends on the configured Firestore rules and should be tested with six distinct browser/device profiles.
