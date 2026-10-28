/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Shield, 
  Search, 
  Bell, 
  Lock, 
  MessageSquare, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  LogOut, 
  User as UserIcon,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  UserSearch,
  Mail,
  Link as LinkIcon,
  MessageCircle,
  Globe,
  Activity,
  HardDrive,
  FileText,
  Moon,
  Sun,
  CloudRain,
  CloudLightning,
  Play,
  Wind,
  Thermometer,
  GraduationCap,
  HelpCircle,
  Trophy,
  ArrowRight,
  XCircle,
  CreditCard,
  Check,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Users,
  Ghost,
  Fingerprint,
  AlertCircle,
  Network,
  Smartphone,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  ZapOff,
  Clock,
  Crosshair,
  Notebook,
  Skull,
  Copy,
  Key,
  Database,
  Phone,
  Download,
  LayoutList,
  Square,
  CheckSquare,
  ChevronDown,
  FileDown,
  Sprout,
  Image,
  Star,
  Scan,
  QrCode,
  CheckCircle,
  Loader,
  Briefcase,
  X,
  Terminal,
  Twitter,
  Linkedin,
  Github,
  Send,
  Loader2,
  BookOpen,
  PlayCircle,
  Crown,
  BellRing
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line as RechartsLine
} from 'recharts';
import { useCyberAmour } from './hooks/useCyberAmour';
import AttackKevIntelligence from './components/AttackKevIntelligence';
import SocApiDashboard from './components/SocApiDashboard';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import { QRCodeSVG } from 'qrcode.react';
import { db, auth, functions, httpsCallable, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, updateProfile as updateFirebaseProfile } from './firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const CyberAmourLogo = ({ size = 72, className = "" }: { size?: number, className?: string }) => (
  <img src={`${import.meta.env.BASE_URL}assets/cyberamour-logo.png`} width={size * 1.55} height={size} alt="CyberAmour — Intelligence, Protection, Resilience" className={`object-contain ${className}`} style={{ maxWidth: size * 1.8 }} />
);

function ExpandableSection({ title, icon, color, children, defaultOpen = false }: { title: string, icon?: React.ReactNode, color: string, children: React.ReactNode, defaultOpen?: boolean }) {
  return (
    <details className="group pt-3 border-t border-border mt-3 cursor-pointer" open={defaultOpen}>
      <summary className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between list-none" style={{ color }}>
        <div className="flex items-center gap-2">
          {icon}
          {title}
        </div>
        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2 -mb-1 animate-in slide-in-from-top-2 duration-200">
        {children}
      </div>
    </details>
  );
}

import { playClickSound, playScanSound, playSuccessSound, playErrorSound, playAlertSound } from './utils/sounds';
import { WorldClock } from './components/WorldClock';
import { DeviceHealthChart } from './components/DeviceHealthChart';
import EnterpriseRiskWorkspace from './components/EnterpriseRiskWorkspace';
import LocalSecuritySensor from './components/LocalSecuritySensor';
import WindowsEndpointScan from './components/WindowsEndpointScan';

type Screen = 'soc' | 'endpoint' | 'attack' | 'dashboard' | 'antivirus' | 'alerts' | 'ai' | 'features' | 'settings' | 'pricing' | 'admin' | 'tasks' | 'identity' | 'guide' | 'clock' | 'risk' | 'grc' | 'cases' | 'reports';


// Minimal, evidence-led screens restored for the clean rebuild.
// These components deliberately avoid simulated scans, fabricated findings, or threat-map claims.
function AIAssistant({ askAI, logActivity, profile, setActiveScreen, alerts, activityLogs }: any) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const prompt = input.trim();
    if (!prompt || busy) return;
    setInput('');
    setMessages((items) => [...items, { role: 'user', text: prompt }]);
    setBusy(true);
    try {
      const answer = await askAI(prompt);
      setMessages((items) => [...items, { role: 'assistant', text: String(answer || 'The AI service returned no answer.') }]);
      if (typeof logActivity === 'function') logActivity('AI assistant query submitted');
    } catch (error: any) {
      setMessages((items) => [...items, { role: 'assistant', text: 'The AI service is unavailable. No analysis was performed. Check the server-side AI configuration and try again.' }]);
    } finally { setBusy(false); }
  };
  return <section className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">CyberAmour Intelligence</p><h1 className="mt-1 text-3xl font-bold">AI Security Assistant</h1><p className="mt-2 text-sm text-slate-400">Answers depend on the configured server-side AI service; this assistant does not independently scan your device.</p></div><button className="rounded-lg border border-slate-600 px-4 py-2" onClick={() => setActiveScreen('dashboard')}>Back to dashboard</button></div>
    <div className="min-h-64 space-y-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4" aria-live="polite">
      {messages.length === 0 && <p className="text-slate-400">Ask a security question, request help interpreting a finding, or ask for guidance on remediation.</p>}
      {messages.map((m, i) => <div key={i} className={`max-w-3xl rounded-xl p-3 ${m.role === 'user' ? 'ml-auto bg-cyan-950' : 'bg-slate-800'}`}><p className="mb-1 text-xs uppercase text-slate-400">{m.role === 'user' ? 'You' : 'Assistant'}</p><p className="whitespace-pre-wrap text-sm">{m.text}</p></div>)}
      {busy && <p className="text-sm text-slate-400">Waiting for the configured AI service…</p>}
    </div>
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(); }}><input className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a security question…" aria-label="Message to AI assistant" /><button disabled={busy || !input.trim()} className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-50" type="submit">Send</button></form>
  </section>;
}

function KeyFeatures({ setActiveScreen, isPermanentOwner }: any) {
  const items = [
    { id: 'dashboard', title: 'Security dashboard', desc: 'Review account-level overview and available evidence.' },
    { id: 'antivirus', title: 'Windows endpoint scan', desc: 'Use the configured local sensor and Windows Defender where available.' },
    { id: 'reports', title: 'Risk and GRC workspace', desc: 'Record risk assessments and produce reports from entered or collected evidence.' },
    { id: 'alerts', title: 'Alerts and activity', desc: 'Review recorded alerts and application activity.' },
    { id: 'ai', title: 'AI security assistant', desc: 'Get guidance when the server-side AI integration is configured.' },
    { id: 'guide', title: 'User guide', desc: 'Understand what each capability does and its limitations.' },
  ];
  return <section className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8"><div><p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">CyberAmour</p><h1 className="mt-1 text-3xl font-bold">Capabilities</h1><p className="mt-2 text-slate-400">Only configured integrations and recorded evidence should be treated as results.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <button key={item.id} onClick={() => setActiveScreen(item.id)} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 text-left transition hover:border-cyan-500"><h2 className="text-lg font-semibold">{item.title}</h2><p className="mt-2 text-sm text-slate-400">{item.desc}</p><span className="mt-4 inline-block text-sm font-semibold text-cyan-400">Open capability →</span></button>)}</div>{isPermanentOwner && <p className="text-xs text-slate-500">Owner account detected. Administrative privileges depend on the configured authorization rules.</p>}</section>;
}

function UserGuide({ setActiveScreen }: any) {
  const sections = [
    ['Windows endpoint scanning', 'The browser cannot scan the whole computer by itself. Start and configure the local sensor, then use Windows Defender through the supported local workflow. A failed or unavailable scan is not a clean bill of health.'],
    ['Vulnerability intelligence', 'KEV and ATT&CK snapshots provide reference intelligence. They do not prove that a specific vulnerability or technique is present on your device. Check the source and update date.'],
    ['Risk and GRC reports', 'Reports should be based on recorded assessments, controls, and evidence. Review the source records before exporting or sharing a report.'],
    ['AI assistant', 'AI guidance requires a configured server-side provider. If the service is unavailable, the application should report the failure rather than invent an answer or detection.'],
    ['Privacy and account security', 'Never commit .env files, API keys, tokens, or private credentials. Use least-privilege accounts and rotate any credential that may have been exposed.'],
  ];
  return <section className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-8"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Documentation</p><h1 className="mt-1 text-3xl font-bold">User guide</h1></div><button className="rounded-lg border border-slate-600 px-4 py-2" onClick={() => setActiveScreen('dashboard')}>Back to dashboard</button></div><div className="space-y-3">{sections.map(([title, body]) => <article key={title} className="rounded-xl border border-slate-700 bg-slate-900/70 p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></article>)}</div></section>;
}

