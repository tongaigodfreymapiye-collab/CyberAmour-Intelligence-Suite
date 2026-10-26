# CyberAmour Intelligence Suite — GitHub Pages package

This package is arranged with the application files at the repository root. It includes a GitHub Actions workflow that builds the Vite/React app and deploys the generated `dist/` directory to GitHub Pages. GitHub Pages must use **GitHub Actions** as its publishing source; serving the source `index.html` directly will show a blank page because `/src/main.tsx` is not a browser-ready production bundle.

## Upload

1. Extract this ZIP. Open the extracted folder and select **all files and folders inside it**, including the hidden `.github` folder.
2. Upload/replace those items in the root of `https://github.com/tongaigodfreymapiye-collab/CyberAmour-Intelligence-Suite` and commit them to the `main` branch. Do not upload the outer ZIP folder as a nested directory.
3. In GitHub, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
4. Open **Actions** and wait for **Build and deploy CyberAmour to GitHub Pages** to finish successfully.
5. Visit `https://tongaigodfreymapiye-collab.github.io/CyberAmour-Intelligence-Suite/` and hard-refresh with Ctrl+F5.

## Important security note

The repository previously triggered a GitHub secret-scanning alert for a Google API key in `firebase-applet-config.json`. Firebase web API keys are commonly present in client configuration, but they are not authorization secrets and must be protected with appropriate API restrictions and Firebase Security Rules. Review the alert in Google Cloud Console and rotate/restrict the key if it is valid and its exposure is not intended. Do not place a privileged server-side Gemini key in frontend code. The frontend Gemini integration needs a safe server-side proxy or a deliberately restricted public key; a GitHub Actions build cannot make a browser-exposed key secret.

## Build status

The GitHub Actions workflow performs `npm ci` and `npm run build` on GitHub's runner. This package was not successfully built in this environment because dependency installation timed out, so the first Actions run must be checked for any compile errors.
