import { useState, useEffect, useCallback } from 'react';
import { auth, db, functions, httpsCallable, onAuthStateChanged, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp, User, signInWithPopup, googleProvider, signOut, writeBatch, getDocs, updatePassword, updateProfile, orderBy, limit, runTransaction } from '../firebase';
const Type = { OBJECT: 'OBJECT', STRING: 'STRING', INTEGER: 'INTEGER', NUMBER: 'NUMBER', ARRAY: 'ARRAY', BOOLEAN: 'BOOLEAN' } as const;
import { BillingService } from '../utils/billing';

import * as otplib from 'otplib';
import { jsonrepair } from 'jsonrepair';

const authenticator = (otplib as any).authenticator;

// Permanent product-owner entitlement is tied to the exact Firebase-authenticated account email.
// Password-provider users are separately stopped at the verification screen in App.tsx.
const OWNER_EMAIL = 'tongaigodfreymapiye@gmail.com';
const isPermanentOwner = (account: User | null | undefined) =>
  account?.email?.trim().toLowerCase() === OWNER_EMAIL;

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

  // Device-limit enforcement is best-effort client functionality. It must never hold
  // Firebase authentication hostage when Firestore is slow, offline, or denies access.
  try {
    const deviceId = getBrowserDeviceId();
    const accessRef = doc(db, 'users', account.uid, 'deviceAccess', 'active');
    const now = Date.now();
    const preflight = await getDoc(accessRef);
    if (preflight.exists()) {
      const sessions = Array.isArray(preflight.data().sessions) ? preflight.data().sessions : [];
      const active = sessions.filter((session: any) => Number(session.lastSeen || 0) > now - OWNER_DEVICE_TTL_MS);
      const otherDeviceCount = active.filter((session: any) => session.id !== deviceId).length;
      if (otherDeviceCount > 0) {
        const proceed = window.confirm(`CyberAmour account notice: you are already logged in on ${otherDeviceCount} other device(s). Continue on this device? You can use up to ${OWNER_DEVICE_LIMIT} devices at a time.`);
        if (!proceed) {
          await signOut(auth);
          return false;
        }
      }
    }

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
      try { await signOut(auth); } catch (signOutError) { console.error('Could not sign out after device limit was reached.', signOutError); }
      return false;
    }
    console.error('Could not verify CyberAmour device access; allowing authentication to continue.', error);
    return true;
  }
}

