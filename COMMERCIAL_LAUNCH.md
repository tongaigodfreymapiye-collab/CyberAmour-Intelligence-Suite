# CyberAmour commercial accounts and subscription launch

## Included in this package

- Email/password registration and sign-in UI, Google sign-in, password reset, and email verification gate.
- Firebase UID-based profile creation and per-user Firestore subcollections already used by the app.
- Firestore rules that prevent customers from granting themselves admin or paid-plan flags, and protect subscription documents from client writes.
- A Firebase Cloud Functions + Stripe starter for authenticated Checkout Sessions and signature-verified subscription lifecycle webhooks.

## Required before production

1. Review the Firebase project configuration in `firebase-applet-config.json`. Firebase web API keys are public identifiers, not server secrets, but must be restricted appropriately in Google Cloud. A Gemini API key must never be bundled into the static frontend; rotate any previously exposed key and move Gemini calls to a protected backend.
2. Deploy and test `firestore.rules` in the correct Firebase project. Use the Firebase Emulator Suite and test cross-user reads/writes before launch.
3. Deploy the Cloud Functions from `functions/` using a Firebase project on the Blaze plan. Set secrets `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Set parameters `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_BUSINESS_MONTHLY`, `STRIPE_PRICE_BUSINESS_YEARLY`, and `CYBERAMOUR_APP_BASE_URL` in the Functions environment.
4. Create Stripe recurring Prices for Pro and Business, then configure a Stripe webhook pointing to the deployed `stripeWebhook` endpoint. Subscribe to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and relevant subscription lifecycle events. Test signature validation and cancellation/failed-payment behavior in Stripe test mode first.
5. Configure Firebase Authentication → Settings → Authorized domains with the production hostname and the GitHub Pages hostname. Keep Google and Email/Password providers enabled.
6. Set the intended administrator identities only in trusted server-side policy. Project Owner access does not itself grant app-admin permissions. The current Firestore rules recognize the two owner emails in the `isAdmin()` helper; review whether that policy is appropriate before launch.
7. Add privacy policy, terms, data retention/deletion flow, abuse/rate controls, support process, backups, monitoring, and a documented incident-response process.
8. Verify every scan/AI/OSINT capability and clearly label demo/simulated data. Do not advertise device-wide antivirus/EDR unless independently implemented and validated.

## Subscription data model

`subscriptions/{firebaseUid}` is written by trusted backend code after Stripe webhook signature verification. Example fields: `uid`, `stripeCustomerId`, `stripeSubscriptionId`, `tier`, `status`, `currentPeriodEnd`, `updatedAt`. The browser must never write paid entitlements directly.

The front end and account creation are implemented, but live paid checkout is not active until the Stripe products, secrets, webhook, Functions deployment, and plan buttons are configured and tested.

## Permanent owner account

The verified Firebase Authentication account `tongaigodfreymapiye@gmail.com` is configured in the client as the permanent product-owner account. When this exact account is signed in and Firebase reports its email as verified, the UI derives an owner profile with lifetime premium/business access and no expiry; it does not write a customer-editable premium flag to Firestore. Other customer accounts continue to use their subscription/profile entitlements.

Important: this client-side owner entitlement controls the UI only. Before a commercial launch, enforce owner/admin and subscription entitlements on every protected Cloud Function and data resource using Firebase Admin SDK custom claims and/or verified server-side subscription records. Never trust a client-supplied `isOwner`, `isPremium`, or role field. Test owner access using the verified owner account and test customer access with a separate account.


## Product-owner premium and device access

The exact Firebase-authenticated account email `tongaigodfreymapiye@gmail.com` receives the product-owner profile override (`isOwner`, lifetime premium/business tier, no expiry) so premium UI gates such as Auto-Rectify do not show a subscription prompt. Customer accounts continue to use their own subscription records.

The owner account is limited to five active browser profiles/devices. A new browser session warns when other devices are active; a sixth distinct device is rejected. Device sessions use a Firestore transaction ledger at `users/{uid}/deviceAccess/active`, refresh their heartbeat every five minutes, and are released on sign-out. Sessions inactive for 30 days are treated as stale. The Firestore rules in `firestore.rules` must be published to the configured Firebase project for the device ledger to work.

Important: this browser/device ledger is an application-level limit, not hardware attestation; clearing browser storage can make one browser appear as a new device. For stronger commercial enforcement, move device admission to a trusted Cloud Function and apply server-side entitlement checks to every protected backend feature.
