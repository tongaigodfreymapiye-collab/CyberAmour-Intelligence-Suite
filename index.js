const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Stripe = require('stripe');

initializeApp();
const db = getFirestore(undefined, 'ai-studio-aedf79c6-715c-41ba-9eb4-c9841d6f453b');
const stripeSecret = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const proMonthlyPrice = defineString('STRIPE_PRICE_PRO_MONTHLY');
const proYearlyPrice = defineString('STRIPE_PRICE_PRO_YEARLY');
const businessMonthlyPrice = defineString('STRIPE_PRICE_BUSINESS_MONTHLY');
const businessYearlyPrice = defineString('STRIPE_PRICE_BUSINESS_YEARLY');
const appBaseUrl = defineString('CYBERAMOUR_APP_BASE_URL', { default: 'https://tongaigodfreymapiye-collab.github.io/CyberAmour-Intelligence-Suite/' });

function stripeClient() { return new Stripe(stripeSecret.value()); }
async function enforceUserRateLimit(uid, service, maxRequests = 30, windowMs = 60 * 1000) {
  const ref = db.collection('serviceRateLimits').doc(`${uid}_${service}`);
  const now = Date.now();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const start = Number(data.windowStart || 0);
    const count = start > now - windowMs ? Number(data.count || 0) : 0;
    if (count >= maxRequests) throw new HttpsError('resource-exhausted', 'Request limit reached. Wait a minute and try again.');
    tx.set(ref, { uid, service, windowStart: count ? start : now, count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

async function hasServerVerifiedPremium(uid, email) {
  if (String(email || '').trim().toLowerCase() === 'tongaigodfreymapiye@gmail.com') return true;
  const snap = await db.collection('subscriptions').doc(uid).get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  if (!['active','trialing','activation_code','owner_lifetime'].includes(String(data.status || '').toLowerCase())) return false;
  if (String(data.tier || 'free').toLowerCase() === 'free') return false;
  const expiry = data.currentPeriodEnd || data.expiresAt || null;
  return !expiry || new Date(expiry).getTime() > Date.now();
}

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
    if (!['premium', 'business'].includes(tier)) throw new HttpsError('failed-precondition', 'This activation code has an unsupported plan.');
    tx.update(codeRef, { used: true, usedBy: request.auth.uid, usedAt: new Date().toISOString() });
    tx.set(userRef, { subscriptionTier: tier, isPremium: true, isBusiness: tier === 'business', subscriptionStatus: 'activation_code' }, { merge: true });
    tx.set(db.collection('subscriptions').doc(request.auth.uid), { uid: request.auth.uid, tier, status: 'activation_code', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
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


// Live file hash reputation lookup. The file itself is never uploaded by this function.
exports.cyberAmourAssistant = onCall({ secrets: [geminiApiKey], timeoutSeconds: 45 }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to use the CyberAmour assistant.');
  const premium = await hasServerVerifiedPremium(request.auth.uid, request.auth.token.email);
  await enforceUserRateLimit(request.auth.uid, 'ai-assistant-minute', premium ? 20 : 3, 60 * 1000);
  await enforceUserRateLimit(request.auth.uid, 'ai-assistant-day', premium ? 1000 : 25, 24 * 60 * 60 * 1000);
  const message = String(request.data && request.data.message || '').trim();
  if (!message || message.length > 12000) throw new HttpsError('invalid-argument', 'Enter a message under 12,000 characters.');
  const key = (() => { try { return geminiApiKey.value(); } catch (_) { return ''; } })();
  if (!key) throw new HttpsError('failed-precondition', 'AI service is not configured. Set the GEMINI_API_KEY Firebase secret and deploy functions.');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(30000),
    body: JSON.stringify({ contents: [{ parts: [{ text: `You are CyberAmour's cybersecurity assistant. Be accurate, distinguish facts from hypotheses, never claim a scan was performed unless supplied evidence confirms it, and provide practical safe recommendations. If context is insufficient, ask for it. User request: ${message}` }] }], generationConfig: { temperature: 0.2 } })
  });
  if (!response.ok) throw new HttpsError(response.status === 429 ? 'resource-exhausted' : 'unavailable', `AI provider request failed with HTTP ${response.status}.`);
  const json = await response.json();
  const answer = (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts || []).map(p => p.text || '').join('');
  return { answer, model: 'gemini-2.5-flash', generatedAt: new Date().toISOString(), provider: 'Google Gemini' };
});


// Generic Gemini proxy for legacy structured AI workflows. Keeps the Gemini key server-side.
exports.cyberAmourGenerateContent = onCall({ secrets: [geminiApiKey], timeoutSeconds: 65, memory: '512MiB' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to use CyberAmour AI features.');
  const premium = await hasServerVerifiedPremium(request.auth.uid, request.auth.token.email);
  await enforceUserRateLimit(request.auth.uid, 'ai-generation-minute', premium ? 20 : 5, 60 * 1000);
  await enforceUserRateLimit(request.auth.uid, 'ai-generation-day', premium ? 1000 : 50, 24 * 60 * 60 * 1000);
  const options = request.data && request.data.options;
  if (JSON.stringify(options || {}).length > 12 * 1024 * 1024) throw new HttpsError('invalid-argument', 'AI request payload is too large.');
  if (!options || typeof options !== 'object') throw new HttpsError('invalid-argument', 'AI request options are required.');
  const key = (() => { try { return geminiApiKey.value(); } catch (_) { return ''; } })();
  if (!key) throw new HttpsError('failed-precondition', 'AI is not configured. Set the GEMINI_API_KEY Firebase secret and deploy functions.');
  let contents = options.contents;
  if (typeof contents === 'string') contents = [{ role: 'user', parts: [{ text: contents }] }];
  if (!Array.isArray(contents) || contents.length === 0) throw new HttpsError('invalid-argument', 'AI content is empty.');
  const rawConfig = options.config || {};
  const generationConfig = {};
  for (const k of ['temperature','topP','topK','maxOutputTokens','responseMimeType','responseSchema','candidateCount','stopSequences']) if (rawConfig[k] !== undefined) generationConfig[k] = rawConfig[k];
  const tools = (rawConfig.tools || []).map(tool => {
    if (tool && tool.googleSearch) return { google_search: {} };
    if (tool && tool.google_search) return { google_search: {} };
    return null;
  }).filter(Boolean);
  const body = { contents, generationConfig };
  if (rawConfig.systemInstruction) body.systemInstruction = typeof rawConfig.systemInstruction === 'string' ? { parts: [{ text: rawConfig.systemInstruction }] } : rawConfig.systemInstruction;
  if (tools.length) body.tools = tools;
  const model = /^gemini-[a-zA-Z0-9.-]+$/.test(String(options.model || '')) ? options.model : 'gemini-2.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(55000)
  });
  if (!response.ok) {
    const status = response.status;
    console.error('Gemini request failed', status);
    throw new HttpsError(status === 429 ? 'resource-exhausted' : status === 400 ? 'invalid-argument' : 'unavailable', `Gemini AI request failed with HTTP ${status}.`);
  }
  const json = await response.json();
  const candidate = json.candidates && json.candidates[0] || {};
  const text = (candidate.content && candidate.content.parts || []).map(part => part.text || '').join('');
  const groundingSources = (candidate.groundingMetadata && candidate.groundingMetadata.groundingChunks || []).map(chunk => chunk.web).filter(web => web && /^https?:\/\//i.test(web.uri || '')).map(web => ({ title: web.title || web.uri, url: web.uri }));
  return { text, model, generatedAt: new Date().toISOString(), grounded: Boolean(tools.length), groundingSources };
});


exports.generateActivationCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to administer activation codes.');
  const email = String(request.auth.token.email || '').trim().toLowerCase();
  if (email !== 'tongaigodfreymapiye@gmail.com') throw new HttpsError('permission-denied', 'Only the configured product owner can generate activation codes.');
  const tier = String(request.data && request.data.tier || '').toLowerCase();
  if (!['premium','business'].includes(tier)) throw new HttpsError('invalid-argument', 'Choose a supported activation tier.');
  const linkedEmail = String(request.data && request.data.linkedEmail || '').trim().toLowerCase();
  if (linkedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linkedEmail)) throw new HttpsError('invalid-argument', 'Enter a valid linked email address.');
  const crypto = require('crypto');
  const segment = () => crypto.randomBytes(3).toString('hex').toUpperCase();
  const code = `${segment()}-${segment()}-${segment()}-${segment()}`;
  await db.collection('activationCodes').add({ code, tier, createdBy: request.auth.uid, linkedEmail: linkedEmail || null, createdAt: new Date().toISOString(), used: false, usedBy: null, usedAt: null });
  return { code, tier, linkedEmail: linkedEmail || null };
});
