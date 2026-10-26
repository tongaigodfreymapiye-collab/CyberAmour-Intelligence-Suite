const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Stripe = require('stripe');

initializeApp();
const db = getFirestore(undefined, 'ai-studio-aedf79c6-715c-41ba-9eb4-c9841d6f453b');
const stripeSecret = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const proMonthlyPrice = defineString('STRIPE_PRICE_PRO_MONTHLY');
const proYearlyPrice = defineString('STRIPE_PRICE_PRO_YEARLY');
const businessMonthlyPrice = defineString('STRIPE_PRICE_BUSINESS_MONTHLY');
const businessYearlyPrice = defineString('STRIPE_PRICE_BUSINESS_YEARLY');
const appBaseUrl = defineString('CYBERAMOUR_APP_BASE_URL', { default: 'https://tongaigodfreymapiye-collab.github.io/CyberAmour-Intelligence-Suite/' });

function stripeClient() { return new Stripe(stripeSecret.value()); }
function priceForTier(tier) {
  const prices = {
    pro_monthly: proMonthlyPrice.value(),
    pro_yearly: proYearlyPrice.value(),
    business_monthly: businessMonthlyPrice.value(),
    business_yearly: businessYearlyPrice.value()
  };
  if (!Object.prototype.hasOwnProperty.call(prices, tier)) throw new HttpsError('invalid-argument', 'Choose a valid paid plan.');
  return prices[tier];
}

// Authenticated users can request checkout, but only Stripe's verified webhook grants entitlements.
exports.createCheckoutSession = onCall({ secrets: [stripeSecret] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before starting checkout.');
  if (request.auth.token.email_verified === false) throw new HttpsError('failed-precondition', 'Verify your email before starting checkout.');
  const uid = request.auth.uid;
  const tier = request.data && request.data.tier;
  const price = priceForTier(tier);
  const planTier = String(tier).startsWith('business') ? 'business' : 'pro';
  if (!price || !price.startsWith('price_')) throw new HttpsError('failed-precondition', 'Configure the Stripe Price ID for this plan first.');
  const stripe = stripeClient();
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const email = userSnap.exists ? userSnap.get('email') : request.auth.token.email;
  const subSnap = await db.collection('subscriptions').doc(uid).get();
  let customerId = subSnap.exists ? subSnap.get('stripeCustomerId') : null;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: email || undefined, metadata: { firebaseUid: uid } });
    customerId = customer.id;
    await db.collection('subscriptions').doc(uid).set({ uid, stripeCustomerId: customerId, tier: 'free', status: 'inactive', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appBaseUrl.value()}?billing=success`,
    cancel_url: `${appBaseUrl.value()}?billing=cancelled`,
    client_reference_id: uid,
    metadata: { firebaseUid: uid, tier: planTier },
    subscription_data: { metadata: { firebaseUid: uid, tier: planTier } },
    allow_promotion_codes: true
  });
  return { url: session.url };
});

// Activation codes are validated and consumed atomically on the trusted backend.
exports.redeemActivationCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to redeem an activation code.');
  if (request.auth.token.email_verified === false) throw new HttpsError('failed-precondition', 'Verify your email before redeeming an activation code.');
  const code = String(request.data && request.data.code || '').trim().toUpperCase();
  if (!code || code.length > 80) throw new HttpsError('invalid-argument', 'Enter a valid activation code.');
  const matches = await db.collection('activationCodes').where('code', '==', code).limit(1).get();
  if (matches.empty) throw new HttpsError('not-found', 'Invalid or already used activation code.');
  const codeRef = matches.docs[0].ref;
  const userRef = db.collection('users').doc(request.auth.uid);
  const result = await db.runTransaction(async (tx) => {
    const codeSnap = await tx.get(codeRef);
    const userSnap = await tx.get(userRef);
    if (!codeSnap.exists || codeSnap.get('used') !== false) throw new HttpsError('failed-precondition', 'Invalid or already used activation code.');
    const data = codeSnap.data();
    const email = String(request.auth.token.email || '').toLowerCase();
    if (data.linkedEmail && String(data.linkedEmail).toLowerCase() !== email) throw new HttpsError('permission-denied', 'This activation code is linked to a different account.');
    if (!userSnap.exists) throw new HttpsError('failed-precondition', 'Your account profile is not ready. Sign in again and retry.');
    const tier = data.tier;
    if (!['premium', 'business', 'forensics'].includes(tier)) throw new HttpsError('failed-precondition', 'This activation code has an unsupported plan.');
    tx.update(codeRef, { used: true, usedBy: request.auth.uid, usedAt: new Date().toISOString() });
    if (tier === 'forensics') {
      tx.set(userRef, { hasForensicsReport: true }, { merge: true });
    } else {
      tx.set(userRef, { subscriptionTier: tier, isPremium: true, isBusiness: tier === 'business', subscriptionStatus: 'activation_code' }, { merge: true });
      tx.set(db.collection('subscriptions').doc(request.auth.uid), { uid: request.auth.uid, tier, status: 'activation_code', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    return { tier };
  });
  return result;
});

// Configure Stripe to send subscription lifecycle events to this endpoint.
exports.stripeWebhook = onRequest({ secrets: [stripeSecret, stripeWebhookSecret], cors: false }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  const stripe = stripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], stripeWebhookSecret.value());
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send('Invalid webhook signature');
  }
  try {
    const obj = event.data.object;
    if (event.type === 'checkout.session.completed') {
      const uid = obj.metadata && obj.metadata.firebaseUid || obj.client_reference_id;
      if (uid && obj.subscription) {
        const subscription = await stripe.subscriptions.retrieve(obj.subscription);
        await syncSubscription(uid, subscription);
      }
    } else if (event.type.startsWith('customer.subscription.')) {
      const uid = obj.metadata && obj.metadata.firebaseUid;
      if (uid) await syncSubscription(uid, obj);
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Stripe event processing failed:', err);
    return res.status(500).send('Webhook processing failed');
  }
});

async function syncSubscription(uid, sub) {
  const active = ['active', 'trialing'].includes(sub.status);
  const priceId = sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].price && sub.items.data[0].price.id;
  const tier = sub.metadata && sub.metadata.tier || 'pro';
  const patch = {
    uid, stripeSubscriptionId: sub.id, stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    tier: active ? tier : 'free', status: sub.status,
    currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    updatedAt: FieldValue.serverTimestamp()
  };
  await db.collection('subscriptions').doc(uid).set(patch, { merge: true });
  await db.collection('users').doc(uid).set({
    isPremium: active,
    subscriptionTier: active ? tier : 'free',
    subscriptionStatus: sub.status,
    planId: priceId || null,
    subscriptionExpiresAt: patch.currentPeriodEnd
  }, { merge: true });
}
