# CyberAmour login-stall fix

This patch addresses a sign-in stall in the deployed web app.

## Changes
- Firebase authentication state is applied immediately instead of waiting on the optional owner device-ledger read/write.
- Firestore owner-device enforcement failures no longer force a sign-out when the database is offline or cannot be reached. The hard device limit still signs out if the transaction itself explicitly reports that the five-device limit is reached.
- The critical account-profile listener now has a 15-second timeout and an error callback. A failed profile read displays an explanatory recovery screen instead of an endless loading splash. The error path does not mark two-factor verification complete.
- Google sign-in errors are displayed in the login panel, with guidance for blocked popups and Firebase unauthorized-domain configuration.

## Apply the patch
Extract this ZIP into the root of the cloned `CyberAmour-Intelligence-Suite` repository and allow it to overwrite the two `src` files. Then run:

```powershell
npm run build
git status --short
git add src/App.tsx src/hooks/useCyberAmour.ts
git commit -m "Fix login stall and show authentication errors"
git push origin main
```

Check the staged filenames before committing. The ZIP contains no `.env` files, API secrets, or generated build output.
