const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Stripe = require('stripe');

initializeApp();
const db = getFirestore(undefined, 'ai-studio-aedf79c6-715c-41ba-9eb4-c9841d6f453b');
const stripeSecret = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const virusTotalApiKey = defineSecret('VIRUSTOTAL_API_KEY');
const abuseIpDbApiKey = defineSecret('ABUSEIPDB_API_KEY');
const alienVaultOtxApiKey = defineSecret('ALIENVAULT_OTX_API_KEY');
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

async function consumeFreeScanAllowance(uid, kind) {
  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError('failed-precondition', 'Account profile is not ready. Sign in again and retry.');
    const data = snap.data() || {};
    const field = kind === 'phone' ? 'phoneScansLeft' : 'forensicsScansLeft';
    const fallback = kind === 'phone' ? 3 : 5;
    const remaining = Number.isFinite(Number(data[field])) ? Number(data[field]) : fallback;
    if (remaining <= 0) throw new HttpsError('resource-exhausted', `Free ${kind === 'phone' ? 'phone' : 'OSINT'} scan allowance is exhausted. Upgrade or wait for the allowance reset.`);
    tx.set(userRef, { [field]: remaining - 1 }, { merge: true });
  });
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


// Live file hash reputation lookup. The file itself is never uploaded by this function.
exports.lookupFileReputation = onCall({ secrets: [virusTotalApiKey], timeoutSeconds: 20 }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to check a file hash.');
  const sha256 = String(request.data && request.data.sha256 || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new HttpsError('invalid-argument', 'A valid SHA-256 hash is required.');
  let apiKey = '';
  try { apiKey = virusTotalApiKey.value(); } catch (_) { apiKey = ''; }
  if (!apiKey) return { configured: false, message: 'VirusTotal API key is not configured.' };
  const response = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
    method: 'GET', headers: { 'x-apikey': apiKey, 'accept': 'application/json' }
  });
  if (response.status === 404) return { configured: true, found: false, sha256, message: 'This hash was not found in the provider database. This does not mean the file is safe.' };
  if (response.status === 429) throw new HttpsError('resource-exhausted', 'The threat-intelligence provider rate limit was reached. Try again later.');
  if (!response.ok) throw new HttpsError('unavailable', `Threat-intelligence provider returned HTTP ${response.status}.`);
  const json = await response.json();
  const attrs = json && json.data && json.data.attributes || {};
  const stats = attrs.last_analysis_stats || {};
  return {
    configured: true, found: true, sha256,
    malicious: Number(stats.malicious || 0), suspicious: Number(stats.suspicious || 0),
    harmless: Number(stats.harmless || 0), undetected: Number(stats.undetected || 0),
    retrievedAt: new Date().toISOString(),
    permalink: `https://www.virustotal.com/gui/file/${sha256}`
  };
});


