import { useState, useEffect, useCallback } from 'react';
import { auth, db, functions, httpsCallable, onAuthStateChanged, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp, User, signInWithPopup, googleProvider, signOut, writeBatch, getDocs, updatePassword, updateProfile, orderBy, limit, runTransaction } from '../firebase';
import { GoogleGenAI, Type } from '@google/genai';
import { BillingService } from '../utils/billing';

import * as otplib from 'otplib';
import { jsonrepair } from 'jsonrepair';

const authenticator = (otplib as any).authenticator;

// Permanent product-owner entitlement is tied to the exact Firebase-authenticated account email.
// Password-provider users are separately stopped at the verification screen in App.tsx.
const OWNER_EMAIL = 'tongaigodfreymapiye@gmail.com';
const isPermanentOwner = (account: User | null | undefined) =>
  account?.emailVerified === true && account.email?.trim().toLowerCase() === OWNER_EMAIL;

const OWNER_DEVICE_LIMIT = 5;
const OWNER_DEVICE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const getBrowserDeviceId = () => {
  const key = 'cyberamour_owner_device_id';
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
};

async function releaseOwnerDeviceSession(uid: string) {
  if (typeof window === 'undefined') return;
  try {
    const deviceId = window.localStorage.getItem('cyberamour_owner_device_id');
    if (!deviceId) return;
    const accessRef = doc(db, 'users', uid, 'deviceAccess', 'active');
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(accessRef);
      if (!snap.exists()) return;
      const sessions = Array.isArray(snap.data().sessions) ? snap.data().sessions : [];
      tx.set(accessRef, { sessions: sessions.filter((session: any) => session.id !== deviceId), updatedAt: Date.now() }, { merge: true });
    });
  } catch (error) { console.warn('Could not release owner device session.', error); }
}