export default function App() {
  // Add global click sound
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="button"]')) {
        playClickSound();
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const { 
    user, 
    profile, 
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
    detectAnomalies
  } = useCyberAmour();

  const isPermanentOwner = user?.email?.trim().toLowerCase() === 'tongaigodfreymapiye@gmail.com';
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [globalHardwareDot, setGlobalHardwareDot] = useState<{show: boolean, color: string}>({show: false, color: 'bg-success'});

  useEffect(() => {
    const handleDotUpdate = (e: any) => {
      setGlobalHardwareDot(prev => {
        if (prev.show === e.detail.show && prev.color === e.detail.color) return prev;
        return e.detail;
      });
    };
    window.addEventListener('updateGlobalHardwareDot', handleDotUpdate);
    return () => window.removeEventListener('updateGlobalHardwareDot', handleDotUpdate);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDownloadQR, setShowDownloadQR] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [showStartupSplash, setShowStartupSplash] = useState(true);

  useEffect(() => {
    // Keep the branded startup animation visible for six seconds on initial page load.
    const timer = window.setTimeout(() => setShowStartupSplash(false), 6000);
    return () => window.clearTimeout(timer);
  }, []);


  useEffect(() => {
    if (user) {
      logActivity('screen_view', { screen: activeScreen });
    }
  }, [activeScreen, user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (user && !loading && profile) {
      const hasSeenTutorial = localStorage.getItem(`tutorial_seen_${user.uid}`);
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
    }
  }, [user, loading, profile]);

  if (loading || showStartupSplash) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-bold text-danger text-lg tracking-widest uppercase"
        >
          Protected by Cyber Fortress Technologies
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <CyberAmourLogo size={144} className="drop-shadow-[0_0_20px_rgba(0,229,255,0.5)]" />
        </motion.div>
      </div>
    );
  }

  if (user && profileLoadError && !loading && !showStartupSplash) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl border border-danger/30 bg-surface p-8 text-center space-y-5">
          <CyberAmourLogo size={120} className="mx-auto" />
          <h1 className="text-2xl font-bold">You are signed in, but your profile did not load</h1>
          <p className="text-text-dim">{profileLoadError}</p>
          <p className="text-sm text-text-dim">No subscription or security status has been inferred from this error. Retry after checking the network and Firebase configuration.</p>
          <button type="button" onClick={() => window.location.reload()} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white">Retry profile loading</button>
          <button type="button" onClick={logout} className="w-full rounded-xl border border-border px-4 py-3">Sign out</button>
        </div>
      </div>
    );
  }

  const submitAccountForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setAuthBusy(true);
    try {
      const email = authEmail.trim().toLowerCase();
      if (authMode === 'reset') {
        if (!email) throw new Error('Enter your email address first.');
        await sendPasswordResetEmail(auth, email);
        setAuthMessage('Password reset instructions have been sent if an account exists for this email.');
      } else if (authMode === 'signup') {
        if (authPassword.length < 8) throw new Error('Use a password with at least 8 characters.');
        if (!authName.trim()) throw new Error('Enter your name.');
        const credential = await createUserWithEmailAndPassword(auth, email, authPassword);
        await updateFirebaseProfile(credential.user, { displayName: authName.trim() });
        await sendEmailVerification(credential.user);
        setAuthMessage('Your account has been created. Verify your email using the link we sent before signing in.');
      } else {
        await signInWithEmailAndPassword(auth, email, authPassword);
        setShowStartupSplash(true);
        window.setTimeout(() => setShowStartupSplash(false), 6000);
      }
    } catch (error: any) {
      const code = error?.code || '';
      const friendly: Record<string, string> = {
        'auth/email-already-in-use': 'An account already exists for this email. Sign in instead or reset your password.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/user-not-found': 'No account was found for this email.',
        'auth/wrong-password': 'Email or password is incorrect.',
        'auth/too-many-requests': 'Too many attempts. Wait a while and try again.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
        'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase Authentication.'
      };
      setAuthError(friendly[code] || error?.message || 'Account action failed. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  if (user && !isPermanentOwner && user.providerData.some((provider) => provider.providerId === 'password') && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-3xl border border-primary/30 bg-surface p-8 text-center space-y-5">
          <CyberAmourLogo size={120} className="mx-auto" />
          <Mail className="mx-auto text-primary" size={36} />
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-text-dim">We sent a verification link to <strong>{user.email}</strong>. Open it, then return here and refresh this page to continue.</p>
          {authMessage && <p className="text-success text-sm">{authMessage}</p>}
          {authError && <p role="alert" className="text-danger text-sm">{authError}</p>}
          <button className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white" onClick={async () => { setAuthError(''); setAuthMessage(''); try { if (auth.currentUser) await sendEmailVerification(auth.currentUser); setAuthMessage('A new verification email has been sent.'); } catch (e: any) { setAuthError(e?.message || 'Could not send verification email.'); } }}>Resend verification email</button>
          <button className="w-full rounded-xl border border-border px-4 py-3" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight logo-gradient">CyberAmour</h1>
            <p className="text-text-dim uppercase tracking-wider text-sm">Digital intelligence, protected.</p>
            <div className="font-bold text-danger text-lg tracking-widest uppercase">Protected by Cyber Fortress Technologies</div>
          </div>
          <div className="flex justify-center"><div className="p-4 bg-primary/20 rounded-3xl border border-primary/30"><CyberAmourLogo size={160} className="shadow-[0_0_20px_rgba(0,229,255,0.5)]" /></div></div>
          <div className="rounded-2xl border border-border bg-surface/70 p-5 text-left space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthMessage(''); }} className={`rounded-xl py-2 font-semibold ${authMode === 'signin' ? 'bg-primary text-white' : 'bg-surface text-text-dim'}`}>Sign in</button>
              <button type="button" onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthMessage(''); }} className={`rounded-xl py-2 font-semibold ${authMode === 'signup' ? 'bg-primary text-white' : 'bg-surface text-text-dim'}`}>Create account</button>
            </div>
            <h2 className="text-xl font-bold">{authMode === 'signup' ? 'Create your CyberAmour account' : authMode === 'reset' ? 'Reset your password' : 'Welcome back'}</h2>
            <form onSubmit={submitAccountForm} className="space-y-3">
              {authMode === 'signup' && <label className="block text-sm">Full name<input autoComplete="name" value={authName} onChange={e => setAuthName(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-3 text-white" required /></label>}
              <label className="block text-sm">Email address<input type="email" autoComplete="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-3 text-white" required /></label>
              {authMode !== 'reset' && <label className="block text-sm">Password<input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={8} value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-3 text-white" required /></label>}
              {authError && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{authError}</p>}
              {authMessage && <p role="status" className="rounded-lg bg-success/10 p-3 text-sm text-success">{authMessage}</p>}
              <button disabled={authBusy} type="submit" className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60">{authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : authMode === 'reset' ? 'Send reset link' : 'Sign in with email'}</button>
            </form>
            {authMode !== 'reset' && <button type="button" className="w-full text-sm text-primary underline" onClick={() => { setAuthMode('reset'); setAuthError(''); setAuthMessage(''); }}>Forgot password?</button>}
            {authMode === 'reset' && <button type="button" className="w-full text-sm text-primary underline" onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthMessage(''); }}>Back to sign in</button>}
            <div className="flex items-center gap-3 text-xs text-text-dim"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
            <button type="button" disabled={authBusy} onClick={async () => {
              setAuthError('');
              setAuthMessage('');
              setAuthBusy(true);
              try {
                await login();
              } catch (error: any) {
                const code = error?.code || '';
                const friendly: Record<string, string> = {
                  'auth/unauthorized-domain': 'Firebase is not allowing sign-in from this website. In Firebase Console → Authentication → Settings → Authorized domains, add tongaigodfreymapiye-collab.github.io.',
                  'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups for this website and try again.',
                  'auth/popup-closed-by-user': 'The Google sign-in window was closed before sign-in finished. Try again and complete the Google prompt.',
                  'auth/cancelled-popup-request': 'A sign-in window is already opening. Finish that window or wait a moment before retrying.',
                  'auth/network-request-failed': 'A network request failed during Google sign-in. Check your connection and try again.'
                };
                setAuthError(friendly[code] || error?.message || 'Google sign-in failed. Please try again.');
              } finally {
                setAuthBusy(false);
              }
            }} className="w-full py-3 px-4 bg-surface border border-primary/30 hover:bg-primary/10 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-60"><UserIcon size={20} />{authBusy ? 'Connecting to Google…' : 'Continue with Google'}</button>
            <button onClick={() => setShowDownloadQR(true)} className="w-full py-3 px-4 bg-surface border border-border text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3"><QrCode size={20} />Scan to Download App</button>
          </div>
          {showDownloadQR && <DownloadQRModal onClose={() => setShowDownloadQR(false)} />}
          <div className="mt-5 flex flex-col items-center text-center gap-2"><CyberAmourLogo size={80} /><p className="text-[10px] text-text-dim uppercase tracking-widest">Developed by Engineer and Software Developer - Tongai Godfrey Mapiye - Cyber Fortress Technologies.</p></div>
        </motion.div>
      </div>
    );
  }

  if (!is2FAVerified) {
    return <TwoFactorVerify verify={verifySession2FA} logout={logout} />;
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col lg:flex-row overflow-hidden">
      <RealtimeAlerts alerts={alerts} />
      {showDownloadQR && (
        <DownloadQRModal onClose={() => setShowDownloadQR(false)} />
      )}
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <aside className="hidden lg:flex w-64 bg-surface border-r border-border p-8 flex-col shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <CyberAmourLogo size={120} className="drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]" />
          <div className="logo-gradient text-2xl font-extrabold tracking-tighter">CyberAmour</div>
        </div>
        <div className="text-[10px] text-text-dim uppercase tracking-widest mb-12">Digital intelligence, protected.</div>
        
        <nav className="flex-1 overflow-y-auto pr-1">
          <ul className="space-y-2">
            <li className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim">Security workspace</li>
            <SidebarItem active={activeScreen === 'dashboard'} onClick={() => setActiveScreen('dashboard')} icon={<Shield size={18} />} label="Security Overview" />
            <SidebarItem active={activeScreen === 'risk'} onClick={() => setActiveScreen('risk')} icon={<ShieldCheck size={18} />} label="Risk Assessments" />
            <SidebarItem active={activeScreen === 'grc'} onClick={() => setActiveScreen('grc')} icon={<CheckSquare size={18} />} label="GRC & Controls" />
            <SidebarItem active={activeScreen === 'soc'} onClick={() => setActiveScreen('soc')} icon={<Activity size={18} />} label="SOC API Dashboard" />
            <SidebarItem active={activeScreen === 'attack'} onClick={() => setActiveScreen('attack')} icon={<Database size={18} />} label="ATT&CK + KEV Intelligence" />
            <SidebarItem active={activeScreen === 'endpoint'} onClick={() => setActiveScreen('endpoint')} icon={<HardDrive size={18} />} label="Windows Endpoint Scan" />
            <SidebarItem active={activeScreen === 'antivirus'} onClick={() => setActiveScreen('antivirus')} icon={<ShieldCheck size={18} />} label="Antivirus & File Scan" />
            <SidebarItem active={activeScreen === 'cases'} onClick={() => setActiveScreen('cases')} icon={<Fingerprint size={18} />} label="Investigations & Evidence" />
            <SidebarItem active={activeScreen === 'reports'} onClick={() => setActiveScreen('reports')} icon={<FileText size={18} />} label="Reports & Action Plans" />
            <SidebarItem active={activeScreen === 'tasks'} onClick={() => setActiveScreen('tasks')} icon={<CheckSquare size={18} />} label="Tasks & Remediation" />
            <li className="px-3 pt-5 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim">Account & support</li>
            <SidebarItem active={activeScreen === 'ai'} onClick={() => setActiveScreen('ai')} icon={<MessageSquare size={18} />} label="AI Security Assistant" />
            <SidebarItem active={activeScreen === 'alerts'} onClick={() => setActiveScreen('alerts')} icon={<Bell size={18} />} label="Notifications" />
            <SidebarItem active={activeScreen === 'guide'} onClick={() => setActiveScreen('guide')} icon={<BookOpen size={18} className="text-success" />} label="User Guide & Help" />
            {!isPermanentOwner && <SidebarItem active={activeScreen === 'pricing'} onClick={() => setActiveScreen('pricing')} icon={<CreditCard size={18} />} label="Plan & Billing" />}
            <SidebarItem active={activeScreen === 'settings'} onClick={() => setActiveScreen('settings')} icon={<Settings size={18} />} label="Settings & Devices" />
            {isPermanentOwner && <SidebarItem active={activeScreen === 'admin'} onClick={() => setActiveScreen('admin')} icon={<ShieldAlert size={18} />} label="Administration" />}
            <SidebarItem active={false} onClick={() => setShowTutorial(true)} icon={<HelpCircle size={18} />} label="Launch Tutorial" />
          </ul>
        </nav>

        <div className="mt-auto pt-5 border-t border-border flex flex-col gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center justify-between text-text-dim hover:text-primary transition-colors hover:bg-surface/50 p-2 rounded-xl group w-[calc(100%+16px)] -mx-2"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
              <span className="text-sm font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={cn(
              "w-10 h-5 rounded-full relative transition-colors shadow-inner flex-shrink-0",
              isDarkMode ? "bg-primary" : "bg-text-dim/30"
            )}>
              <div 
                className={cn(
                  "absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300",
                  isDarkMode ? "translate-x-[20px]" : "translate-x-[2px]"
                )}
              />
            </div>
          </button>
          <button
            onClick={() => logout()}
            className="w-full py-3 flex items-center justify-center gap-2 text-danger font-bold hover:bg-danger/10 rounded-xl transition-all border border-danger/20"
            aria-label="Sign out of CyberAmour"
          >
            <LogOut size={18} /> Sign Out
          </button>
          <div className="text-[10px] text-text-dim leading-relaxed flex flex-col gap-3">
            <CyberAmourLogo size={120} className="drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]" />
            Developed by Engineer and Software Developer - Tongai Godfrey Mapiye - Cyber Fortress Technologies.
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden p-6 flex items-center justify-between bg-surface border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <CyberAmourLogo size={96} className="drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]" />
          <div className="logo-gradient text-xl font-extrabold tracking-tighter">CyberAmour</div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-text-dim hover:text-primary transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setActiveScreen('alerts')} className="relative p-2 text-text-dim" aria-label="Notifications">
            <Bell size={20} />
            {alerts.some(a => !a.isRead) && <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />}
          </button>
          <button onClick={() => logout()} className="p-2 text-danger hover:bg-danger/10 rounded-lg" aria-label="Sign out of CyberAmour" title="Sign out">
            <LogOut size={20} />
          </button>
          <img src={user.photoURL || ""} alt="" className="w-8 h-8 rounded-full border border-border" referrerPolicy="no-referrer" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.05),transparent_40%)] relative">
        <div className="max-w-4xl mx-auto mb-5 flex flex-wrap items-center justify-end gap-3">
          <span className="text-xs text-text-dim truncate max-w-[min(55vw,360px)]" title={user.email || ''}>{user.email || 'Signed in'}</span>
          {isPermanentOwner && <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-success">Owner · Lifetime Premium</span>}
          <button onClick={() => logout()} className="inline-flex items-center gap-2 rounded-xl border border-danger/30 px-3 py-2 text-xs font-bold text-danger hover:bg-danger/10" aria-label="Sign out of CyberAmour">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
        {globalHardwareDot.show && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-lg cursor-help transition-all" title="Hardware Monitor Active">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">SYS</span>
            <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor]", globalHardwareDot.color)} />
          </div>
        )}
        <div className="max-w-4xl mx-auto space-y-8">
          {profile?.status === 'flagged' && !isPermanentOwner && (
            <div className="bg-[#EF4444] text-white p-4 text-center font-bold text-sm z-50 rounded-xl mb-4 border border-[#EF4444]/50 shadow-lg shadow-[#EF4444]/20 flex items-center justify-center gap-2">
              <ShieldAlert size={18} />
              Your account is under administrative review due to suspicious signup activity. You have read-only access.
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div className={profile?.status === 'flagged' && !isPermanentOwner ? "pointer-events-none opacity-80" : ""}>
              {activeScreen === 'soc' && <SocApiDashboard key="soc" />}
              {activeScreen === 'attack' && <AttackKevIntelligence key="attack" />}
              {activeScreen === 'endpoint' && <WindowsEndpointScan key="endpoint" />}
              {activeScreen === 'risk' && <EnterpriseRiskWorkspace key="risk" section="risk" />}
              {activeScreen === 'grc' && <EnterpriseRiskWorkspace key="grc" section="grc" />}
              {activeScreen === 'cases' && <EnterpriseRiskWorkspace key="cases" section="cases" />}
              {activeScreen === 'reports' && <EnterpriseRiskWorkspace key="reports" section="reports" />}
              {activeScreen === 'dashboard' && <Dashboard key="dashboard" isPermanentOwner={isPermanentOwner} askAI={askAI} setActiveScreen={setActiveScreen} profile={profile}  activityLogs={activityLogs} scoreHistory={scoreHistory} detectAnomalies={detectAnomalies} weather={weather} toggleAutoMonitoring={toggleAutoMonitoring} autoRectify={autoRectify} optimizePhone={optimizePhone} createAlert={createAlert} logActivity={logActivity} />}
              {activeScreen === 'antivirus' && <AntivirusCenter />}
              {activeScreen === 'alerts' && <Alerts key="alerts" alerts={alerts} profile={profile} setActiveScreen={setActiveScreen} />}
              {activeScreen === 'clock' && <WorldClock key="clock" />}
              {activeScreen === 'ai' && <AIAssistant key="ai" askAI={askAI} logActivity={logActivity} profile={profile} setActiveScreen={setActiveScreen} alerts={alerts} activityLogs={activityLogs} />}
              {activeScreen === 'features' && <KeyFeatures key="features" setActiveScreen={setActiveScreen} isPermanentOwner={isPermanentOwner} />}
              {activeScreen === 'guide' && <UserGuide key="guide" setActiveScreen={setActiveScreen} />}
              {activeScreen === 'tasks' && <TaskManagement key="tasks" profile={profile} user={user} />}
              {activeScreen === 'pricing' && (isPermanentOwner ? <OwnerEntitlementScreen /> : <PricingScreen key="pricing" profile={profile} upgrade={upgradeSubscription} startCheckout={startCheckout} redeemActivationCode={redeemActivationCode} />)}
              {activeScreen === 'admin' && <AdminQueue key="admin" generateActivationCode={generateActivationCode} />}
              {activeScreen === 'settings' && (
                <SettingsScreen 
                  key="settings" 
                  profile={profile} 
                  logout={logout} 
                  updateUserPreferences={updateUserPreferences}
                  changePassword={changePassword}
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode}
                  generate2FA={generate2FASecret}
                  verify2FA={verify2FACode}
                  enable2FA={enable2FA}
                  disable2FA={disable2FA}
                  updateLogRetention={updateLogRetention}
                  clearOldLogs={clearOldLogs}
                  logActivity={logActivity}
                  setActiveScreen={setActiveScreen}
                  toggleAutoMonitoring={toggleAutoMonitoring}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Right Panel - Shown on desktop */}
      <aside className="hidden xl:flex w-72 bg-surface border-l border-border p-8 flex-col shrink-0 overflow-y-auto">
        <div className="space-y-8">
          <section>
            <div className="text-[10px] text-text-dim uppercase tracking-widest mb-4">Recent Alerts</div>
            <div className="space-y-3">
              {alerts.slice(0, 2).map((a: any) => (
                <div key={a.id} className={cn("alert-item", a.severity === 'critical' && "alert-item-critical")}>
                  <div className="font-bold text-xs">{a.title}</div>
                  <div className="text-[11px] text-text-dim mt-1">{a.message}</div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-[11px] text-text-dim italic">No recent alerts</div>
              )}
            </div>
          </section>

          <section>
            <div className="text-[10px] text-text-dim uppercase tracking-widest mb-4">AI Advisor</div>
            <div className="text-[11px] text-text-dim mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-success rounded-full" />
              CyberAmour AI • Active
            </div>
            <div className="ai-bubble group relative">
              <div className="mb-3 italic">"{aiAdvice.text}"</div>
              {aiAdvice.actionLabel && (
                <button 
                  onClick={() => setActiveScreen(aiAdvice.targetScreen)}
                  className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-lg border border-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  {aiAdvice.actionLabel}
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </section>

          <section className="mt-auto">
            <DeviceNetworkSummary />
          </section>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border px-3 py-3 flex justify-around items-center z-50">
        <NavButton active={activeScreen === 'dashboard'} onClick={() => setActiveScreen('dashboard')} icon={<Shield size={20} />} label="Home" />
        <NavButton active={activeScreen === 'risk'} onClick={() => setActiveScreen('risk')} icon={<ShieldCheck size={20} />} label="Risk" />
        <NavButton active={activeScreen === 'soc'} onClick={() => setActiveScreen('soc')} icon={<Activity size={20} />} label="SOC API" />
        <NavButton active={activeScreen === 'attack'} onClick={() => setActiveScreen('attack')} icon={<Database size={20} />} label="ATT&CK" />
        <NavButton active={activeScreen === 'antivirus'} onClick={() => setActiveScreen('antivirus')} icon={<ShieldCheck size={20} />} label="Antivirus" />
        <NavButton active={activeScreen === 'settings'} onClick={() => setActiveScreen('settings')} icon={<Settings size={20} />} label="Menu" />
      </nav>

      <AnimatePresence>
        {showTutorial && (
          <TutorialSystem 
            onComplete={() => {
              setShowTutorial(false);
              localStorage.setItem(`tutorial_seen_${user?.uid}`, 'true');
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TutorialSystem({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: "Welcome to CyberAmour",
      description: "Let's take a quick tour of your new digital fortress. We'll show you how to leverage AI and advanced monitoring to stay protected.",
      icon: <CyberAmourLogo size={144} className="drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]" />
    },
    {
      title: "AI Security Assistant",
      description: "Meet your 24/7 security expert. Ask anything from 'Is this email safe?' to 'How do I secure my router?'. It also provides proactive advice on your dashboard.",
      icon: <MessageSquare size={48} className="text-accent" />
    },
    {
      title: "Key Features",
      description: "Explore the advanced capabilities of the CyberAmour platform, from Password Leak Detection to AI-powered Phishing Detection.",
      icon: <Star size={48} className="text-success" />
    },
    {
      title: "Network & Device Shield",
      description: "Monitor real-time packet data and scan for malware. Our AI auto-blocks session hijacking and suspicious network behavior.",
      icon: <Network size={48} className="text-primary" />
    }
  ];

  const currentStep = steps[step];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-bg/80 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card max-w-md w-full p-8 text-center space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-center py-4">
          <div className="p-6 bg-surface rounded-full border border-border shadow-xl">
            {currentStep.icon}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{currentStep.title}</h3>
          <p className="text-text-dim text-sm leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button 
            onClick={onComplete}
            className="text-xs text-text-dim hover:text-text-main transition-colors"
          >
            Skip Tutorial
          </button>
          <button 
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                onComplete();
              }
            }}
            className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {step === steps.length - 1 ? "Get Started" : "Next"}
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === step ? "bg-primary w-4" : "bg-white/10"
              )} 
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <li 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-sm font-medium",
        active ? "bg-card-bg text-text-main border border-border shadow-sm" : "text-text-dim hover:text-text-main hover:bg-white/5"
      )}
    >
      <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-60")}>{icon}</span>
      {label}
    </li>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300 px-3 py-1 rounded-xl relative",
        active ? "text-primary scale-110" : "text-text-dim hover:text-text-main"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      {active && <motion.div layoutId="nav-glow" className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_#8B5CF6]" />}
    </button>
  );
}

function ComplianceInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-surface border border-border rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto cyber-scrollbar shadow-2xl shadow-primary/20"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <FileText className="text-accent" size={24} />
            Compliance Framework Definitions
          </h3>
          <button onClick={onClose} className="p-2 text-text-dim hover:text-white transition-colors rounded-full hover:bg-white/5">
            <XCircle size={20} />
          </button>
        </div>
        
        <div className="space-y-6 text-sm text-text-main/90 leading-relaxed">
          <section className="space-y-3">
            <h4 className="text-lg font-bold text-white border-b border-white/10 pb-2">ISO 27001</h4>
            <p><strong>ISO/IEC 27001</strong> is an international standard for managing information security. It details requirements for establishing, implementing, maintaining, and continually improving an Information Security Management System (ISMS).</p>
            <ul className="list-disc pl-5 space-y-1 text-text-dim">
              <li>Requires a systematic approach to managing sensitive company information.</li>
              <li>Includes people, processes, and IT systems by applying a risk management process.</li>
              <li>Often targeted by threat actors aiming to breach organizational data silos.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-bold text-white border-b border-white/10 pb-2">NIST Cybersecurity Framework</h4>
            <p>The <strong>NIST Cybersecurity Framework (CSF)</strong> provides a policy framework of computer security guidance for how private sector organizations in the United States can assess and improve their ability to prevent, detect, and respond to cyber attacks.</p>
            <ul className="list-disc pl-5 space-y-1 text-text-dim">
              <li>Structured around five core functions: Identify, Protect, Detect, Respond, and Recover.</li>
              <li>Provides a common language for understanding, managing, and expressing cybersecurity risk.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-bold text-white border-b border-white/10 pb-2">GDPR (General Data Protection Regulation)</h4>
            <p><strong>GDPR</strong> is a regulation in EU law on data protection and privacy in the European Union and the European Economic Area. It also addresses the transfer of personal data outside the EU and EEA areas.</p>
            <ul className="list-disc pl-5 space-y-1 text-text-dim">
              <li>Enhances individuals' control and rights over their personal data.</li>
              <li>Imposes strict rules on data controllers and processors.</li>
              <li>Heavy penalties for non-compliance, particularly data leaks exposing PII (Personally Identifiable Information).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-bold text-[#F59E0B] border-b border-[#F59E0B]/20 pb-2">How This App Uses Compliance Risk</h4>
            <p className="text-text-dim">The pie chart illustrates the current vulnerability landscape grouped by potential regulatory violations. It measures detected anomalies, structural weaknesses, and active threats against these major standards to highlight immediate compliance exposure.</p>
          </section>
        </div>

        <div className="mt-8 pt-4 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-surface border border-border hover:bg-white/5 rounded-xl transition-colors font-bold text-sm">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


function RealtimeAlerts({ alerts }: { alerts: any[] }) {
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('cyberamour_dismissed_alerts') || '[]'); } catch { return []; }
  });
  const [visibleAlerts, setVisibleAlerts] = useState<any[]>([]);

  useEffect(() => {
    const now = Date.now();
    const recentUnread = alerts.filter(a => {
      if (a.isRead || dismissedIds.includes(String(a.id))) return false;
      const raw = a.createdAt;
      const createdAtTime = raw?.toDate ? raw.toDate().getTime() : raw?.toMillis ? raw.toMillis() : new Date(raw).getTime();
      return Number.isFinite(createdAtTime) && now - createdAtTime < 15000;
    });
    setVisibleAlerts(recentUnread);
  }, [alerts, dismissedIds]);

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => { const next = [...new Set([...prev, id])].slice(-200); localStorage.setItem('cyberamour_dismissed_alerts', JSON.stringify(next)); return next; });
    setVisibleAlerts(prev => prev.filter(a => String(a.id) !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {visibleAlerts.slice(0, 3).map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={cn(
              "pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md w-80",
              alert.severity === 'critical' || alert.severity === 'high' ? "bg-danger/20 border-danger shadow-danger/20" :
              alert.severity === 'medium' ? "bg-accent/20 border-accent shadow-accent/20" :
              "bg-primary/20 border-primary shadow-primary/20"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-full mt-0.5",
                alert.severity === 'critical' || alert.severity === 'high' ? "bg-danger/20 text-danger" :
                alert.severity === 'medium' ? "bg-accent/20 text-accent" :
                "bg-primary/20 text-primary"
              )}>
                 <ShieldAlert size={16} />
              </div>
              <div className="min-w-0 flex-1">
                 <div className="flex items-start justify-between gap-2"><h4 className="text-sm font-bold capitalize text-white">{alert.title}</h4><button type="button" onClick={() => dismissAlert(String(alert.id))} className="shrink-0 rounded-md p-1 text-text-dim hover:bg-white/10 hover:text-white" aria-label={`Dismiss ${alert.title} notification`} title="Dismiss notification"><X size={15} /></button></div>
                 <p className="text-xs text-text-dim mt-1">{alert.message}</p>
                 <div className="text-[9px] uppercase tracking-widest mt-2 opacity-50 font-bold">{alert.severity} Risk Alert</div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function DeviceNetworkSummary() {
  const [device, setDevice] = useState('Detecting device…');
  const [publicIp, setPublicIp] = useState('Checking…');
  const [network, setNetwork] = useState('Browser does not expose network type');
  const [ipError, setIpError] = useState('');
  useEffect(() => {
    const ua = navigator.userAgent || '';
    const tablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    const phone = /Mobi|iPhone|Android.*Mobile|Windows Phone/i.test(ua);
    setDevice(tablet ? 'Tablet' : phone ? 'Mobile phone' : 'Desktop / laptop');
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) setNetwork([conn.type, conn.effectiveType].filter(Boolean).join(' · ') || 'Connection details available');
    fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('IP lookup failed'); return r.json(); })
      .then(d => setPublicIp(typeof d.ip === 'string' ? d.ip : 'Unavailable'))
      .catch(() => { setPublicIp('Unavailable'); setIpError('Public IP lookup failed. Check connectivity or privacy blockers.'); });
  }, []);
  return <div className="space-y-3"><div className="text-[10px] text-text-dim uppercase tracking-widest">Device & Network</div><div className="glass-card p-4 space-y-3 text-[11px]"><div className="flex justify-between gap-3"><span className="text-text-dim">Device type</span><strong>{device}</strong></div><div className="flex justify-between gap-3"><span className="text-text-dim">Public IP</span><strong className="text-right break-all">{publicIp}</strong></div><div className="flex justify-between gap-3"><span className="text-text-dim">Network</span><strong className="text-right">{network}</strong></div><p className="text-[10px] text-text-dim leading-relaxed">IP lookup uses api.ipify.org. Browsers cannot reliably identify the exact laptop model or inspect your private network without a native agent or authorised integration.</p>{ipError && <p role="status" className="text-accent">{ipError}</p>}</div></div>;
}