// Live threat-intelligence aggregation. API keys remain on the trusted backend.
// Supports public domain, IP, URL, and hash reputation; unknown results are never treated as safe.
exports.analyzeCyberIntel = onCall({
  secrets: [virusTotalApiKey, abuseIpDbApiKey, alienVaultOtxApiKey, geminiApiKey],
  timeoutSeconds: 60,
  memory: '512MiB'
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to run threat intelligence.');
  const kind = String(request.data && request.data.kind || '').toLowerCase();
  const target = String(request.data && request.data.target || '').trim();
  const premium = await hasServerVerifiedPremium(request.auth.uid, request.auth.token.email);
  await enforceUserRateLimit(request.auth.uid, 'live-intel', premium ? 20 : 5, 60 * 1000);
  if (!['domain','ip','url','hash','email','company','username','phone','name'].includes(kind)) throw new HttpsError('invalid-argument', 'Unsupported indicator type.');
  if (!target || target.length > 2048 || /[\u0000-\u001f]/.test(target)) throw new HttpsError('invalid-argument', 'Enter a valid indicator.');
  if (kind === 'ip' && !/^[0-9a-fA-F:.]+$/.test(target)) throw new HttpsError('invalid-argument', 'Enter an IPv4 or IPv6 address.');
  if (kind === 'hash' && !/^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/.test(target)) throw new HttpsError('invalid-argument', 'Enter a valid MD5, SHA-1 or SHA-256 hash.');
  if (!premium) await consumeFreeScanAllowance(request.auth.uid, kind);
  const evidence = [];
  const sources = [];
  const errors = [];
  let groundedSourceCount = 0;
  const now = new Date().toISOString();
  const getSecret = (secret) => { try { const value = String(secret.value() || '').trim(); return /^(?:DISABLED|NOT_CONFIGURED)$/i.test(value) ? '' : value; } catch (_) { return ''; } };
  const vtKey = getSecret(virusTotalApiKey);
  const abuseKey = getSecret(abuseIpDbApiKey);
  const otxKey = getSecret(alienVaultOtxApiKey);
  const geminiKey = getSecret(geminiApiKey);
  const safeFetchJson = async (label, url, options = {}) => {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
      if (response.status === 404) return { provider: label, found: false, status: 404 };
      if (response.status === 429) { errors.push(`${label}: rate limit reached`); return null; }
      if (!response.ok) { errors.push(`${label}: HTTP ${response.status}`); return null; }
      return { provider: label, found: true, data: await response.json() };
    } catch (err) { errors.push(`${label}: request failed or timed out`); return null; }
  };
  const isIndicator = ['domain','ip','url','hash'].includes(kind);
  if (vtKey && isIndicator) {
    let endpoint = '';
    if (kind === 'domain') { let domain = target.toLowerCase(); try { if (domain.includes('://')) domain = new URL(domain).hostname; } catch (_) { throw new HttpsError('invalid-argument', 'Enter a valid domain name.'); } if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain)) throw new HttpsError('invalid-argument', 'Enter a valid public domain name.'); endpoint = `domains/${encodeURIComponent(domain)}`; }
    if (kind === 'ip') endpoint = `ip_addresses/${encodeURIComponent(target)}`;
    if (kind === 'hash') endpoint = `files/${encodeURIComponent(target.toLowerCase())}`;
    if (kind === 'url') {
      let normalized;
      try { normalized = new URL(target).toString(); } catch (_) { throw new HttpsError('invalid-argument', 'Enter a complete URL including https:// or http://.'); }
      const id = Buffer.from(normalized).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      endpoint = `urls/${id}`;
    }
    const vt = await safeFetchJson('VirusTotal', `https://www.virustotal.com/api/v3/${endpoint}`, { headers: { 'x-apikey': vtKey, accept: 'application/json' } });
    if (vt) {
      const a = vt.data && vt.data.data && vt.data.data.attributes || {};
      const stats = a.last_analysis_stats || {};
      evidence.push({ provider: 'VirusTotal', found: vt.found, malicious: Number(stats.malicious || 0), suspicious: Number(stats.suspicious || 0), harmless: Number(stats.harmless || 0), undetected: Number(stats.undetected || 0), reputation: typeof a.reputation === 'number' ? a.reputation : null, lastAnalysisDate: a.last_analysis_date ? new Date(a.last_analysis_date * 1000).toISOString() : null, permalink: kind === 'hash' ? `https://www.virustotal.com/gui/file/${target}` : kind === 'domain' ? `https://www.virustotal.com/gui/domain/${target}` : kind === 'ip' ? `https://www.virustotal.com/gui/ip-address/${target}` : `https://www.virustotal.com/gui/url/${Buffer.from(new URL(target).toString()).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}` });
      sources.push({ title: 'VirusTotal reputation report', url: evidence[evidence.length - 1].permalink, provider: 'VirusTotal', retrievedAt: now });
    }
  }
  if (kind === 'ip' && abuseKey) {
    const abuse = await safeFetchJson('AbuseIPDB', `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(target)}&maxAgeInDays=90`, { headers: { Key: abuseKey, Accept: 'application/json' } });
    if (abuse && abuse.found) {
      const d = abuse.data && abuse.data.data || {};
      evidence.push({ provider: 'AbuseIPDB', found: true, abuseConfidenceScore: Number(d.abuseConfidenceScore || 0), totalReports: Number(d.totalReports || 0), countryCode: d.countryCode || null, usageType: d.usageType || null, isp: d.isp || null, lastReportedAt: d.lastReportedAt || null });
      sources.push({ title: 'AbuseIPDB IP check', url: `https://www.abuseipdb.com/check/${encodeURIComponent(target)}`, provider: 'AbuseIPDB', retrievedAt: now });
    }
  }
  if (otxKey && isIndicator) {
    let indicatorType = kind === 'ip' ? 'IPv4' : kind === 'domain' ? 'domain' : kind === 'url' ? 'url' : 'file';
    const otx = await safeFetchJson('AlienVault OTX', `https://otx.alienvault.com/api/v1/indicators/${indicatorType}/${encodeURIComponent(target)}/general`, { headers: { 'X-OTX-API-KEY': otxKey, Accept: 'application/json' } });
    if (otx && otx.found) {
      const d = otx.data || {};
      const pulses = Array.isArray(d.pulse_info && d.pulse_info.pulses) ? d.pulse_info.pulses.slice(0, 10).map(p => ({ name: p.name, created: p.created, modified: p.modified, tags: p.tags || [], link: p.adversary ? `https://otx.alienvault.com` : 'https://otx.alienvault.com' })) : [];
      evidence.push({ provider: 'AlienVault OTX', found: true, pulseCount: Number(d.pulse_info && d.pulse_info.count || 0), pulses });
      sources.push({ title: 'AlienVault OTX indicator', url: `https://otx.alienvault.com/indicator/${indicatorType}/${encodeURIComponent(target)}`, provider: 'AlienVault OTX', retrievedAt: now });
    }
  }
  let webAnalysis = null;
  if (geminiKey) {
    try {
      const context = JSON.stringify({ kind, target, evidence, sources, retrievedAt: now });
      const prompt = `You are a cybersecurity threat-intelligence analyst. Analyze ONLY the supplied indicator and collected evidence, and optionally search public web sources for corroboration. Do not invent scans, source links, incidents, CVEs or results. Do not infer personal characteristics. Treat missing provider data as unknown, not safe. Return valid JSON with keys: verdict (Malicious, Suspicious, No known indicators, or Insufficient evidence), riskScore (integer 0-100 or null if evidence is insufficient), summary (short string), findings (array of strings), recommendations (array of strings), limitations (array of strings), sources (array of {title,url}). Cite only real source URLs. Clearly distinguish provider findings from web-search context. If no evidence exists, say so. Input: ${context}`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(25000),
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } })
      });
      if (response.ok) {
        const json = await response.json();
        const candidate = json.candidates && json.candidates[0] || {};
        const text = (candidate.content && candidate.content.parts || []).map(p => p.text || '').join('');
        const groundedSources = (candidate.groundingMetadata && candidate.groundingMetadata.groundingChunks || []).map(chunk => chunk.web).filter(web => web && /^https?:\/\//i.test(web.uri || '')).map(web => ({ title: web.title || web.uri, url: web.uri }));
        groundedSourceCount += groundedSources.length;
        sources.push(...groundedSources);
        try { webAnalysis = JSON.parse(text.replace(/^```(?:json)?/i, '').replace(/```$/,'').trim()); }
        catch (_) { webAnalysis = { summary: text, verdict: 'Insufficient evidence', riskScore: null, findings: [], recommendations: [], limitations: ['AI output was not valid structured JSON. Review the raw summary.'], sources: [] }; }
      } else errors.push(`Gemini AI: HTTP ${response.status}`);
    } catch (_) { errors.push('Gemini AI: request failed or timed out'); }
  } else errors.push('Gemini AI is not configured');
  const maliciousCounts = evidence.map(e => Number(e.malicious || 0) + Number(e.suspicious || 0));
  const vtMalicious = evidence.reduce((sum, e) => sum + Number(e.malicious || 0), 0);
  const vtSuspicious = evidence.reduce((sum, e) => sum + Number(e.suspicious || 0), 0);
  const abuseScore = evidence.find(e => e.provider === 'AbuseIPDB');
  const deterministicEvidenceScore = Math.max(maliciousCounts.length ? Math.min(100, Math.max(...maliciousCounts) * 8) : 0, abuseScore ? Math.min(100, abuseScore.abuseConfidenceScore) : 0);
  const deterministicScore = (vtMalicious > 0 || vtSuspicious > 0 || (abuseScore && abuseScore.abuseConfidenceScore > 0)) ? deterministicEvidenceScore : null;
  const hasVerifiedEvidence = evidence.some(e => e.found === true) || groundedSourceCount > 0;
  const verdict = !hasVerifiedEvidence ? 'Insufficient evidence' : vtMalicious > 0 ? 'Malicious' : (vtSuspicious > 0 || (abuseScore && abuseScore.abuseConfidenceScore >= 50)) ? 'Suspicious' : (webAnalysis && webAnalysis.verdict) || 'Insufficient evidence';
  const riskScore = !hasVerifiedEvidence ? null : deterministicScore !== null ? deterministicScore : (webAnalysis && Number.isInteger(webAnalysis.riskScore) ? Math.max(0, Math.min(100, webAnalysis.riskScore)) : null);
  return {
    target, kind, collectedAt: now, verdict, riskScore,
    analysis: !hasVerifiedEvidence ? 'No verifiable provider record or Google Search grounding source was returned. This is an unknown result, not a clean verdict.' : (webAnalysis && (webAnalysis.summary || JSON.stringify(webAnalysis)) || 'Live provider data was collected, but AI analysis is unavailable. Review the raw provider results and source links.'),
    findings: hasVerifiedEvidence && webAnalysis && Array.isArray(webAnalysis.findings) ? webAnalysis.findings : [],
    recommendations: webAnalysis && Array.isArray(webAnalysis.recommendations) ? webAnalysis.recommendations : [],
    limitations: [...(webAnalysis && Array.isArray(webAnalysis.limitations) ? webAnalysis.limitations : []), ...(!hasVerifiedEvidence ? ['No verifiable evidence returned. This is not a clean verdict.'] : []), ...errors],
    evidence, sources: sources.filter((item, index, all) => all.findIndex(other => other.url === item.url) === index),
    configuredProviders: { virusTotal: !!vtKey, abuseIpDb: !!abuseKey, alienVaultOTX: !!otxKey, gemini: !!geminiKey },
    status: evidence.length || webAnalysis ? 'completed' : 'partial'
  };
});

// Server-side AI assistant. Never trust the browser for model credentials.
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
  if (!['premium','business','forensics'].includes(tier)) throw new HttpsError('invalid-argument', 'Choose a supported activation tier.');
  const linkedEmail = String(request.data && request.data.linkedEmail || '').trim().toLowerCase();
  if (linkedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linkedEmail)) throw new HttpsError('invalid-argument', 'Enter a valid linked email address.');
  const crypto = require('crypto');
  const segment = () => crypto.randomBytes(3).toString('hex').toUpperCase();
  const code = tier === 'forensics' ? `${segment()}-${segment()}-${segment()}` : `${segment()}-${segment()}-${segment()}-${segment()}`;
  await db.collection('activationCodes').add({ code, tier, createdBy: request.auth.uid, linkedEmail: linkedEmail || null, createdAt: new Date().toISOString(), used: false, usedBy: null, usedAt: null });
  return { code, tier, linkedEmail: linkedEmail || null };
});