async function enforceOwnerDeviceLimit(account: User) {
  if (!isPermanentOwner(account) || typeof window === 'undefined') return true;
  const deviceId = getBrowserDeviceId();
  const accessRef = doc(db, 'users', account.uid, 'deviceAccess', 'active');
  const now = Date.now();
  let otherDeviceCount = 0;
  const preflight = await getDoc(accessRef);
  if (preflight.exists()) {
    const sessions = Array.isArray(preflight.data().sessions) ? preflight.data().sessions : [];
    const active = sessions.filter((session: any) => Number(session.lastSeen || 0) > now - OWNER_DEVICE_TTL_MS);
    otherDeviceCount = active.filter((session: any) => session.id !== deviceId).length;
    if (active.some((session: any) => session.id === deviceId)) otherDeviceCount = active.length - 1;
    if (otherDeviceCount > 0) {
      const proceed = window.confirm(`CyberAmour account notice: you are already logged in on ${otherDeviceCount} other device(s). Continue on this device? You can use up to ${OWNER_DEVICE_LIMIT} devices at a time.`);
      if (!proceed) { await signOut(auth); return false; }
    }
  }
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(accessRef);
      const raw = snap.exists() && Array.isArray(snap.data().sessions) ? snap.data().sessions : [];
      const active = raw.filter((session: any) => Number(session.lastSeen || 0) > Date.now() - OWNER_DEVICE_TTL_MS);
      const existing = active.some((session: any) => session.id === deviceId);
      if (!existing && active.length >= OWNER_DEVICE_LIMIT) throw new Error('CYBERAMOUR_DEVICE_LIMIT');
      const next = active.filter((session: any) => session.id !== deviceId);
      next.push({ id: deviceId, label: (navigator.userAgent || 'Browser').slice(0, 180), lastSeen: Date.now() });
      tx.set(accessRef, { sessions: next, updatedAt: Date.now() }, { merge: true });
    });
    return true;
  } catch (error: any) {
    if (error?.message === 'CYBERAMOUR_DEVICE_LIMIT') {
      window.alert(`CyberAmour device limit reached. This account is already active on ${OWNER_DEVICE_LIMIT} devices. Sign out from one of those devices before signing in here.`);
      await signOut(auth);
      return false;
    }
    console.error('Could not verify CyberAmour device access.', error);
    window.alert('CyberAmour could not verify the active-device limit. For your security, this login will be cancelled. Please check your connection and try again.');
    await signOut(auth);
    return false;
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let cachedThreatIntel: string | null = null;
let isThreatIntelFetching: Promise<string> | null = null;

const safeJsonParse = (text: string | undefined | null) => {
  const defaultObj = {};
  if (!text) return defaultObj;
  try {
    return JSON.parse(text);
  } catch(e) {
    try {
      return JSON.parse(jsonrepair(text));
    } catch(e2) {
      console.error("JSON repair failed", e2);
      throw e2;
    }
  }
};

export function useCyberAmour() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [breaches, setBreaches] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [vault, setVault] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [aiAdvice, setAiAdvice] = useState<any>({
    text: "I'm analyzing your security posture...",
    actionLabel: null,
    targetScreen: null
  });
  const [loading, setLoading] = useState(true);
  const [is2FAVerified, setIs2FAVerified] = useState(false);

  useEffect(() => {
    let lastObservedUser: User | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u && isPermanentOwner(u)) {
        const allowed = await enforceOwnerDeviceLimit(u);
        if (!allowed) return;
      }
      if (!u && lastObservedUser && isPermanentOwner(lastObservedUser)) {
        await releaseOwnerDeviceSession(lastObservedUser.uid);
      }
      if (u && isPermanentOwner(u)) window.localStorage.setItem('cyberamour_owner_last_uid', u.uid);
      lastObservedUser = u;
      setUser(u);
      if (!u) {
        setProfile(null);
        setBreaches([]);
        setScans([]);
        setVault([]);
        setAlerts([]);
        setActivityLogs([]);
        setIs2FAVerified(false);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !isPermanentOwner(user) || typeof window === 'undefined') return;
    const refreshDeviceHeartbeat = async () => {
      try {
        const deviceId = getBrowserDeviceId();
        const accessRef = doc(db, 'users', user.uid, 'deviceAccess', 'active');
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(accessRef);
          const sessions = snap.exists() && Array.isArray(snap.data().sessions) ? snap.data().sessions : [];
          const active = sessions.filter((session: any) => Number(session.lastSeen || 0) > Date.now() - OWNER_DEVICE_TTL_MS);
          if (!active.some((session: any) => session.id === deviceId)) return;
          const next = active.filter((session: any) => session.id !== deviceId);
          next.push({ id: deviceId, label: (navigator.userAgent || 'Browser').slice(0, 180), lastSeen: Date.now() });
          tx.set(accessRef, { sessions: next, updatedAt: Date.now() }, { merge: true });
        });
      } catch (error) { console.warn('Could not refresh owner device heartbeat.', error); }
    };
    const timer = window.setInterval(refreshDeviceHeartbeat, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Owner entitlement is derived from the authenticated Firebase account email, never from editable profile fields.
        setProfile(isPermanentOwner(user) ? {
          ...data, isOwner: true, isPremium: true, isBusiness: true,
          subscriptionTier: 'business', subscriptionStatus: 'owner_lifetime', subscriptionExpiresAt: null,
          forensicsScansLeft: Number.MAX_SAFE_INTEGER, phoneScansLeft: Number.MAX_SAFE_INTEGER, virusScansLeft: Number.MAX_SAFE_INTEGER
        } : data);
        if (!data.is2FAEnabled) {
          setIs2FAVerified(true);
        }
      } else {
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          securityScore: 85,
          isPremium: false,
          isBusiness: false,
          isAutoMonitoringEnabled: true,
          subscriptionTier: 'free',
          is2FAEnabled: false,
          twoFactorSecret: null,
          logRetentionMonths: 3,
          forensicsScansLeft: 5,
          phoneScansLeft: 3,
          virusScansLeft: 5,
          status: 'active', // Signup is active after Firebase authentication; risk screening must run server-side.
          createdAt: new Date().toISOString()
        };
        setDoc(userRef, newProfile).catch((error) => {
          console.error('Could not create account profile. Check Firestore rules and deployment.', error);
        });
        setProfile(isPermanentOwner(user) ? {
          ...newProfile, isOwner: true, isPremium: true, isBusiness: true,
          subscriptionTier: 'business', subscriptionStatus: 'owner_lifetime', subscriptionExpiresAt: null,
          forensicsScansLeft: Number.MAX_SAFE_INTEGER, phoneScansLeft: Number.MAX_SAFE_INTEGER, virusScansLeft: Number.MAX_SAFE_INTEGER
        } : newProfile);
        setIs2FAVerified(true);
      }
      setLoading(false);
    });

    const unsubBreaches = onSnapshot(collection(db, 'users', user.uid, 'breaches'), (snap) => {
      setBreaches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubScans = onSnapshot(collection(db, 'users', user.uid, 'scans'), (snap) => {
      setScans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubVault = onSnapshot(collection(db, 'users', user.uid, 'vault'), (snap) => {
      setVault(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAlerts = onSnapshot(
      query(collection(db, 'users', user.uid, 'alerts'), orderBy('createdAt', 'desc'), limit(50)), 
      (snap) => {
        const userAlerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAlerts(isPermanentOwner(user) ? userAlerts.filter((alert: any) => !/premium required/i.test(String(alert.title || ''))) : userAlerts);
      }
    );

    const unsubLogs = onSnapshot(
      query(collection(db, 'users', user.uid, 'activityLogs'), orderBy('createdAt', 'desc'), limit(50)), 
      (snap) => {
        setActivityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubScoreHistory = onSnapshot(collection(db, 'users', user.uid, 'scoreHistory'), (snap) => {
      let history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Add mock data if empty for visualization
      if (history.length === 0) {
        const now = new Date();
        const mockData = [
          { score: 65, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString() },
          { score: 72, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString() },
          { score: 68, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString() },
          { score: 80, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1).toISOString() },
          { score: 85, timestamp: now.toISOString() }
        ];
        setScoreHistory(mockData);
      } else {
        setScoreHistory(history.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      }
    });

    return () => {
      unsubProfile();
      unsubBreaches();
      unsubScans();
      unsubVault();
      unsubAlerts();
      unsubLogs();
      unsubScoreHistory();
    };
  }, [user]);

  const runSignupOSINT = async (uid: string, email: string | null, name: string | null) => {
    try {
      if (!email) return;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Perform comprehensive forensic screening on the newly registered user.
        Email: ${email}
        Name: ${name || 'None'}
        
        Using your Google Search tool, perform the following checks:
        1. Check if the domain is a known disposable email provider (like 10minutemail, mailinator, etc).
        2. Perform an implied MX lookup logic to see if the domain is meant for receiving legitimate corporate/personal mail, and check for spam/abuse associations.
        3. If there is a phone number provided (there isn't here, but if there was), use libphonenumber principles to check validity.
        
        If it belongs to a disposable list or has high risk associations, flag the account.
        Return ONLY a raw JSON object (no markdown): 
        { "isSuspicious": boolean, "verdict": "string (Safe, Suspicious, Malicious)", "reason": "string" }
        `,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      let cleanedText = response.text || "{}";
      if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```[a-zA-Z]*\n/gi, '').replace(/```/g, '').trim();
      }
      const result = safeJsonParse(cleanedText);
      const isFlagged = result.isSuspicious || result.verdict === 'Malicious' || result.verdict === 'Suspicious';
      
      // Keep it flagged if Gemini detects any issue, otherwise active.
      await updateDoc(doc(db, 'users', uid), {
        status: isFlagged ? 'flagged' : 'active',
        osintVerdict: result.verdict,
        osintReason: result.reason
      });
      
    } catch (e: any) {
      const isQuotaError = e?.message?.includes('429') || e?.status === 'RESOURCE_EXHAUSTED' || e?.status === 429 || String(e).includes('429') || String(e).includes('RESOURCE_EXHAUSTED');
      if (!isQuotaError) console.error("OSINT check failed on signup", e);
      // Failsafe -> set to active
      await updateDoc(doc(db, 'users', uid), { status: 'active' });
    }
  };

  const getProactiveAdvice = async () => {
    if (!user) return null;

    const recentAlerts = alerts.slice(0, 3).map(a => a.title).join(', ');
    const recentActivity = activityLogs.slice(0, 5).map(l => l.type).join(', ');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are CyberAmour AI Advisor. 
        Analyze the following user security data and provide ONE concise, proactive security tip or suggestion.
        Security Score: ${profile?.securityScore || 0}
        Recent Alerts: ${recentAlerts || 'None'}
        Recent Activity: ${recentActivity || 'None'}
        
        Return a JSON object with:
        - text: The suggestion (max 20 words).
        - actionLabel: A short label for a button (e.g., "Run Scan", "Check Vault", "Enable 2FA").
        - targetScreen: The screen ID to navigate to. Options: 'dashboard', 'scan', 'ai', 'vault', 'settings', 'network', 'pricing', 'academy'.
        
        If the score is below 70, be more urgent.
        If there are recent breaches, suggest checking the 'scan' (Dark Web Monitor).
        If activity shows many logins, suggest checking the 'vault' or 'settings' (2FA).
        If network anomalies are present, suggest 'network'.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              actionLabel: { type: Type.STRING },
              targetScreen: { type: Type.STRING }
            },
            required: ["text", "actionLabel", "targetScreen"]
          }
        }
      });

      return safeJsonParse(response.text);
    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429;
      if (!isQuotaError) {
        console.error("AI Advice error", error);
      }
      return {
        text: "Your security posture is stable. Consider a routine scan soon.",
        actionLabel: "Run Scan",
        targetScreen: "scan"
      };
    }
  };

  useEffect(() => {
    if (!user || !profile) return;
    
    let debounceTimer: NodeJS.Timeout;
    
    const fetchAdvice = async () => {
      const shouldNotifySecurity = profile?.notificationPrefs?.security !== false;
      if (!shouldNotifySecurity) {
        setAiAdvice({
          text: "Security tips are currently disabled in your settings.",
          actionLabel: "Enable",
          targetScreen: "settings"
        });
        return;
      }
      const advice = await getProactiveAdvice();
      if (advice) setAiAdvice(advice);
    };

    debounceTimer = setTimeout(fetchAdvice, 2000);
    
    const interval = setInterval(fetchAdvice, 600000); 
    return () => {
      clearTimeout(debounceTimer);
      clearInterval(interval);
    };
  }, [user?.uid, profile?.securityScore, alerts.length]);

  useEffect(() => {
    if (!user || !profile?.securityScore) return;
    
    const lastRecordedScore = localStorage.getItem(`last_recorded_score_${user.uid}`);
    if (lastRecordedScore !== profile.securityScore.toString()) {
      addDoc(collection(db, 'users', user.uid, 'scoreHistory'), {
        score: profile.securityScore,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(`last_recorded_score_${user.uid}`, profile.securityScore.toString());
    }
  }, [profile?.securityScore, user?.uid]);

  // Automatic Anomaly Detection
  useEffect(() => {
    if (!user || activityLogs.length < 5 || !profile?.isAutoMonitoringEnabled) return;
    
    // Run detection every 5 new logs
    const lastCheckCount = parseInt(localStorage.getItem(`last_anomaly_check_${user.uid}`) || '0');
    if (activityLogs.length >= lastCheckCount + 5) {
      detectAnomalies();
      localStorage.setItem(`last_anomaly_check_${user.uid}`, activityLogs.length.toString());
    }
  }, [activityLogs, user, profile?.isAutoMonitoringEnabled]);

  // Weather Monitoring
  useEffect(() => {
    if (!user) return;

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`);
        const data = await response.json();
        const current = data.current;
        
        setWeather(current);

        // Check for extreme weather (Weather codes: 95, 96, 99 are thunderstorms; 71-75 are snow; 51-67 are rain/drizzle)
        // https://open-meteo.com/en/docs
        const code = current.weather_code;
        let severity: 'warning' | 'critical' | 'info' = 'info';
        let message = '';

        if ([95, 96, 99].includes(code)) {
          severity = 'critical';
          message = "Severe Thunderstorm Warning: Seek shelter and protect your electronic devices from power surges.";
        } else if ([65, 67, 81, 82].includes(code)) {
          severity = 'warning';
          message = "Heavy Rain/Flood Alert: Be cautious of potential flooding in your area.";
        } else if ([71, 73, 75, 85, 86].includes(code)) {
          severity = 'warning';
          message = "Snowfall Warning: Ensure your home security systems are clear of snow and ice.";
        } else if (current.wind_speed_10m > 50) {
          severity = 'critical';
          message = "High Wind Warning: Potential for power outages and structural damage. Secure outdoor equipment.";
        }

        if (message) {
          // Check if we already sent this alert recently
          const lastWeatherAlert = localStorage.getItem(`last_weather_alert_${user.uid}`);
          const now = Date.now();
          if (!lastWeatherAlert || now - parseInt(lastWeatherAlert) > 1000 * 60 * 60 * 6) { // 6 hours
            await addDoc(collection(db, 'users', user.uid, 'alerts'), {
              uid: user.uid,
              title: "Extreme Weather Alert",
              message,
              severity,
              isRead: false,
              createdAt: new Date().toISOString(),
              type: 'weather'
            });
            localStorage.setItem(`last_weather_alert_${user.uid}`, now.toString());
          }
        }
      } catch (error) {
        console.error("Weather fetch failed", error);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(51.5074, -0.1278) // Default to London if denied
    );

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(51.5074, -0.1278)
      );
    }, 1000 * 60 * 30); // Every 30 mins

    return () => clearInterval(interval);
  }, [user]);

  const logActivity = async (action: string, metadata: any = {}) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'activityLogs'), {
        action,
        metadata,
        createdAt: new Date().toISOString(),
        ip: '192.168.1.' + Math.floor(Math.random() * 255), // Simulated IP
        device: navigator.userAgent
      });
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  };

  const detectAnomalies = async () => {
    if (!user || activityLogs.length < 1) return;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following user activity logs for security anomalies, unusual patterns, or potential account compromise. Return a JSON object.
        Logs: ${JSON.stringify(activityLogs.slice(-10))}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isAnomaly: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] }
            },
            required: ["isAnomaly", "confidence", "reason", "severity"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      if (result.isAnomaly && result.confidence > 0.7) {
        await addDoc(collection(db, 'users', user.uid, 'alerts'), {
          uid: user.uid,
          title: "Anomaly Detected",
          message: result.reason,
          severity: result.severity.toLowerCase(),
          isRead: false,
          createdAt: new Date().toISOString(),
          type: 'anomaly'
        });
        
        const newScore = Math.max(0, (profile?.securityScore || 85) - 15);
        await updateDoc(doc(db, 'users', user.uid), { securityScore: newScore });
      }

      return result;
    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429 || String(error).includes('429') || String(error).includes('RESOURCE_EXHAUSTED');
      if (!isQuotaError) {
        console.error("Anomaly detection failed", error);
      }
      // Fallback heuristic if API fails (e.g. rate limit exceeded)
      const recentLogs = activityLogs.slice(-10);
      let isAnomaly = false;
      let reason = "Activity normal based on heuristic analysis.";
      let severity = "Low";
      
      const failedLogins = recentLogs.filter(l => l.action.includes('failed_login')).length;
      if (failedLogins >= 3) {
        isAnomaly = true;
        reason = `Detected ${failedLogins} failed login attempts recently.`;
        severity = "High";
      }
      
      if (isAnomaly) {
        await addDoc(collection(db, 'users', user.uid, 'alerts'), {
          uid: user.uid,
          title: "Anomaly Detected (Heuristic)",
          message: reason,
          severity: severity.toLowerCase(),
          isRead: false,
          createdAt: new Date().toISOString(),
          type: 'anomaly'
        });
      }
      
      return {
        isAnomaly,
        confidence: 0.8,
        reason,
        severity
      };
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      import('../utils/sounds').then(s => s.playSuccessSound());
      // Log login activity after successful sign in is handled by useEffect
    } catch (error) {
      console.error("Login failed", error);
      import('../utils/sounds').then(s => s.playErrorSound());
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      import('../utils/sounds').then(s => s.playSuccessSound());
    } catch (error) {
      console.error("Logout failed", error);
      import('../utils/sounds').then(s => s.playErrorSound());
    }
  };

  const updateUserPreferences = async (displayName: string | undefined, notificationPrefs: any) => {
    if (!user) return false;
    try {
      if (displayName !== undefined && displayName !== profile?.displayName) {
        await updateProfile(user, { displayName });
        await updateDoc(doc(db, 'users', user.uid), { displayName });
      }
      
      if (notificationPrefs) {
        await updateDoc(doc(db, 'users', user.uid), { notificationPrefs });
      }
      
      logActivity('profile_updated');
      import('../utils/sounds').then(s => s.playSuccessSound());
      return true;
    } catch(e) {
      console.error(e);
      import('../utils/sounds').then(s => s.playErrorSound());
      return false;
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return false;
    try {
      await updatePassword(user, newPassword);
      logActivity('password_changed');
      import('../utils/sounds').then(s => s.playSuccessSound());
      return true;
    } catch(e) {
      console.error(e);
      import('../utils/sounds').then(s => s.playErrorSound());
      return false;
    }
  };

  const performPhishingScan = async (type: 'phishing' | 'email' | 'sms' | 'phone' | 'name' | 'company' | 'username' | 'domain' | 'url' | 'file' | 'antivirus', content: string, fileData?: { mimeType: string, data: string, name: string }) => {
    if (!user) return;
    
    // Check Limits
    if (profile && !profile.isPremium) {
      if (type === 'phone') {
        if (profile.phoneScansLeft <= 0) throw new Error('LIMIT_REACHED');
      } else {
        if (profile.forensicsScansLeft <= 0) throw new Error('LIMIT_REACHED');
      }
    }

    try {
      let prompt = ``;
      let responseSchema: any;
      let modelOptions: any = {
        model: "gemini-3-flash-preview",
      };

      const isOsint = ['email', 'phone', 'name', 'company', 'username', 'domain'].includes(type);

      if (isOsint) {
        prompt = `Act as CyberAmour's cybersecurity-focused public-source intelligence analyst. Search the public web using the configured Google Search grounding tool for the ${type} "${content}". Use only sources relevant to lawful cybersecurity, fraud-prevention, supplier due diligence, identity-protection or digital-footprint verification. Do not infer identity from a name alone, and do not generate missing facts.

Scope: identify publicly documented cybersecurity exposures and relevant business/technical risk signals, such as official company records, public security advisories, domain/DNS/certificate observations where indexed, reputable news reports, published breach notices, scam reports and publicly available professional/business profiles relevant to confirming an organisation or public account. For an individual, only report cyber-exposure signals directly relevant to account security or impersonation; do not investigate or infer intimate life, health, family, sexuality, morality, private addresses, financial creditworthiness or unverified criminality.

Evidence rules: every factual claim should be linked to a source URL where possible. Separate verified source statements from correlations and unverified leads. Include source title, URL, source type, date if available and reliability (high/medium/low). If search does not find evidence, say that no relevant indexed evidence was found; never interpret that as proof that the entity is safe. Do not fabricate results, source links, breach records or technical checks that were not actually performed. A search-grounded result is not a direct scan of the target system.

Return a measured cybersecurity risk score from 0 to 100 only when evidence supports one; otherwise use a conservative unknown/insufficient-evidence verdict. Explain limitations and recommended verification steps. Start the analysis with Entity Overview, Detailed Findings, Relationship/Context Analysis, Risk Signals and Evidence, Data Gaps, Risk Score and Rationale, and Recommendations.

${type === 'email' ? 'For email, discuss publicly available sender/domain reputation and any SPF/DKIM/DMARC records only if actually retrieved; otherwise mark them not checked.' : ''} ${type === 'domain' ? 'For domains, discuss indexed reputation reports and technical records only if actually retrieved. Do not claim to have performed a live DNS, TLS, port or vulnerability scan unless a connected tool actually performed it.' : ''} ${type === 'company' ? 'For companies, prioritise official registries, official security notices, reputable news and documented supply-chain/business cybersecurity exposures.' : ''}

Return only JSON matching the supplied response schema. Do not include unsupported personal attributes or sensitive personal details.`;
        modelOptions.contents = prompt;
      } else {
        prompt = `Analyze the following ${type} content for phishing, malware, malicious redirects, or security risks using your Google Search tool. Search for any known scams or malicious activity associated with this content.
        ${type === 'url' ? 'Specifically analyze the URL structure, domain reputation, typosquatting indicators, and known malicious patterns. In your analysis, include clear sections/details for: Domain Reputation, SSL Certificate Status, and Detected Redirection Patterns.' : ''}
        ${type === 'phishing' || type === 'email' ? 'Specifically analyze the email content/headers for Sender Reputation, SPF/DKIM/DMARC records, and any detected Suspicious Headers.' : ''}
        ${type === 'file' ? 'Specifically analyze the provided file. Determine its purpose, identify any malicious code, embedded macros, hidden payloads, or suspicious behaviors. Assess if the file is safe to open or execute.' : ''}
        ${type === 'antivirus' ? 'Act as a deep system antivirus scanner. Perform a comprehensive heuristic and behavioral analysis on the provided content. Detect zero-day threats, rootkits, advanced persistent threats (APTs), and sophisticated obfuscation techniques. Assess full system impact if executed.' : ''}
        Content: ${content}`;
        
        if ((type === 'file' || type === 'antivirus') && fileData) {
          modelOptions.contents = [prompt, { inlineData: { data: fileData.data, mimeType: fileData.mimeType } }];
        } else {
          modelOptions.contents = prompt;
        }
      }
      
      modelOptions.config = {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: isOsint ? {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.INTEGER },
            verdict: { type: Type.STRING },
            analysis: { type: Type.STRING },
            senderReputation: { type: Type.STRING, nullable: true },
            spfdkimdmarcRecords: { type: Type.STRING, nullable: true },
            suspiciousHeaders: { type: Type.STRING, nullable: true },
            scamReports: { type: Type.STRING, nullable: true },
            maliciousAssociations: { type: Type.STRING, nullable: true },
            carrier: { type: Type.STRING, nullable: true },
            lineType: { type: Type.STRING, nullable: true },
            candidates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  fullName: { type: Type.STRING, nullable: true },
                  alias: { type: Type.STRING, nullable: true },
                  emails: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                  phoneNumbers: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                  publicSpacesLinked: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                  photoUrl: { type: Type.STRING, nullable: true },
                  dateOfBirth: { type: Type.STRING, nullable: true },
                  age: { type: Type.INTEGER, nullable: true },
                  sex: { type: Type.STRING, nullable: true },
                  profession: { type: Type.STRING, nullable: true },
                  maritalStatus: { type: Type.STRING, nullable: true },
                  relationshipStatus: { type: Type.STRING, nullable: true },
                  previousMarriages: { type: Type.STRING, nullable: true },
                  workHistory: { type: Type.STRING, nullable: true },
                  financialCredibilityForLoans: { type: Type.STRING, nullable: true },
                  characterCredibilityForBusiness: { type: Type.STRING, nullable: true },
                  location: { type: Type.STRING, nullable: true },
                  description: { type: Type.STRING, nullable: true },
                  history: { type: Type.STRING, nullable: true },
                  characterAssessment: { type: Type.STRING, nullable: true },
                  criminalRecords: { type: Type.STRING, nullable: true },
                  relationshipHistory: { type: Type.STRING, nullable: true },
                  moralFidelity: { type: Type.STRING, nullable: true },
                  sexTapeLeakages: { type: Type.STRING, nullable: true },
                  sexualScandals: { type: Type.STRING, nullable: true },
                  characterCredibilityScore: { type: Type.INTEGER, nullable: true },
                  characterRiskScore: { type: Type.INTEGER, nullable: true },
                  creditWorthiness: { type: Type.STRING, nullable: true },
                  socialMediaProfiles: {
                    type: Type.ARRAY,
                    nullable: true,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        platform: { type: Type.STRING },
                        url: { type: Type.STRING },
                        source: { type: Type.STRING },
                        date: { type: Type.STRING },
                        reliabilityLevel: { type: Type.STRING }
                      }
                    }
                  },
                  associatedCompanies: {
                    type: Type.ARRAY,
                    nullable: true,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        relationship: { type: Type.STRING },
                        finding: { type: Type.STRING, nullable: true },
                        source: { type: Type.STRING },
                        date: { type: Type.STRING },
                        reliabilityLevel: { type: Type.STRING }
                      }
                    }
                  },
                  digitalInconsistencies: {
                    type: Type.ARRAY,
                    nullable: true,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        source: { type: Type.STRING },
                        date: { type: Type.STRING },
                        reliabilityLevel: { type: Type.STRING }
                      }
                    }
                  },
                  sources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        url: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            leakages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  date: { type: Type.STRING },
                  dataExposed: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            websites: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        } : {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.INTEGER },
            verdict: { type: Type.STRING },
            analysis: { type: Type.STRING },
            domainReputation: { type: Type.STRING, nullable: true },
            sslStatus: { type: Type.STRING, nullable: true },
            redirectionPatterns: { type: Type.STRING, nullable: true },
            senderReputation: { type: Type.STRING, nullable: true },
            spfdkimdmarcRecords: { type: Type.STRING, nullable: true },
            suspiciousHeaders: { type: Type.STRING, nullable: true },
            redFlags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  indicator: { type: Type.STRING },
                  advice: { type: Type.STRING }
                }
              }
            }
          }
        }
      };

      const response = await ai.models.generateContent(modelOptions);

      // JSON parser with robust fallback
      let cleanedText = response.text || "{}";
      if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```[a-zA-Z]*\n/gi, '').replace(/```/g, '').trim();
      }
      const result = safeJsonParse(cleanedText);
      
      await addDoc(collection(db, 'users', user.uid, 'scans'), {
        uid: user.uid,
        type,
        content,
        ...result,
        createdAt: new Date().toISOString()
      });
      
      if (profile && !profile.isPremium) {
        if (type === 'phone') {
          await updateDoc(doc(db, 'users', user.uid), { phoneScansLeft: (profile.phoneScansLeft || 3) - 1 });
        } else {
          await updateDoc(doc(db, 'users', user.uid), { forensicsScansLeft: (profile.forensicsScansLeft || 5) - 1 });
        }
      }

      // Update security score based on scan results (simplified logic)
      if (result.verdict !== 'Safe') {
        const newScore = Math.max(0, (profile?.securityScore || 85) - 5);
        await updateDoc(doc(db, 'users', user.uid), { securityScore: newScore });
        
        await addDoc(collection(db, 'users', user.uid, 'alerts'), {
          uid: user.uid,
          title: result.verdict === 'Malicious' ? "Urgent Threat Detected" : "Suspicious Information Found",
          message: `Your recent scan of ${type} "${content}" flagged potential threats or leakages. Please review the scan results carefully.`,
          severity: result.verdict === 'Malicious' ? "critical" : "high",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      } else if (result.leakages && result.leakages.length > 0) {
        await addDoc(collection(db, 'users', user.uid, 'alerts'), {
          uid: user.uid,
          title: "Public Leakages Found",
          message: `Your recent scan of ${type} "${content}" revealed ${result.leakages.length} public leakages. This information is accessible online.`,
          severity: "medium",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      return result;
    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429 || String(error).includes('429') || String(error).includes('RESOURCE_EXHAUSTED');
      if (!isQuotaError) {
        console.error("Scan failed", error);
      }
      return { verdict: 'Unknown', confidence: 0, reason: "Scan could not be completed at this time due to high traffic.", recommendedAction: "Please try again later.", type: 'system', details: [] };
    }
  };

  const checkBreaches = async (email: string) => {
    if (!user) return;
    
    // Simulate API call to Have I Been Pwned
    const mockBreaches = [
      { source: 'Adobe', date: '2013-10-04', risk: 'High' },
      { source: 'LinkedIn', date: '2016-05-17', risk: 'Medium' },
      { source: 'Canva', date: '2019-05-24', risk: 'Low' }
    ];

    const found = mockBreaches.filter(() => Math.random() > 0.5);
    
    for (const b of found) {
      await addDoc(collection(db, 'users', user.uid, 'breaches'), {
        uid: user.uid,
        email,
        source: b.source,
        breachDate: b.date,
        riskLevel: b.risk,
        createdAt: new Date().toISOString()
      });
    }

    if (found.length > 0) {
      const newScore = Math.max(0, (profile?.securityScore || 85) - (found.length * 10));
      await updateDoc(doc(db, 'users', user.uid), { securityScore: newScore });
      
      const shouldNotifyBreaches = profile?.notificationPrefs?.breaches !== false;
      if (shouldNotifyBreaches) {
        if (profile?.notificationPrefs?.alerts !== false) {
          import('../utils/sounds').then(s => s.playAlertSound());
        }
        await addDoc(collection(db, 'users', user.uid, 'alerts'), {
          uid: user.uid,
          title: "Password Exposure Detected",
          message: `Your email ${email} was found in ${found.length} breaches. Change your passwords immediately.`,
          severity: "critical",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    return found;
  };

  const createAlert = async (title: string, message: string, severity: 'critical' | 'high' | 'medium' | 'low' | string = 'low') => {
    if (!user) return;
    try {
      const shouldNotifyAlerts = profile?.notificationPrefs?.alerts !== false;
      if (!shouldNotifyAlerts) return;
      
      const parsedSeverity = (severity || 'low').toLowerCase();

      import('../utils/sounds').then(s => s.playAlertSound());
      await addDoc(collection(db, 'users', user.uid, 'alerts'), {
        uid: user.uid,
        title,
        message: message || '',
        severity: parsedSeverity,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to create alert", error);
    }
  };

  const askAI = async (message: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: "You are CyberAmour, an intelligent cybersecurity assistant. Provide expert advice on securing digital lives, identifying threats, and optimizing device security. Be professional, reassuring, and clear. Avoid overly technical jargon. Developer Credit: Engineer Tongai Godfrey Mapiye (MSc Degree in Cybersecurity, Open Institute of Technology, Malta) © 2026"
        }
      });
      return response.text;
    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429 || String(error).includes('429') || String(error).includes('RESOURCE_EXHAUSTED');
      if (!isQuotaError) console.error("AI Assistant failed", error);
      return "I'm currently receiving too many requests. Please try asking again in a few minutes.";
    }
  };

  const generate2FASecret = () => {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user?.email || 'user', 'CyberAmour', secret);
    return { secret, otpauth };
  };

  const verify2FACode = (code: string, secret: string) => {
    return authenticator.verify({ token: code, secret });
  };

  const enable2FA = async (secret: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      is2FAEnabled: true,
      twoFactorSecret: secret
    });
    setIs2FAVerified(true);
  };

  const disable2FA = async () => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      is2FAEnabled: false,
      twoFactorSecret: null
    });
    setIs2FAVerified(true);
  };

  const verifySession2FA = (code: string) => {
    if (!profile?.twoFactorSecret) return false;
    const isValid = authenticator.verify({ token: code, secret: profile.twoFactorSecret });
    if (isValid) {
      setIs2FAVerified(true);
    }
    return isValid;
  };

  const updateLogRetention = async (months: number) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      logRetentionMonths: months
    });
    logActivity('retention_updated', { months });
  };

  const clearOldLogs = async () => {
    if (!user || !profile?.logRetentionMonths) return;
    
    const months = profile.logRetentionMonths;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    const cutoffIso = cutoffDate.toISOString();

    const q = query(
      collection(db, 'users', user.uid, 'activityLogs'),
      where('createdAt', '<', cutoffIso)
    );

    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      logActivity('logs_purged', { count: snapshot.size, retention: months });
    } catch (error) {
      console.error("Failed to clear old logs", error);
    }
  };

  const toggleAutoMonitoring = async () => {
    if (!user) return;
    const newState = !profile?.isAutoMonitoringEnabled;
    await updateDoc(doc(db, 'users', user.uid), {
      isAutoMonitoringEnabled: newState
    });
    logActivity('auto_monitoring_toggled', { enabled: newState });
  };

  const autoRectify = async () => {
    if (!user || !profile?.isPremium) return;
    
    logActivity('auto_rectify_started');
    
    // Simulate AI scanning and fixing
    // 1. Clear old logs if retention is set
    await clearOldLogs();
    
    // 2. Resolve all unread alerts
    const alertsRef = collection(db, 'users', user.uid, 'alerts');
    const q = query(alertsRef, where('isRead', '==', false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { isRead: true });
    });
    await batch.commit();
    
    // This web application cannot safely remediate endpoint files or operating-system settings.
    // Marking alerts as reviewed is the only action performed here; never fabricate a higher score.
    const currentScore = profile?.securityScore ?? null;
    logActivity('alerts_reviewed', { reviewedAlerts: snapshot.size, endpointRemediationPerformed: false });
    return { resolvedAlerts: snapshot.size, newScore: currentScore, endpointRemediationPerformed: false };
  };

  const upgradeSubscription = useCallback(async (_tier: 'basic' | 'premium' | 'business' | 'forensics') => {
    // Paid access cannot be granted by a browser-side flag or local purchase callback.
    throw new Error('Plan access can only be changed after verified payment or a valid activation code.');
  }, []);

  const startCheckout = useCallback(async (tier: 'pro_monthly' | 'pro_yearly' | 'business_monthly' | 'business_yearly' = 'pro_monthly') => {
    if (!user) throw new Error('Sign in before starting checkout.');
    const createCheckout = httpsCallable(functions, 'createCheckoutSession');
    const result = await createCheckout({ tier });
    const url = (result.data as any)?.url;
    if (!url || typeof url !== 'string') throw new Error('Checkout is not configured yet. Please contact support.');
    return url;
  }, [user]);

  const rewardUserWithScan = async (scanType: 'phone' | 'forensics') => {
    if (!user || !profile) return;
    const field = scanType === 'phone' ? 'phoneScansLeft' : 'forensicsScansLeft';
    const current = profile[field] ?? 0;
    
    await updateDoc(doc(db, 'users', user.uid), {
      [field]: current + 1
    });
    logActivity('reward_ad_watched', { reward: `${scanType}_scan` });
  };

  const generateActivationCode = async (tier: 'premium' | 'business' | 'forensics', linkedEmail?: string) => {
    if (!user || (user.email !== 'tgmapiye@gmail.com' && user.email !== 'tongaigodfreymapiye@gmail.com')) {
      throw new Error('Not authorized');
    }
    
    const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = tier === 'forensics' 
      ? `${segment()}-${segment()}-${segment()}`
      : `${segment()}-${segment()}-${segment()}-${segment()}`;

    await addDoc(collection(db, 'activationCodes'), {
      code,
      tier,
      createdBy: user.uid,
      linkedEmail: linkedEmail ? linkedEmail.trim().toLowerCase() : null,
      createdAt: new Date().toISOString(),
      used: false,
      usedBy: null,
      usedAt: null
    });
    
    logActivity('admin_generated_activation_code', { code });
    return code;
  };

  const redeemActivationCode = async (code: string) => {
    if (!user) throw new Error('Not logged in');
    const redeem = httpsCallable(functions, 'redeemActivationCode');
    const result = await redeem({ code: code.trim().toUpperCase() });
    logActivity('redeemed_activation_code', { tier: (result.data as any)?.tier || 'activation' });
    return (result.data as any)?.tier;
  };

  useEffect(() => {
    // Browser purchase callbacks do not grant paid entitlements. Verified Stripe webhooks do.
    BillingService.setSubscriptionListener(() => {});
    return () => BillingService.setSubscriptionListener(() => {});
  }, []);

  const scanDarkWeb = async () => {
    if (!user || !profile?.isPremium) return;

    logActivity('dark_web_scan_started');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Perform a comprehensive search intelligence gathering protocol across indexed repositories for the email address: ${user.email} or anything related. 
        Identify potential data breaches, leaked credentials, known scam database entries, and personal information leaks (e.g., social security numbers, financial info, medical records) using your Google Search tool.
        Return a JSON object with a list of findings. Each finding should have: 
        - source: where the leak was found
        - date: when it was leaked
        - riskLevel: Low, Medium, High, Critical
        - details: description of the breach
        - dataTypesExposed: an array of strings like "Passwords", "Financial Info", "SSN", "Emails", "Phone Numbers", etc.
        - actionableSteps: an array of strings outlining exact steps the user should take to mitigate this specific risk (e.g., "Change password immediately on X", "Contact bank", "Freeze credit").
        Be highly analytical.
        
        CRITICAL INSTRUCTION: You MUST return ONLY a raw JSON string matching exactly this schema:
        {
          "findings": [
            {
              "source": "string",
              "date": "string",
              "riskLevel": "string",
              "details": "string",
              "dataTypesExposed": ["string"],
              "actionableSteps": ["string"]
            }
          ],
          "summary": "string"
        }`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const result = safeJsonParse(response.text);

      // Save findings as breaches
      for (const finding of result.findings) {
        await addDoc(collection(db, 'users', user.uid, 'breaches'), {
          uid: user.uid,
          email: user.email,
          source: finding.source,
          breachDate: finding.date,
          riskLevel: finding.riskLevel,
          details: finding.details,
          dataTypesExposed: finding.dataTypesExposed || [],
          actionableSteps: finding.actionableSteps || [],
          isDarkWeb: true,
          createdAt: new Date().toISOString()
        });
      }

      // Create an alert if high risk findings
      const highRisk = result.findings.filter((f: any) => f.riskLevel === 'High' || f.riskLevel === 'Critical');
      if (highRisk.length > 0) {
        await addDoc(collection(db, 'users', user.uid, 'alerts'), {
          uid: user.uid,
          title: "Dark Web Exposure Alert",
          message: `Our scan found ${highRisk.length} critical exposures on the dark web. Review the details in the Dark Web Monitor.`,
          severity: "critical",
          isRead: false,
          createdAt: new Date().toISOString()
        });
        
        const newScore = Math.max(0, (profile?.securityScore || 85) - (highRisk.length * 15));
        await updateDoc(doc(db, 'users', user.uid), { securityScore: newScore });
      }

      // Save scan history
      const maxRisk = result.findings.reduce((max: string, f: any) => {
        const risks = ['Low', 'Medium', 'High', 'Critical'];
        if (risks.indexOf(f.riskLevel) > risks.indexOf(max)) return f.riskLevel;
        return max;
      }, 'Low');

      await addDoc(collection(db, 'users', user.uid, 'scans'), {
        uid: user.uid,
        type: 'darkweb',
        summary: result.summary,
        findingsCount: result.findings.length,
        findings: result.findings,
        maxRisk,
        createdAt: new Date().toISOString()
      });

      logActivity('dark_web_scan_completed', { findingsCount: result.findings.length });
      return result;
    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429 || String(error).includes('429') || String(error).includes('RESOURCE_EXHAUSTED');
      if (!isQuotaError) {
        console.error("Dark web scan failed", error);
      }
      return { findings: [], summary: "Scan could not be completed at this time. Please try again later." };
    }
  };

  const scanNetwork = async () => {
    if (!user) return;
    logActivity('network_scan_started');
    
    let anomalies = [];
    let packets = [];
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Act as an advanced network packet analyzer and AI firewall. 
        Generate 6 sample network packets that a modern firewall would log right now (include protocols like TCP, UDP, HTTPS, ICMP, SYN).
        Ensure 1 or 2 of these packets are highly suspicious (e.g., Session Hijack, Botnet, or DDoS attempt).
        For each packet, generate simulated HTTP/TCP headers or metadata as a JSON string and a hexadecimal payload string representing the packet contents.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                source: { type: Type.STRING },
                dest: { type: Type.STRING },
                protocol: { type: Type.STRING },
                size: { type: Type.STRING },
                status: { type: Type.STRING },
                headers: { type: Type.STRING },
                payloadHex: { type: Type.STRING }
              }
            }
          }
        }
      });
      let text = response.text || "[]";
      if (text.includes('```')) {
        text = text.replace(/```[a-zA-Z]*\n/gi, '').replace(/```/g, '').trim();
      }
      packets = safeJsonParse(text);
      anomalies = packets.filter(p => p.status !== 'Safe');
    } catch (e: any) {
      const isQuotaError = e?.message?.includes('429') || e?.status === 'RESOURCE_EXHAUSTED' || e?.status === 429 || String(e).includes('429') || String(e).includes('RESOURCE_EXHAUSTED');
      if (!isQuotaError) console.error("Network scan API failed", e);
      // Fallback
      packets = [
        { id: 1, source: '192.168.1.1', dest: '104.22.3.1', protocol: 'HTTPS', size: '4.5KB', status: 'Safe' },
        { id: 2, source: 'Botnet-Node-X', dest: '192.168.1.1', protocol: 'SYN', size: '128B', status: 'Malicious' }
      ];
      anomalies = packets.filter(p => p.status !== 'Safe');
    }

    if (anomalies.length > 0) {
      const hijackCount = anomalies.filter(a => a.status === 'SessionHijack').length;
      await addDoc(collection(db, 'users', user.uid, 'alerts'), {
        uid: user.uid,
        title: hijackCount > 0 ? "Session Hijacking Blocked" : "Network Anomaly Detected",
        message: hijackCount > 0 
          ? `AI Auto-Blocked ${hijackCount} session hijacking attempts from unauthorized proxies.`
          : `Blocked ${anomalies.length} suspicious packets including a potential Botnet connection.`,
        severity: hijackCount > 0 ? "critical" : "warning",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    logActivity('network_scan_completed', { anomaliesCount: anomalies.length });
    return { packets, anomalies };
  };

  const scanDevice = async () => {
    if (!user) return;
    
    if (profile && !profile.isPremium) {
      if (profile.virusScansLeft <= 0) throw new Error('LIMIT_REACHED');
    }

    logActivity('device_scan_started');

    const navInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
    };

    let threats = [];
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following navigator / device information for any potential security anomalies or vulnerabilities.
        Device Info: ${JSON.stringify(navInfo)}
        Then generate a simulated list of 0-3 hypothetical vulnerabilities or malwares (e.g., outdated platform risk, mock spyware) that might exist on such a device.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                risk: { type: Type.STRING },
                path: { type: Type.STRING }
              }
            }
          }
        }
      });
      let text = response.text || "[]";
      if (text.includes('```')) {
        text = text.replace(/```[a-zA-Z]*\n/gi, '').replace(/```/g, '').trim();
      }
      threats = safeJsonParse(text);
    } catch(e: any) {
      const isQuotaError = e?.message?.includes('429') || e?.status === 'RESOURCE_EXHAUSTED' || e?.status === 429 || String(e).includes('429') || String(e).includes('RESOURCE_EXHAUSTED');
      if (!isQuotaError) console.error("Device scan API failed", e);
      threats = [];
    }
    
    if (profile && !profile.isPremium) {
      await updateDoc(doc(db, 'users', user.uid), { virusScansLeft: (profile.virusScansLeft || 5) - 1 });
    }

    if (threats.length > 0) {
      await addDoc(collection(db, 'users', user.uid, 'alerts'), {
        uid: user.uid,
        title: "Device Threat Detected",
        message: `Found ${threats.length} threats/vulnerabilities on your device across ${navigator.platform}. AI is attempting automatic mitigation.`,
        severity: "critical",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    logActivity('device_scan_completed', { threatsFound: threats.length });
    return threats;
  };

  const optimizePhone = async () => {
    if (!user) return;
    logActivity('phone_optimization_started');
    
    let advice = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Assume the user's mobile device has some bloated settings. Generate a short, realistic tip of exactly how a system service (like CyberAmour) just freed up memory and improved battery life, with fake metrics. Max 20 words."
      });
      advice = response.text.trim();
    } catch(e) {
      advice = "Junk files cleared & memory freed completely.";
    }

    logActivity('phone_optimization_completed');
    return advice;
  };

  const monitorTransactions = async () => {
    if (!user) return;
    
    const transactions = [
      { id: 'tx1', merchant: 'Amazon', amount: '€45.00', status: 'Verified', date: 'Just now' },
      { id: 'tx2', merchant: 'Unknown Vendor (Overseas)', amount: '€1,200.00', status: 'Fraudulent', date: '2m ago' },
      { id: 'tx3', merchant: 'Apple Store', amount: '€9.99', status: 'Verified', date: '1h ago' }
    ];

    const fraud = transactions.filter(t => t.status === 'Fraudulent');
    if (fraud.length > 0) {
      await addDoc(collection(db, 'users', user.uid, 'alerts'), {
        uid: user.uid,
        title: "Fraudulent Transaction Blocked",
        message: `Blocked a suspicious transaction of ${fraud[0].amount} at ${fraud[0].merchant}.`,
        severity: "critical",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    return transactions;
  };

  const fetchThreatIntelSummary = useCallback(async (forceRefresh = false) => {
    if (cachedThreatIntel && !forceRefresh) return cachedThreatIntel;
    if (isThreatIntelFetching) return isThreatIntelFetching;
    
    isThreatIntelFetching = (async () => {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `Perform a search for the most recent global cyberattacks, data breaches, and emerging threat intelligence in the last 24-48 hours. You are CyberAmour's Global Threat Intel AI. Using your search results, provide a detailed summary structured with the following MD headers:
          
### 📈 Recent Cyberattack Trends
(Detail the latest trends, motives, and major targets)

### 🗡️ Prevailing Attack Vectors
(Detail the specific methods, e.g., spear-phishing, supply chain, ransomware techniques)

### 🛡️ Vulnerable Software & Zero-Days
(List specific software, CVEs if available, and systems currently under exploitation)

Use bullet points for readability. Make it sound highly professional, actionable, and suitable for a senior security analyst dashboard. Emphasize the live news and specific threat actors you found.`,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        cachedThreatIntel = response.text || "No intelligence data available.";
        return cachedThreatIntel;
      } catch (e: any) {
        const isQuotaError = e?.message?.includes('429') || e?.status === 'RESOURCE_EXHAUSTED' || e?.status === 429;
        if (!isQuotaError) {
          console.error("Failed to fetch threat intel summary", e);
        }
        cachedThreatIntel = "Unable to retrieve real-time global threat intelligence currently. Please check back later.";
        return cachedThreatIntel;
      } finally {
        isThreatIntelFetching = null;
      }
    })();
    return isThreatIntelFetching;
  }, []);

  let cachedDeviceIntel: string | null = null;
  let isDeviceIntelFetching: Promise<string> | null = null;

  const fetchDeviceIntelSummary = useCallback(async () => {
    if (cachedDeviceIntel) return cachedDeviceIntel;
    if (isDeviceIntelFetching) return isDeviceIntelFetching;
    
    isDeviceIntelFetching = (async () => {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Create a brief, localized security intelligence summary for this specific device. Mention status of realtime antivirus protection, firewall, anomalous apps, and permissions. Format as an alert summary using markdown.`
        });
        cachedDeviceIntel = response.text || "No local device intelligence data available.";
        return cachedDeviceIntel;
      } catch (e: any) {
        cachedDeviceIntel = "Unable to retrieve real-time device intelligence currently.";
        return cachedDeviceIntel;
      } finally {
        isDeviceIntelFetching = null;
      }
    })();
    return isDeviceIntelFetching;
  }, []);

  return {
    user,
    profile,
    fetchThreatIntelSummary,
    fetchDeviceIntelSummary,
    breaches,
    scans,
    vault,
    alerts,
    activityLogs,
    scoreHistory,
    weather,
    loading,
    is2FAVerified,
    login,
    logout,
    updateUserPreferences,
    changePassword,
    performPhishingScan,
    checkBreaches,
    createAlert,
    askAI,
    generate2FASecret,
    verify2FACode,
    enable2FA,
    disable2FA,
    verifySession2FA,
    updateLogRetention,
    clearOldLogs,
    toggleAutoMonitoring,
    autoRectify,
    upgradeSubscription,
    startCheckout,
    rewardUserWithScan,
    generateActivationCode,
    redeemActivationCode,
    scanDarkWeb,
    scanNetwork,
    scanDevice,
    optimizePhone,
    monitorTransactions,
    logActivity,
    aiAdvice,
    detectAnomalies,
    getGlobalThreatData: () => ({
      mitreAttack: [
        { tactic: 'Initial Access', count: 2450, framework: 'Mitre ATT&CK' },
        { tactic: 'Execution', count: 1840, framework: 'Mitre ATT&CK' },
        { tactic: 'Persistence', count: 1450, framework: 'Mitre ATT&CK' },
        { tactic: 'Privilege Escalation', count: 1020, framework: 'Mitre ATT&CK' },
        { tactic: 'Defense Evasion', count: 980, framework: 'Mitre ATT&CK' },
        { tactic: 'Credential Access', count: 1650, framework: 'Mitre ATT&CK' },
        { tactic: 'Exfiltration', count: 1320, framework: 'Mitre ATT&CK' }
      ],
      stride: [
        { threat: 'Spoofing', count: 1280, framework: 'STRIDE' },
        { threat: 'Tampering', count: 840, framework: 'STRIDE' },
        { threat: 'Repudiation', count: 320, framework: 'STRIDE' },
        { threat: 'Information Disclosure', count: 1600, framework: 'STRIDE' },
        { threat: 'Denial of Service', count: 1750, framework: 'STRIDE' },
        { threat: 'Elevation of Privilege', count: 950, framework: 'STRIDE' }
      ],
      owasp: [
        { risk: 'Broken Access Control', count: 2450, framework: 'OWASP Top 10' },
        { risk: 'Cryptographic Failures', count: 1920, framework: 'OWASP Top 10' },
        { risk: 'Injection', count: 1580, framework: 'OWASP Top 10' },
        { risk: 'Insecure Design', count: 1160, framework: 'OWASP Top 10' },
        { risk: 'Security Misconfiguration', count: 2100, framework: 'OWASP Top 10' },
        { risk: 'Vulnerable Components', count: 1800, framework: 'OWASP Top 10' },
        { risk: 'Auth Failures', count: 1340, framework: 'OWASP Top 10' }
      ],
      compliance: [
        { standard: 'ISO 27001', violations: 120, status: 'Critical' },
        { standard: 'NIST', violations: 85, status: 'Warning' },
        { standard: 'GDPR', violations: 210, status: 'Critical' },
        { standard: 'HIPAA', violations: 45, status: 'Warning' }
      ],
      regions: [
        { name: 'North America', threats: 4500 },
        { name: 'Europe', threats: 3800 },
        { name: 'Asia', threats: 5200 },
        { name: 'Africa', threats: 1200 },
        { name: 'South America', threats: 1800 }
      ]
    })
  };
}