// AI calls are proxied through authenticated Cloud Functions; no Gemini key is shipped to browsers.
const ai = { models: { generateContent: async (options: any) => {
  const generate = httpsCallable(functions, 'cyberAmourGenerateContent', { timeout: 65000 });
  const response: any = await generate({ options });
  return { text: response.data?.text || '', groundingSources: Array.isArray(response.data?.groundingSources) ? response.data.groundingSources : [], generatedAt: response.data?.generatedAt, grounded: Boolean(response.data?.grounded) };
} } };


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
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [is2FAVerified, setIs2FAVerified] = useState(false);

  useEffect(() => {
    let lastObservedUser: User | null = null;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      // Update React immediately. Optional Firestore device checks run separately so
      // a slow Firestore request cannot leave the user stranded on the login screen.
      if (!u && lastObservedUser && isPermanentOwner(lastObservedUser)) {
        void releaseOwnerDeviceSession(lastObservedUser.uid);
      }
      if (u && isPermanentOwner(u)) {
        try { window.localStorage.setItem('cyberamour_owner_last_uid', u.uid); } catch (error) {
          console.warn('Could not save owner account hint in local storage.', error);
        }
        void enforceOwnerDeviceLimit(u).catch((error) => {
          console.error('Owner device check failed unexpectedly; authentication remains active.', error);
        });
      }
      lastObservedUser = u;
      setUser(u);
      if (!u) {
        setProfile(null);
        setProfileLoadError(null);
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
    setLoading(true);
    setProfileLoadError(null);
    let profileSnapshotReceived = false;
    const profileLoadTimer = window.setTimeout(() => {
      if (!profileSnapshotReceived) {
        setProfileLoadError('Sign-in succeeded, but CyberAmour has not received your Firestore profile yet. Check the connection and Firebase Firestore access, then retry.');
        setLoading(false);
      }
    }, 15000);
    const unsubProfile = onSnapshot(userRef, (doc) => {
      profileSnapshotReceived = true;
      window.clearTimeout(profileLoadTimer);
      setProfileLoadError(null);
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
    }, (error) => {
      profileSnapshotReceived = true;
      window.clearTimeout(profileLoadTimer);
      console.error('Could not load the signed-in user profile from Firestore.', error);
      setProfileLoadError(`Sign-in succeeded, but the account profile could not be read (${error?.code || 'connection error'}). Check Firestore rules and project configuration, then retry.`);
      setLoading(false);
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
      
      // Only show persisted score history; an empty history stays empty rather than inventing trend points.
      setScoreHistory(history.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    });

    return () => {
      window.clearTimeout(profileLoadTimer);
      unsubProfile();
      unsubVault();
      unsubAlerts();
      unsubLogs();
      unsubScoreHistory();
    };
  }, [user]);

  const getProactiveAdvice = async () => {
    if (!user) return null;

    const recentAlerts = alerts.slice(0, 3).map(a => a.title).join(', ');
    const recentActivity = activityLogs.slice(0, 5).map(l => l.type).join(', ');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are CyberAmour AI Advisor. 
        Analyze the following user security data and provide ONE concise, proactive security tip or suggestion.
        Security Score: ${profile?.securityScore ?? 'Not assessed'}
        Recent Alerts: ${recentAlerts || 'None'}
        Recent Activity: ${recentActivity || 'None'}
        
        Return a JSON object with:
        - text: The suggestion (max 20 words).
        - actionLabel: A short label for a button (e.g., "Run Scan", "Check Vault", "Enable 2FA").
        - targetScreen: The screen ID to navigate to. Options: 'dashboard', 'ai', 'settings', 'pricing'.
        
        If the score is below 70, be more urgent.
        Do not claim that scans, breach lookups, network monitoring, or device remediation were performed unless supplied evidence proves it. Recommend only supported screens: dashboard, AI assistant, settings, or pricing.`,
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

      const advice = safeJsonParse(response.text) as any;
      const allowedScreens = ['dashboard', 'ai', 'settings', 'pricing'];
      const targetScreen = allowedScreens.includes(advice?.targetScreen) ? advice.targetScreen : 'ai';
      return {
        text: typeof advice?.text === 'string' && advice.text.trim() ? advice.text : 'The AI advisor returned no usable advice.',
        actionLabel: typeof advice?.actionLabel === 'string' && advice.actionLabel.trim() ? advice.actionLabel : 'Open AI Assistant',
        targetScreen
      };
    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429;
      if (!isQuotaError) {
        console.error("AI Advice error", error);
      }
      return {
        text: "The AI advisor is unavailable. No security assessment was performed; check provider configuration and try again.",
        actionLabel: "Open AI Assistant",
        targetScreen: "ai"
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

    if (!navigator.geolocation) { setWeather(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => setWeather(null),
      { timeout: 8000, maximumAge: 15 * 60 * 1000 }
    );

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => setWeather(null),
        { timeout: 8000, maximumAge: 15 * 60 * 1000 }
      );
    }, 1000 * 60 * 30); // Every 30 mins when location permission is available

    return () => clearInterval(interval);
  }, [user]);

  const logActivity = async (action: string, metadata: any = {}) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'activityLogs'), {
        action,
        metadata,
        createdAt: new Date().toISOString(),
        ip: null, // Browser-side logging does not know the public client IP; collect it server-side if required.
        device: navigator.userAgent
      });
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  };

  const createAlert = async (title: string, message: string, severity: string = 'low') => {
    if (!user) return false;
    try {
      await addDoc(collection(db, 'users', user.uid, 'alerts'), {
        uid: user.uid,
        title: String(title).slice(0, 180),
        message: String(message).slice(0, 5000),
        severity: ['low', 'medium', 'high', 'critical'].includes(severity.toLowerCase()) ? severity.toLowerCase() : 'low',
        isRead: false,
        type: 'application',
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Could not create alert. Check Firestore rules.', error);
      return false;
    }
  };

  const detectAnomalies = async () => {
    if (!user || activityLogs.length < 1) return;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
        
      }

      return result;
    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429 || String(error).includes('429') || String(error).includes('RESOURCE_EXHAUSTED');
      if (!isQuotaError) {
        console.error("Anomaly detection failed", error);
      }
      // Do not manufacture an anomaly verdict when the configured AI provider fails.
      throw new Error('AI anomaly analysis is unavailable. No anomaly verdict was produced. Check the configured Firebase Cloud Function, provider credentials, and quota.');
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
      throw error;
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

  const askAI = async (message: string) => {
    try {
      if (!user) return 'Please sign in to use the CyberAmour AI assistant.';
      const assistant = httpsCallable(functions, 'cyberAmourAssistant', { timeout: 45000 });
      const response: any = await assistant({ message });
      return response.data?.answer || 'The AI service returned no answer. Please try again.';
    } catch (error: any) {
      console.error('CyberAmour server-side AI assistant failed', error);
      return error?.message || 'The AI service is unavailable or not configured. No simulated answer was generated.';
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
    if (!user || (!isPermanentOwner(user) && !profile?.isPremium && !profile?.isOwner)) return;
    
    logActivity('auto_rectify_started');
    
    // This workflow reviews alerts only. It does not repair endpoint files or operating-system settings.
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

  const upgradeSubscription = useCallback(async (_tier: 'basic' | 'premium' | 'business') => {
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

  const generateActivationCode = async (tier: 'premium' | 'business', linkedEmail?: string) => {
    if (!user || user.email?.trim().toLowerCase() !== OWNER_EMAIL) throw new Error('Not authorized');
    const generate = httpsCallable(functions, 'generateActivationCode');
    const result: any = await generate({ tier, linkedEmail: linkedEmail ? linkedEmail.trim().toLowerCase() : '' });
    const code = result.data?.code;
    if (typeof code !== 'string' || !code) throw new Error('Activation code generation failed.');
    logActivity('admin_generated_activation_code', { tier, linkedEmail: linkedEmail || null });
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

  const optimizePhone = async () => {
    if (!user) throw new Error('Sign in to access device guidance.');
    logActivity('device_optimization_unavailable', { reason: 'browser_sandbox_no_device_controls' });
    return 'CyberAmour has not changed your device. A browser cannot safely clear system junk, free device memory, or change battery settings. Use your operating system’s built-in storage and battery tools.';
  };



  return {
    user,
    profile,
    vault,
    alerts,
    activityLogs,
    scoreHistory,
    weather,
    loading,
    profileLoadError,
    is2FAVerified,
    login,
    logout,
    updateUserPreferences,
    changePassword,
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
    generateActivationCode,
    redeemActivationCode,
    optimizePhone,
    logActivity,
    aiAdvice,
    detectAnomalies,
  };
}