function AntivirusCenter() {
  return <div className="max-w-6xl mx-auto space-y-6"><div><div className="text-xs uppercase tracking-[.2em] text-primary font-bold">Endpoint security</div><h1 className="text-3xl font-black mt-2">Antivirus & Protection</h1><p className="text-text-dim mt-2 max-w-3xl">Run Microsoft Defender scans on this computer through the local CyberAmour sensor. No file uploads are required.</p></div><LocalSecuritySensor mode="antivirus" /></div>;
}

function Dashboard({ isPermanentOwner, profile, activityLogs, scoreHistory, detectAnomalies, weather, toggleAutoMonitoring, autoRectify, optimizePhone, createAlert, setActiveScreen, logActivity }: any) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [showComplianceInfo, setShowComplianceInfo] = useState(false);
  const [isAutoRectifying, setIsAutoRectifying] = useState(false);


  const handleAutoRectify = async () => {
    if (!isPermanentOwner && !profile?.isPremium && !profile?.isOwner) {
      if (createAlert) {
        createAlert('Premium Required', 'Upgrade to a premium subscription to use Auto-Rectify features.', 'low');
      }
      return;
    }
    
    setIsAutoRectifying(true);
    try {
      const result = await autoRectify();
      if (createAlert && result) {
        createAlert(
          'Alerts Reviewed', 
          `Marked ${result.resolvedAlerts} alert(s) as reviewed. No device files or system settings were changed.`, 
          'low'
        );
      }
    } catch (e) {
      if (createAlert) {
        createAlert('Auto-Rectify Failed', 'An error occurred while attempting to rectify issues automatically.', 'high');
      }
    } finally {
      setIsAutoRectifying(false);
    }
  };


  // This browser app does not have a privileged endpoint agent; do not fabricate real-time block alerts.


  const handleDetect = async () => {
    setIsDetecting(true);
    setDetectionError(null);
    setDetectionResult(null);
    try {
      const result = await detectAnomalies();
      if (!result || typeof result.isAnomaly !== 'boolean' || typeof result.confidence !== 'number') {
        throw new Error('The analysis provider returned no valid verdict. No anomaly conclusion was recorded.');
      }
      setDetectionResult(result);
    } catch (error: any) {
      setDetectionError(error?.message || 'AI anomaly analysis is unavailable. No verdict was produced.');
    } finally {
      setIsDetecting(false);
    }
  };

  const score = profile?.securityScoreSource === 'validated-assessment' && typeof profile?.securityScore === 'number' ? profile.securityScore : null;
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-success';
    if (s >= 50) return 'text-accent';
    return 'text-danger';
  };

  const riskScore = score === null ? null : 100 - score;

  const COLORS = ['#00E5FF', '#8A2BE2', '#FFB020', '#FF3B30', '#00C853'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Security Overview</h2>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <button 
            onClick={handleAutoRectify}
            disabled={isAutoRectifying}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#00E5FF] text-white font-bold rounded-lg hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAutoRectifying ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isAutoRectifying ? 'Reviewing alerts...' : 'Review & Resolve Alerts'}
          </button>
          <MiniWorldClock />
          {weather && <WeatherWidget weather={weather} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 flex flex-col items-center p-6 glass-card space-y-8 w-full min-w-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full border-[10px] border-surface shadow-[0_0_20px_rgba(0,229,255,0.1)]" />
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="riskGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00C853" />
                  <stop offset="50%" stopColor="#FFB020" />
                  <stop offset="100%" stopColor="#FF3B30" />
                </linearGradient>
              </defs>
              <motion.circle 
                cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="10" fill="transparent" 
                className="text-white/5"
              />
              <motion.circle 
                cx="96" cy="96" r="86" stroke="url(#riskGradient)" strokeWidth="10" fill="transparent" strokeLinecap="round"
                strokeDasharray={540.35}
                initial={{ strokeDashoffset: 540.35 }}
                animate={{ strokeDashoffset: riskScore === null ? 540.35 : 540.35 - (540.35 * riskScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] text-text-dim uppercase tracking-widest font-semibold mb-1">Risk Score</span>
              <span className="text-5xl font-black cyber-gradient bg-clip-text text-transparent drop-shadow-md">{riskScore === null ? '—' : riskScore}</span>
              <span className={cn("text-xs font-bold uppercase mt-1 px-2 py-0.5 rounded", 
                riskScore === null ? "bg-surface text-text-dim" : riskScore > 75 ? "bg-danger/20 text-danger" : 
                riskScore > 30 ? "bg-accent/20 text-accent" : "bg-success/20 text-success")}
              >
                {riskScore === null ? 'Not assessed' : riskScore > 75 ? "Critical" : riskScore > 30 ? "Elevated" : "Low Risk"}
              </span>
            </div>
          </div>

          <div className="w-full space-y-3 mt-4 rounded-xl border border-border bg-surface/30 p-4">
            <h4 className="text-[10px] uppercase tracking-widest text-text-dim text-center mb-2">Score methodology</h4>
            <p className="text-xs leading-5 text-text-dim text-center">{riskScore === null ? 'No validated overall security score is available yet. Complete an evidence-based risk assessment to establish a baseline.' : 'This score is sourced from a recorded validated assessment. Individual category breakdowns are not available unless each category was measured separately.'}</p>
            <button onClick={() => setActiveScreen('risk')} className="w-full rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20">Open Risk Assessment</button>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-6 space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim">Score History</h4>
            <div className="flex items-center gap-2 text-[10px] text-text-dim">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Security Posture
            </div>
          </div>
          <div className="h-[180px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreHistory}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  hide 
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickCount={5}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E1228', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#FFFFFF', fontSize: '12px' }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <DeviceHealthChart logActivity={logActivity} createAlert={createAlert} scoreHistory={scoreHistory} optimizePhone={optimizePhone} />

      {/* Evidence-led intelligence: only bundled reference data is shown; no synthetic live-attack activity. */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Database className="text-primary" size={22} />
          <div>
            <h3 className="text-xl font-bold">Evidence-based security intelligence</h3>
            <p className="text-sm text-text-dim mt-1">CyberAmour does not display simulated attack locations, invented incident counts, or unverified live-threat reports.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <button onClick={() => setActiveScreen('attack')} className="rounded-xl border border-border bg-bg/40 p-4 text-left hover:border-primary/50">
            <div className="font-bold text-primary">CISA KEV + MITRE ATT&CK</div>
            <p className="mt-2 text-sm text-text-dim">Search the bundled vulnerability and technique snapshots. Snapshot age is shown in the intelligence workspace; confirm current status with the official sources.</p>
          </button>
          <button onClick={() => setActiveScreen('endpoint')} className="rounded-xl border border-border bg-bg/40 p-4 text-left hover:border-primary/50">
            <div className="font-bold text-primary">Windows Defender scan</div>
            <p className="mt-2 text-sm text-text-dim">Run a real scan through the installed local sensor. No result is reported unless the sensor returns it.</p>
          </button>
        </div>
      </section>

      {/* Device Protection Center */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <ShieldCheck className="text-[#10B981]" size={24} /> Device Protection Center
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">Supported endpoint integration</h4>
            <p className="text-sm text-text-dim">The supported endpoint workflow is Microsoft Defender through the authenticated local Windows sensor. Packet capture, ClamAV/YARA orchestration, Suricata, and Splunk export are not enabled in this build and are not presented as connected.</p>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-primary"/>Microsoft Defender</div>
              <p className="mt-2 text-xs text-text-dim">Requires the local sensor to be running and authorised. Scan status is shown only from the sensor response.</p>
            </div>
            <button onClick={() => setActiveScreen('antivirus')} className="w-full py-3 bg-primary rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity">Open Antivirus & File Scan</button>
          </div>
          <div className="glass-card p-6 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">Operating-system controls</h4>
            <p className="text-sm text-text-dim">These controls are managed by your operating system or a separately installed endpoint agent, not this browser tab.</p>
            {[
              ['Real-time antivirus / EDR', 'Not verified by CyberAmour'],
              ['Firewall and network blocking', 'Not controlled by this website'],
              ['Installed-app permissions', 'Not exposed to this browser'],
              ['Ransomware / behaviour monitoring', 'No endpoint agent connected']
            ].map(([title, state]) => (
              <div key={title} className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
                <div className="text-sm font-medium">{title}</div>
                <span className="text-[10px] uppercase tracking-wide text-amber-200 text-right">{state}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Monitoring & Anomaly Detection */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-primary" size={24} />
            <h3 className="text-xl font-bold">Security Monitoring</h3>
          </div>
          <button 
            onClick={handleDetect}
            disabled={isDetecting || activityLogs.length < 1}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              isDetecting ? "bg-white/5 text-text-dim cursor-not-allowed" : "bg-primary text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            )}
          >
            {isDetecting ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><Activity size={14} /></motion.div>
                Analyzing...
              </>
            ) : (
              <>
                <Zap size={14} />
                Run AI Anomaly Check
              </>
            )}
          </button>
        </div>

        {detectionError && (
          <div role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-100">
            <strong>Analysis unavailable</strong><p className="mt-1">{detectionError}</p><p className="mt-1 text-xs text-text-dim">No clean bill of health or anomaly verdict has been assumed.</p>
          </div>
        )}

        {detectionResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-4 rounded-2xl border flex items-start gap-4",
              detectionResult.isAnomaly 
                ? "bg-danger/10 border-danger/30 text-danger" 
                : "bg-success/10 border-success/30 text-success"
            )}
          >
            <div className="p-2 rounded-full bg-white/10">
              {detectionResult.isAnomaly ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold uppercase tracking-wider">
                {detectionResult.isAnomaly ? 'Anomaly Detected' : 'System Secure'}
              </div>
              <p className="text-xs opacity-80 leading-relaxed">{detectionResult.reason}</p>
              <div className="text-[10px] font-medium opacity-60">
                Confidence: {(detectionResult.confidence * 100).toFixed(0)}% • Severity: {detectionResult.severity}
              </div>
            </div>
          </motion.div>
        )}

        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-text-dim">Recent Activity Logs</span>
            </div>
            <span className="text-[10px] text-text-dim">{activityLogs.length} events recorded</span>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-hide">
            {activityLogs.length === 0 ? (
              <div className="p-10 text-center text-text-dim text-sm italic">No recent activity detected.</div>
            ) : (
              <div className="divide-y divide-border">
                {activityLogs.slice().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((log: any) => (
                  <div key={log.id} className="p-4 hover:bg-white/5 transition-all flex items-start gap-4 group">
                    <div className={cn(
                      "p-2 rounded-xl border border-border shrink-0 mt-0.5",
                      String(log.action).includes('scan') ? "bg-primary/10 text-primary" : 
                      String(log.action).includes('2fa') ? "bg-success/10 text-success" :
                      String(log.action).includes('vault') ? "bg-accent/10 text-accent" :
                      String(log.action).includes('disk') || String(log.action).includes('high_memory') || String(log.action).includes('cache') ? "bg-accent/10 text-accent" : "bg-surface text-text-dim"
                    )}>
                      {String(log.action).includes('scan') ? <Search size={14} /> : 
                       String(log.action).includes('2fa') ? <Lock size={14} /> :
                       String(log.action).includes('vault') ? <Shield size={14} /> :
                       String(log.action).includes('disk') || String(log.action).includes('high_memory') || String(log.action).includes('cache') ? <Activity size={14} /> : <Activity size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-sm capitalize truncate pr-2">
                          {String(log.action).replace(/_/g, ' ')}
                        </div>
                        <div className="text-[10px] text-text-dim whitespace-nowrap font-mono">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-text-dim">
                        <span className="flex items-center gap-1"><Globe size={10} /> {log.ip}</span>
                        <span className="flex items-center gap-1 truncate"><Zap size={10} /> {log.device.split(') ')[0].split(' (')[1] || 'Unknown Device'}</span>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 p-2 bg-bg/50 rounded-lg border border-border/50 text-[9px] font-mono text-text-dim break-all">
                          {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-primary"/><span className="font-semibold">Verified capabilities only</span></div>
          <p className="text-sm text-text-dim">No synthetic breach counts, invented detection percentages, simulated attack locations, or unsupported scan verdicts are displayed. Results appear only when a configured provider or local sensor returns them.</p>
        </div>
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Browser security context</span>
            <span className="text-xs text-accent font-bold">Limited visibility</span>
          </div>
          <div className="text-2xl font-bold">Web session</div>
          <div className="text-xs text-text-dim">A browser cannot inspect the full operating system or certify that this device is malware-free. Use Windows Defender through the local sensor for an actual endpoint scan.</div>
          <button onClick={() => setActiveScreen('antivirus')} className="text-xs text-primary underline">Open Windows Defender</button>
        </div>
        <div className="glass-card p-6 space-y-4 md:col-span-2 lg:col-span-1 border border-accent/20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold flex items-center gap-2"><Zap size={16} className="text-accent" /> Remediation Centre</span>
            <button onClick={() => setActiveScreen('tasks')} className="bg-accent/20 text-accent px-3 py-1 text-xs font-bold rounded-lg hover:bg-accent/30 transition-colors">View actions</button>
          </div>
          <div className="text-2xl font-bold">Review findings</div>
          <div className="text-xs text-text-dim">CyberAmour does not claim to clear files, free memory, block traffic, or remediate devices from the browser. Review documented findings and follow verified remediation steps.</div>
        </div>
      </div>
    </motion.div>
  );
}

function Alerts({ alerts, profile, setActiveScreen }: any) {
  const isPremium = profile?.isPremium;
  const displayAlerts = isPremium ? alerts : alerts.slice(0, 3);

  const getActionForAlert = (alert: any) => {
    const content = (alert.title + " " + alert.message).toLowerCase();
    if (content.includes("identity") || content.includes("lookup") || content.includes("person")) {
      return { screen: 'endpoint', label: 'Open Windows Defender', icon: <ShieldCheck size={14} className="mr-1.5" /> };
    }
    if (content.includes("breach") || content.includes("leak")) {
      return { screen: 'alerts', label: 'Review Alerts', icon: <Bell size={14} className="mr-1.5" /> };
    }
    if (content.includes("scan") || content.includes("phishing") || content.includes("url") || content.includes("forensics")) {
      return { screen: 'endpoint', label: 'Open Windows Defender', icon: <ShieldCheck size={14} className="mr-1.5" /> };
    }
    if (content.includes("network") || content.includes("wifi") || content.includes("transaction") || content.includes("device") || content.includes("anomal")) {
      return { screen: 'endpoint', label: 'Open Endpoint Protection', icon: <ShieldCheck size={14} className="mr-1.5" /> };
    }
    if (content.includes("task") || content.includes("action") || content.includes("to-do")) {
      return { screen: 'tasks', label: 'Open Task Manager', icon: <CheckSquare size={14} className="mr-1.5" /> };
    }
    if (content.includes("setting") || content.includes("password") || content.includes("authentication") || content.includes("2fa")) {
      return { screen: 'settings', label: 'Open Settings', icon: <Settings size={14} className="mr-1.5" /> };
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Security Alerts</h2>
        {!isPremium && alerts.length > 3 && (
          <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded">Limited to 3 alerts (Free)</span>
        )}
      </div>
      
      <div className="space-y-4">
        {displayAlerts.length === 0 ? (
          <div className="text-center py-12 text-text-dim italic">No new alerts. You're safe!</div>
        ) : (
          displayAlerts.map((alert: any) => {
            const action = getActionForAlert(alert);
            return (
              <div key={alert.id} className={cn(
                "glass-card p-5 border-l-4",
                alert.severity === 'critical' ? "border-l-danger" : alert.severity === 'warning' ? "border-l-accent" : "border-l-secondary"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold">{alert.title}</h4>
                  <span className="text-[10px] text-text-dim">{new Date(alert.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-text-dim leading-relaxed">{alert.message}</p>
                {action && (
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => setActiveScreen(action.screen)}
                      className="text-xs bg-surface/50 border border-border px-3 py-1.5 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors flex items-center font-bold"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

function SettingsScreen({ profile, logout, updateUserPreferences, changePassword, isDarkMode, setIsDarkMode, generate2FA, verify2FA, enable2FA, disable2FA, updateLogRetention, clearOldLogs, logActivity, setActiveScreen, toggleAutoMonitoring }: any) {
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showSecurityPrefs, setShowSecurityPrefs] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [passwordToTest, setPasswordToTest] = useState('');

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [notifyAlerts, setNotifyAlerts] = useState(profile?.notificationPrefs?.alerts ?? true);
  const [notifyBreaches, setNotifyBreaches] = useState(profile?.notificationPrefs?.breaches ?? true);
  const [notifySecurity, setNotifySecurity] = useState(profile?.notificationPrefs?.security ?? true);

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length > 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    if (score <= 2) return { label: 'Weak', color: 'bg-danger text-danger', percent: 25 };
    if (score === 3) return { label: 'Fair', color: 'bg-accent text-accent', percent: 50 };
    if (score === 4) return { label: 'Good', color: 'bg-secondary text-secondary', percent: 75 };
    return { label: 'Strong', color: 'bg-success text-success', percent: 100 };
  };

  const handleStartSetup = () => {
    const data = generate2FA();
    setTwoFactorData(data);
    setShow2FASetup(true);
    logActivity('2fa_setup_started');
  };

  const handleConfirmEnable = async () => {
    if (verify2FA(verificationCode, twoFactorData.secret)) {
      await enable2FA(twoFactorData.secret);
      setShow2FASetup(false);
      setTwoFactorData(null);
      setVerificationCode('');
      setError('');
      logActivity('2fa_enabled');
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleDisable2FA = async () => {
    await disable2FA();
    logActivity('2fa_disabled');
  };

  const [showSettingsDownloadQR, setShowSettingsDownloadQR] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold">Settings</h2>
      
      <div className="glass-card p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <UserIcon size={32} className="text-primary" />
            </div>
            <div>
              <div className="font-bold text-lg">{profile?.displayName || "Cyber User"}</div>
              <div className="text-sm text-text-dim">{profile?.email}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettingsDownloadQR(true)} className="px-3 py-1 bg-surface text-xs font-bold border border-border rounded-lg hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1">
              <QrCode size={14} /> Get App
            </button>
            <button onClick={() => setShowProfileEdit(true)} className="px-3 py-1 bg-surface text-xs font-bold border border-border rounded-lg hover:bg-primary/20 hover:text-primary transition-all">
              Edit
            </button>
          </div>
        </div>

        {showSettingsDownloadQR && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 border border-primary/20 rounded-xl bg-surface/50 text-center">
             <h3 className="font-bold text-lg mb-2">Download CyberAmour Mobile</h3>
             <p className="text-sm text-text-dim mb-4 max-w-sm mx-auto">Scan this QR code with your mobile device to open & save the CyberAmour app on the go.</p>
             <div className="bg-white p-4 rounded-xl inline-block">
               <QRCodeSVG value={window.location.origin + window.location.pathname} size={200} />
             </div>
             <div className="mt-4">
               <button onClick={() => setShowSettingsDownloadQR(false)} className="text-xs text-text-dim hover:text-white">Close</button>
             </div>
          </motion.div>
        )}

        <div className="space-y-2">
          <div 
            onClick={() => setActiveScreen('pricing')}
            className="flex justify-between items-center p-4 bg-surface/30 rounded-2xl border border-border hover:border-primary cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-accent" />
              <span className="text-sm font-medium">Premium Membership</span>
            </div>
            <span className="text-xs font-bold text-accent uppercase tracking-widest">
              {profile?.subscriptionTier && profile.subscriptionTier !== 'free' ? 'Manage' : 'Upgrade'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-surface/20" aria-label="VPN integration status">
            <div className="flex items-center gap-3 text-text-dim">
              <Globe size={18} />
              <div>
                <span className="block text-sm font-medium">VPN connection</span>
                <span className="block text-xs text-amber-200">No VPN client connected</span>
              </div>
            </div>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold text-amber-100">Not connected</span>
          </div>

          <div 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center justify-between p-4 hover:bg-surface/30 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-border"
          >
            <div className="flex items-center gap-3 text-text-dim group-hover:text-text-main">
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
              <span className="text-sm font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={cn(
              "w-10 h-5 rounded-full relative transition-colors",
              isDarkMode ? "bg-primary" : "bg-text-dim/30"
            )}>
              <motion.div 
                animate={{ x: isDarkMode ? 20 : 2 }}
                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
              />
            </div>
          </div>

          <div 
            onClick={() => toggleAutoMonitoring()}
            className="flex items-center justify-between p-4 hover:bg-surface/30 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-border"
          >
            <div className="flex items-center gap-3 text-text-dim group-hover:text-text-main">
              <Network size={18} className={profile?.isAutoMonitoringEnabled ? "text-primary" : ""} />
              <span className="text-sm font-medium">Account Activity Anomaly Monitoring</span>
            </div>
            <div className={cn(
              "w-10 h-5 rounded-full relative transition-colors",
              profile?.isAutoMonitoringEnabled ? "bg-primary" : "bg-text-dim/30"
            )}>
              <motion.div 
                animate={{ x: profile?.isAutoMonitoringEnabled ? 20 : 2 }}
                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
              />
            </div>
          </div>

          {/* 2FA Toggle */}
          <div className="flex items-center justify-between p-4 hover:bg-surface/30 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-border">
            <div className="flex items-center gap-3 text-text-dim group-hover:text-text-main">
              <Lock size={18} />
              <span className="text-sm font-medium">Two-Factor Authentication</span>
            </div>
            <button 
              onClick={profile?.is2FAEnabled ? handleDisable2FA : handleStartSetup}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
                profile?.is2FAEnabled ? "border-success text-success bg-success/10" : "border-primary text-primary bg-primary/10"
              )}
            >
              {profile?.is2FAEnabled ? 'Enabled' : 'Setup'}
            </button>
          </div>

          <SettingsItem icon={<Shield size={18} />} label="Security Preferences" onClick={() => setShowSecurityPrefs(true)} />
          <SettingsItem icon={<Bell size={18} />} label="Notification Settings" onClick={() => setShowNotificationPrefs(true)} />
          <SettingsItem icon={<Lock size={18} />} label="Privacy Policy" />
        </div>

        <button 
          onClick={() => {
            import('./utils/sounds').then(s => s.playClickSound());
            logout();
          }}
          className="w-full py-4 flex items-center justify-center gap-2 text-danger font-bold hover:bg-danger/10 rounded-2xl transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      <AnimatePresence>
        {show2FASetup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-sm w-full space-y-6 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">Setup 2FA</h3>
                <p className="text-xs text-text-dim">Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-2xl">
                  <QRCodeSVG value={twoFactorData?.otpauth} size={180} />
                </div>
                <div className="text-center w-full bg-surface/50 p-3 rounded-xl border border-border">
                  <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold mb-1.5">Or enter secret key manually</p>
                  <code className="text-lg font-mono bg-bg px-3 py-1.5 rounded-lg select-all text-primary block break-all">{twoFactorData?.secret}</code>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Verification Code</label>
                  <input 
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-center text-xl font-black tracking-[0.5em] focus:outline-none focus:border-primary"
                  />
                </div>
                {error && <p className="text-xs text-danger text-center">{error}</p>}
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShow2FASetup(false)}
                    className="flex-1 py-3 text-sm font-bold text-text-dim hover:text-text-main transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmEnable}
                    className="flex-1 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg"
                  >
                    Verify & Enable
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showSecurityPrefs && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md w-full space-y-6 shadow-2xl bg-surface"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Security Preferences</h3>
                <button onClick={() => setShowSecurityPrefs(false)} className="text-text-dim hover:text-text-main">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-text-main">Log Retention</div>
                  <p className="text-xs text-text-dim">Automatically clear activity logs older than the selected period.</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((m) => (
                      <button
                        key={m}
                        onClick={() => updateLogRetention(m)}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded-xl border transition-all",
                          profile?.logRetentionMonths === m 
                            ? "bg-primary border-primary text-white" 
                            : "border-border text-text-dim hover:border-primary/50"
                        )}
                      >
                        {m} {m === 1 ? 'Month' : 'Months'}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={clearOldLogs}
                    className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-danger hover:bg-danger/10 rounded-xl transition-all"
                  >
                    Clear Old Logs Now
                  </button>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  <div className="text-sm font-semibold text-text-main">Change Password</div>
                  <div className="space-y-2">
                    <input 
                      type="password" 
                      placeholder="New Password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                    />
                    {newPassword.length > 0 && (
                      <div className="w-full bg-bg rounded-full h-1.5 overflow-hidden">
                        <div 
                           className={cn("h-full transition-all", calculatePasswordStrength(newPassword).color.split(' ')[0])} 
                           style={{ width: `${calculatePasswordStrength(newPassword).percent}%` }} 
                        />
                      </div>
                    )}
                    <button 
                      onClick={async () => {
                        if (newPassword && await changePassword(newPassword)) {
                          setNewPassword('');
                          setShowSecurityPrefs(false);
                        }
                      }}
                      disabled={!newPassword || calculatePasswordStrength(newPassword).percent < 50}
                      className="mt-2 w-full py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl font-bold text-xs hover:bg-primary/30 transition-all disabled:opacity-50"
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  <div className="text-sm font-semibold text-text-main">Security Sessions</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs p-3 bg-bg/50 rounded-xl border border-border">
                      <div>
                        <div className="font-bold">Current browser session</div>
                        <div className="text-[10px] text-text-dim break-all">{typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser details unavailable'} · local session only</div>
                      </div>
                      <span className="text-success font-bold">Current</span>
                    </div>
                    <p className="text-[10px] text-text-dim">Public IP and other signed-in devices are not shown here unless collected by a trusted backend session registry. A local browser page cannot reliably discover your LAN topology.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSecurityPrefs(false)}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}

        {showProfileEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-sm w-full space-y-6 shadow-2xl bg-surface"
            >
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-text-dim font-bold">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowProfileEdit(false)} className="flex-1 py-3 text-sm font-bold text-text-dim hover:text-text-main transition-colors">Cancel</button>
                <button 
                  onClick={async () => {
                    await updateUserPreferences(displayName, null);
                    setShowProfileEdit(false);
                  }}
                  className="flex-1 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg"
                >Save</button>
              </div>
            </motion.div>
          </div>
        )}

        {showNotificationPrefs && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-sm w-full space-y-6 shadow-2xl bg-surface"
            >
              <h3 className="text-xl font-bold">Notification Prefs</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 border border-border rounded-xl hover:border-primary cursor-pointer">
                  <span className="text-sm font-medium">New Alerts</span>
                  <input type="checkbox" checked={notifyAlerts} onChange={(e) => setNotifyAlerts(e.target.checked)} className="accent-primary" />
                </label>
                <label className="flex items-center justify-between p-3 border border-border rounded-xl hover:border-primary cursor-pointer">
                  <span className="text-sm font-medium">Breach Scans</span>
                  <input type="checkbox" checked={notifyBreaches} onChange={(e) => setNotifyBreaches(e.target.checked)} className="accent-primary" />
                </label>
                <label className="flex items-center justify-between p-3 border border-border rounded-xl hover:border-primary cursor-pointer">
                  <span className="text-sm font-medium">Security Tips</span>
                  <input type="checkbox" checked={notifySecurity} onChange={(e) => setNotifySecurity(e.target.checked)} className="accent-primary" />
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowNotificationPrefs(false)} className="flex-1 py-3 text-sm font-bold text-text-dim hover:text-text-main transition-colors">Cancel</button>
                <button 
                  onClick={async () => {
                    await updateUserPreferences(undefined, { alerts: notifyAlerts, breaches: notifyBreaches, security: notifySecurity });
                    setShowNotificationPrefs(false);
                  }}
                  className="flex-1 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg"
                >Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-1">
        <CyberAmourLogo size={96} className="mx-auto mb-3 drop-shadow-[0_0_10px_rgba(0,229,255,0.2)]" />
        <p className="text-[10px] text-text-dim uppercase tracking-[0.2em]">CyberAmour v1.0.0</p>
        <p className="text-[10px] text-text-dim">Developed by Engineer and Software Developer - Tongai Godfrey Mapiye - Cyber Fortress Technologies.</p>
      </div>
    </motion.div>
  );
}

function TwoFactorVerify({ verify, logout }: { verify: (code: string) => boolean, logout: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (verify(code)) {
      setError('');
    } else {
      setError('Invalid code. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 max-w-md w-full space-y-8 shadow-2xl text-center"
      >
        <div className="flex justify-center">
          <div className="p-4 bg-primary/20 rounded-3xl border border-primary/30">
            <Lock size={48} className="text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
          <p className="text-text-dim text-sm">Enter the 6-digit code from your authenticator app to continue.</p>
        </div>

        <div className="space-y-4">
          <input 
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            placeholder="000000"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-4 text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button 
            onClick={handleVerify}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20"
          >
            Verify Identity
          </button>
          <button 
            onClick={logout}
            className="w-full py-2 text-text-dim hover:text-text-main text-xs font-medium"
          >
            Sign out and try another account
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 hover:bg-surface/30 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-border"
    >
      <div className="flex items-center gap-3 text-text-dim group-hover:text-text-main">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight size={16} className="text-text-dim" />
    </div>
  );
}


function WeatherWidget({ weather }: any) {
  const getWeatherIcon = (code: number) => {
    if ([95, 96, 99].includes(code)) return <CloudLightning size={16} className="text-accent" />;
    if ([61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain size={16} className="text-primary" />;
    if ([71, 73, 75, 85, 86].includes(code)) return <Activity size={16} className="text-white" />;
    if (code === 0) return <Sun size={16} className="text-accent" />;
    return <Sun size={16} className="text-text-dim" />;
  };

  return (
    <div className="glass-card px-3 py-1.5 flex items-center gap-3 border-border/50">
      <div className="flex items-center gap-2">
        {getWeatherIcon(weather.weather_code)}
        <span className="text-xs font-bold">{Math.round(weather.temperature_2m)}°C</span>
      </div>
      <div className="h-3 w-[1px] bg-border" />
      <div className="flex items-center gap-2 text-text-dim">
        <Wind size={12} />
        <span className="text-[10px] font-medium">{Math.round(weather.wind_speed_10m)} km/h</span>
      </div>
    </div>
  );
}

function MiniWorldClock() {
  const [time, setTime] = useState(new Date());

  const ALL_ZONES = useMemo(() => {
    try {
      if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
        return Intl.supportedValuesOf('timeZone').map(tz => {
          const parts = tz.split('/');
          const city = parts[parts.length - 1].replace(/_/g, ' ');
          let name = city.substring(0, 3).toUpperCase();
          if (name.length < 3) name = tz.substring(0, 3).toUpperCase();
          return { name, tz };
        });
      }
    } catch(e) {}
    return [
      { name: 'NYC', tz: 'America/New_York' },
      { name: 'LAX', tz: 'America/Los_Angeles' },
      { name: 'LDN', tz: 'Europe/London' },
      { name: 'PAR', tz: 'Europe/Paris' },
      { name: 'TYO', tz: 'Asia/Tokyo' },
      { name: 'SYD', tz: 'Australia/Sydney' },
      { name: 'DXB', tz: 'Asia/Dubai' },
      { name: 'SIN', tz: 'Asia/Singapore' },
      { name: 'HKG', tz: 'Asia/Hong_Kong' },
      { name: 'SAO', tz: 'America/Sao_Paulo' },
      { name: 'JNB', tz: 'Africa/Johannesburg' },
      { name: 'DEL', tz: 'Asia/Kolkata' },
    ];
  }, []);

  const [cities, setCities] = useState([
    ALL_ZONES.find(z => z.tz === 'America/New_York') || ALL_ZONES[0],
    ALL_ZONES.find(z => z.tz === 'Europe/London') || ALL_ZONES[2],
    ALL_ZONES.find(z => z.tz === 'Asia/Tokyo') || ALL_ZONES[4],
    ALL_ZONES.find(z => z.tz === 'Australia/Sydney') || ALL_ZONES[5]
  ]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCityChange = (index: number, newTz: string) => {
    const newZone = ALL_ZONES.find(z => z.tz === newTz);
    if (!newZone) return;
    const newCities = [...cities];
    newCities[index] = newZone;
    setCities(newCities);
  };

  return (
    <div className="glass-card px-4 py-2 flex items-center gap-4 border-border/50 hidden lg:flex shadow-xl">
      <div className="flex items-center gap-2 text-primary">
        <Clock size={16} />
      </div>
      {cities.map((city, idx) => (
        <div key={idx} className="flex items-center gap-4">
          {idx > 0 && <div className="h-4 w-[1px] bg-border" />}
          <div className="flex flex-col leading-tight relative group">
            <select
              value={city.tz}
              onChange={(e) => handleCityChange(idx, e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Change Timezone"
            >
              {ALL_ZONES.map(z => (
                <option key={z.tz} value={z.tz} className="bg-[#0E1228] text-white">{z.name} ({z.tz.split('/')[1]?.replace('_', ' ') || z.tz})</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest transition-colors group-hover:text-primary">{city.name}</span>
              <ChevronDown size={10} className="text-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-sm font-mono font-bold">
              {time.toLocaleTimeString('en-US', { timeZone: city.tz, hour12: false, hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OwnerEntitlementScreen() {
  return <div className="max-w-3xl mx-auto glass-card p-8 space-y-4"><div className="flex items-center gap-3 text-success"><Crown size={28}/><h1 className="text-2xl font-black">Lifetime Owner Access</h1></div><p className="text-text-dim">This authenticated product-owner account is configured for lifetime Premium and Business access. No subscription or upgrade is required.</p><div className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm">Owner entitlements are displayed in this interface. Protected backend services must also enforce the owner entitlement before this can be considered production-secure.</div></div>;
}

function PricingScreen({ profile, upgrade, startCheckout, redeemActivationCode }: any) {
  const [isYearly, setIsYearly] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activationError, setActivationError] = useState('');

  const handleActivation = async () => {
    if (!activationCode.trim()) return;
    setProcessing(true);
    setActivationError('');
    try {
      await redeemActivationCode(activationCode.trim());
      setActivationCode('');
    } catch (e: any) {
      setActivationError(e.message || 'Invalid activation code.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePurchase = async (_productId: string) => {
    setProcessing(true);
    setActivationError('');
    try {
      const checkoutUrl = await startCheckout(isYearly ? 'pro_yearly' : 'pro_monthly');
      window.location.assign(checkoutUrl);
    } catch (e: any) {
      setActivationError(e?.message || 'Secure checkout is not available yet. Please try again later.');
    } finally {
      setProcessing(false);
    }
  };

  const tiers = [
    {
      id: 'basic',
      name: 'Freemium',
      priceMonthly: 0,
      description: 'Ad-supported essential security for everyone.',
      features: [
        'Security Score (Ad-supported)',
        'Limited Alerts (Last 3)',
        'Community Support',
        'Limited on-demand public-source checks; usage limits apply'
      ],
      button: 'Current Plan',
      productId: null
    },
    {
      id: 'premium',
      name: 'Premium',
      priceMonthly: 9.99,
      priceYearly: 89.99,
      description: 'Ad-free access to configured CyberAmour tools. This web app is not a continuously running antivirus or VPN.',
      features: [
        'No Advertisements (AdMob Disabled)',
        'Risk assessments, GRC controls and evidence-linked case records',
        'Windows Defender integration through the local sensor',
        'AI assistant when server-side AI is configured',
        'No background endpoint or network monitoring unless a sensor is installed and connected',
      ],
      button: 'Upgrade to Sub',
      highlight: true,
      productId: {
        monthly: 'ca_premium_monthly',
        annual: 'ca_premium_annual'
      }
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tight">Choose Your Protection</h2>
        <p className="text-text-dim max-w-xl mx-auto">Select the plan that best fits your digital lifestyle. Includes subscriptions and one-time unlocks handled via Google Play Billing or direct transfer.</p>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className={cn("text-sm font-bold transition-colors", !isYearly ? "text-primary" : "text-text-dim")}>Monthly</span>
          <button 
            onClick={() => setIsYearly(!isYearly)}
            className="w-16 h-8 rounded-full bg-surface border border-border relative flex items-center px-1 cursor-pointer transition-colors hover:border-primary"
          >
            <motion.div 
              animate={{ x: isYearly ? 32 : 0 }}
              className="w-6 h-6 rounded-full bg-primary"
            />
          </button>
          <span className={cn("text-sm font-bold transition-colors flex items-center gap-2", isYearly ? "text-primary" : "text-text-dim")}>
            Yearly <span className="bg-success/20 text-success text-[10px] uppercase font-black px-2 py-0.5 rounded">Save 25%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {tiers.map((tier) => {
          const price = isYearly && tier.priceYearly ? tier.priceYearly : tier.priceMonthly;
          const period = tier.priceMonthly === 0 ? '' : (isYearly ? '/yr' : '/mo');
          const currentProductId = tier.productId ? (isYearly ? tier.productId.annual : tier.productId.monthly) : null;

          return (
            <div 
              key={tier.id} 
              className={cn(
                "glass-card p-8 flex flex-col relative overflow-hidden",
                tier.highlight && "border-primary shadow-2xl shadow-primary/10 bg-primary/5"
              )}
            >
              {tier.highlight && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                  Best Value
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <p className="text-xs text-text-dim">{tier.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-black">${price}</span>
                <span className="text-sm text-text-dim">{period}</span>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check size={16} className="text-success mt-0.5 shrink-0" />
                    <span className="text-text-main/80">{f}</span>
                  </li>
                ))}
              </ul>

              <button 
                disabled={profile?.subscriptionTier === tier.id || processing}
                onClick={() => currentProductId && handlePurchase(currentProductId)}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all relative",
                  tier.highlight 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105" 
                    : "bg-surface border border-border hover:border-primary",
                  (profile?.subscriptionTier === tier.id || processing) && "opacity-50 cursor-not-allowed"
                )}
              >
                {processing ? 'Processing...' : (profile?.subscriptionTier === tier.id ? 'Current Plan' : (currentProductId ? `Subscribe via GPB` : tier.button))}
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="max-w-4xl mx-auto mb-12 glass-card p-5 text-sm text-text-dim">
        Checkout is available only when the server-side Stripe price IDs and webhook are configured. CyberAmour will not simulate a successful payment or unlock a plan based on a browser-only action. Contact the administrator for an authorised activation code if checkout is not enabled.
      </div>
    </motion.div>
  );
}

function TaskManagement({ profile, user }: any) {
  const [tasks, setTasks] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cyberamour_tasks') || '[]');
    } catch {
      return [];
    }
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');

  const priorityOrder: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
  const priorityColors: Record<string, string> = { 'High': 'text-danger', 'Medium': 'text-[#F59E0B]', 'Low': 'text-success' };
  const priorityBg: Record<string, string> = { 'High': 'bg-danger/10 border-danger/20', 'Medium': 'bg-[#F59E0B]/10 border-[#F59E0B]/20', 'Low': 'bg-success/10 border-success/20' };

  useEffect(() => {
    localStorage.setItem('cyberamour_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      priority: newTaskPriority,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskPriority('Medium');
    import('./utils/sounds').then(s => s.playSuccessSound());
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t));
    import('./utils/sounds').then(s => s.playClickSound());
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const pDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <CheckSquare className="text-primary" /> Task Manager
          </h2>
          <p className="text-sm text-text-dim mt-1">Organize and prioritize your security actions.</p>
        </div>
      </div>

      <div className="glass-card p-6 border border-border/50 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim">Add New Task</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="E.g., Update router firmware"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <select 
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value)}
            className="bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary shrink-0 min-w-[120px]"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <button 
            onClick={addTask}
            disabled={!newTaskTitle.trim()}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            Add Task
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim">Your Tasks</h3>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs text-text-dim border-none focus:outline-none focus:text-white cursor-pointer"
          >
            <option value="priority">Sort by Priority</option>
            <option value="date">Sort by Recent</option>
          </select>
        </div>
        
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl">
            <CheckSquare size={32} className="mx-auto text-border mb-3" />
            <p className="text-text-dim">No tasks created yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sortedTasks.map(task => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={task.id}
                  className={cn(
                    "glass-card p-4 flex items-center justify-between gap-4 border transition-all",
                    task.status === 'Completed' ? "opacity-60 border-border" : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 container-type">
                    <button 
                      onClick={() => toggleTaskStatus(task.id)}
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center border transition-colors shrink-0",
                        task.status === 'Completed' ? "bg-success border-success text-white" : "border-text-dim hover:border-primary"
                      )}
                    >
                      {task.status === 'Completed' && <CheckSquare size={14} />}
                    </button>
                    <div className="flex-1">
                      <h4 className={cn("text-sm font-bold", task.status === 'Completed' && "line-through text-text-dim")}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <select 
                          value={task.priority}
                          onChange={(e) => {
                            setTasks(tasks.map(t => t.id === task.id ? { ...t, priority: e.target.value } : t));
                          }}
                          className={cn("text-[10px] font-black uppercase tracking-widest px-1 py-0.5 rounded border focus:outline-none appearance-none cursor-pointer", priorityBg[task.priority], priorityColors[task.priority])}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        >
                          <option value="High" className="bg-bg text-danger">HIGH</option>
                          <option value="Medium" className="bg-bg text-[#F59E0B]">MEDIUM</option>
                          <option value="Low" className="bg-bg text-success">LOW</option>
                        </select>
                        <span className="text-[10px] text-text-dim">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-text-dim hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AdminQueue({ generateActivationCode }: any) {
  const [usersQueue, setUsersQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState('');

  useEffect(() => {
    // Grab pending or flagged users
    const q = query(collection(db, 'users'), where('status', 'in', ['pending', 'flagged']));
    const unsub = onSnapshot(q, (snap) => {
      setUsersQueue(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAction = async (uid: string, action: 'approve' | 'block') => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: action === 'approve' ? 'active' : 'blocked' });
    } catch (e) {
      console.error(e);
      alert("Failed to update user status.");
    }
  };
  
  const handleGenerateCode = async (tier: 'premium' | 'business') => {
    setGeneratingCode(true);
    try {
      const code = await generateActivationCode(tier, linkedEmail);
      setGeneratedCode(code);
      setLinkedEmail(''); // Clear the email field after successful generation
      navigator.clipboard.writeText(code);
    } catch (e: any) {
       alert(e.message || 'Failed to generate code.');
    } finally {
      setGeneratingCode(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-danger/20 rounded-xl">
          <ShieldAlert className="text-danger" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Queue: Account Reviews & Approvals</h2>
          <p className="text-sm text-text-dim mt-1">Review accounts and generate manual activation codes.</p>
        </div>
      </div>
      
      <div className="glass-card p-6 border-accent/30 bg-surface/50 mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings size={18} className="text-accent" /> Offline Code Generation</h3>
        <p className="text-sm text-text-dim mb-4">Generate activation codes for Premium or Business subscriptions. Optionally link a code to a specific customer email.</p>
        
        <div className="mb-4 max-w-sm">
          <label className="block text-sm font-bold text-text-dim mb-2">Link to Customer Email (Optional)</label>
          <input 
            type="email"
            placeholder="customer@example.com"
            value={linkedEmail}
            onChange={(e) => setLinkedEmail(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
             onClick={() => handleGenerateCode('premium')}
             disabled={generatingCode}
             className="px-6 py-2 bg-accent text-white font-bold rounded-xl disabled:opacity-50 hover:bg-accent/80 transition-colors"
          >
             {generatingCode ? 'Generating...' : 'Premium Account'}
          </button>
          
          {generatedCode && (
            <div className="bg-[#0F172A] border border-[#10B981] px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="font-mono text-lg font-black tracking-widest text-[#10B981]">{generatedCode}</span>
              <button 
                 onClick={() => {
                   navigator.clipboard.writeText(generatedCode);
                   alert('Copied to clipboard');
                 }}
                 className="text-text-dim hover:text-white"
              >
                <Copy size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10 text-text-dim max-w-sm mx-auto">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }} className="inline-block p-4">
             <ShieldAlert size={32} className="text-danger/50" />
          </motion.div>
          <div className="mt-2 text-sm uppercase tracking-widest font-black text-danger/50">Loading account review queue</div>
        </div>
      ) : usersQueue.length === 0 ? (
        <div className="glass-card p-12 text-center text-text-dim border-border/50">
          <ShieldCheck size={48} className="mx-auto mb-4 text-success/50" />
          <h3 className="text-xl font-bold mb-2 text-white">Queue is Empty</h3>
          <p>No users are currently pending review. This does not establish that the ecosystem is secure.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {usersQueue.map((u) => (
            <div key={u.id} className={cn("glass-card p-6 border-l-4", u.status === 'flagged' ? 'border-l-danger bg-danger/5' : 'border-l-[#F59E0B] bg-[#F59E0B]/5')}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{u.displayName || 'Unknown Identity'}</h3>
                  <p className="text-sm text-text-dim font-mono">{u.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded", u.status === 'flagged' ? 'bg-danger/20 text-danger' : 'bg-[#F59E0B]/20 text-[#F59E0B]')}>
                      {u.status}
                    </span>
                    <span className="text-xs text-text-dim">Score: {u.securityScore}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(u.id, 'approve')} className="px-4 py-2 bg-success/20 text-success rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-success/20">Approve</button>
                  <button onClick={() => handleAction(u.id, 'block')} className="px-4 py-2 bg-surface border border-danger/50 text-danger rounded-xl text-xs font-bold hover:bg-danger/10 transition-all">Block/Lock</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}


function DownloadQRModal({ onClose }: { onClose: () => void }) {
  const downloadUrl = window.location.origin + window.location.pathname;
  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-surface border border-primary/30 rounded-3xl p-8 w-full max-w-sm relative text-center shadow-[0_0_50px_rgba(0,229,255,0.15)] animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-dim hover:text-white text-xl font-bold p-2 transition-colors cursor-pointer"
        >
          ✕
        </button>
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
          <QrCode className="text-primary" size={24} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Download CyberAmour</h3>
        <p className="text-xs text-text-dim leading-relaxed mb-6">
          Scan this QR code with your mobile device to open & install the CyberAmour app on the go.
        </p>
        
        <div className="bg-white p-5 rounded-2xl inline-block shadow-inner mb-6 mx-auto">
          <QRCodeSVG value={downloadUrl} size={180} />
        </div>
        
        <div className="space-y-2 text-left bg-surface/40 p-4 rounded-xl border border-border text-xs">
          <div className="flex gap-2">
            <span className="text-primary font-bold font-mono">1.</span>
            <span className="text-text-dim">Open your phone's camera app.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold font-mono">2.</span>
            <span className="text-text-dim">Point it at the QR code above.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold font-mono">3.</span>
            <span className="text-text-dim">Tap the browser notification banner to open the app instantly.</span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl border border-primary/20 transition-all text-sm cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}


