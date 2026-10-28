import { geoUrl } from "./worldMapData";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line
} from "react-simple-maps";
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

type Screen = 'soc' | 'endpoint' | 'attack' | 'dashboard' | 'antivirus' | 'scan' | 'alerts' | 'ai' | 'features' | 'settings' | 'pricing' | 'darkweb' | 'network' | 'admin' | 'tasks' | 'identity' | 'guide' | 'clock' | 'risk' | 'grc' | 'osint' | 'cases' | 'reports';

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
    breaches, 
    scans, 
    alerts, 
    activityLogs,
    scoreHistory,
    weather,
    loading,
    profileLoadError,
    is2FAVerified,
    fetchThreatIntelSummary,
    fetchDeviceIntelSummary,
    login, 
    logout,
    updateUserPreferences,
    changePassword,
    performPhishingScan, 
    checkBreaches,
    createAlert,
    askAI,
    getGlobalThreatData,
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
  const [activeLinkSource, setActiveLinkSource] = useState<{ id: string, name: string } | null>(null);
  const [linkages, setLinkages] = useState<{sourceId: string, sourceName: string, targetId: string, targetName: string, type: string}[]>([]);
  const [showLinkModal, setShowLinkModal] = useState<{targetId: string, targetName: string} | null>(null);
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

  const handleConfirmLink = (type: string) => {
    if (activeLinkSource && showLinkModal) {
      setLinkages(prev => [...prev, {
        sourceId: activeLinkSource.id,
        sourceName: activeLinkSource.name,
        targetId: showLinkModal.targetId,
        targetName: showLinkModal.targetName,
        type
      }]);
      setShowLinkModal(null);
    }
  };

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
            <SidebarItem active={activeScreen === 'osint'} onClick={() => setActiveScreen('osint')} icon={<Network size={18} />} label="Threat Intelligence & OSINT" />
            <SidebarItem active={activeScreen === 'soc'} onClick={() => setActiveScreen('soc')} icon={<Activity size={18} />} label="SOC API Dashboard" />
            <SidebarItem active={activeScreen === 'attack'} onClick={() => setActiveScreen('attack')} icon={<Database size={18} />} label="ATT&CK + KEV Intelligence" />
            <SidebarItem active={activeScreen === 'endpoint'} onClick={() => setActiveScreen('endpoint')} icon={<HardDrive size={18} />} label="Windows Endpoint Scan" />
            <SidebarItem active={activeScreen === 'antivirus'} onClick={() => setActiveScreen('antivirus')} icon={<ShieldCheck size={18} />} label="Antivirus & File Scan" />
            <SidebarItem active={activeScreen === 'scan'} onClick={() => setActiveScreen('scan')} icon={<Search size={18} />} label="Security Scans" />
            <SidebarItem active={activeScreen === 'darkweb'} onClick={() => setActiveScreen('darkweb')} icon={<Ghost size={18} />} label="Public Breach Intelligence" />
            <SidebarItem active={activeScreen === 'network'} onClick={() => setActiveScreen('network')} icon={<Network size={18} />} label="Network & Device" />
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
              {activeScreen === 'osint' && <EnterpriseRiskWorkspace key="osint" section="osint" onLiveOsint={performPhishingScan} />}
              {activeScreen === 'cases' && <EnterpriseRiskWorkspace key="cases" section="cases" />}
              {activeScreen === 'reports' && <EnterpriseRiskWorkspace key="reports" section="reports" />}
              {activeScreen === 'dashboard' && <Dashboard key="dashboard" isPermanentOwner={isPermanentOwner} askAI={askAI} setActiveScreen={setActiveScreen} fetchDeviceIntelSummary={fetchDeviceIntelSummary} fetchThreatIntelSummary={fetchThreatIntelSummary} profile={profile} breaches={breaches} scans={scans}  globalThreats={getGlobalThreatData()} activityLogs={activityLogs} scoreHistory={scoreHistory} detectAnomalies={detectAnomalies} weather={weather} toggleAutoMonitoring={toggleAutoMonitoring} autoRectify={autoRectify} optimizePhone={optimizePhone} createAlert={createAlert} performScan={performPhishingScan} logActivity={logActivity} />}
              {activeScreen === 'antivirus' && <AntivirusCenter />}
              {activeScreen === 'scan' && <ScanCenter key="scan" askAI={askAI} scans={scans} performScan={performPhishingScan} rewardUserWithScan={rewardUserWithScan} checkBreaches={checkBreaches} logActivity={logActivity} setActiveScreen={setActiveScreen} profile={profile} activeLinkSource={activeLinkSource} setActiveLinkSource={setActiveLinkSource} setShowLinkModal={setShowLinkModal} linkages={linkages} />}
              {activeScreen === 'network' && <NetworkDeviceMonitor key="network" setActiveScreen={setActiveScreen} scanNetwork={scanNetwork} scanDevice={scanDevice} monitorTransactions={monitorTransactions} profile={profile} activeLinkSource={activeLinkSource} setActiveLinkSource={setActiveLinkSource} setShowLinkModal={setShowLinkModal} linkages={linkages} />}
              {activeScreen === 'darkweb' && <DarkWebMonitor key="darkweb" askAI={askAI} profile={profile} breaches={breaches} scans={scans} scanDarkWeb={scanDarkWeb} setActiveScreen={setActiveScreen} />}
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
        <NavButton active={activeScreen === 'osint'} onClick={() => setActiveScreen('osint')} icon={<Network size={20} />} label="OSINT" />
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
        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><LinkIcon size={18} className="text-primary"/> Link to {showLinkModal.targetName}</h3>
              <p className="text-sm text-text-dim mb-4">Select the relationship type:</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const type = formData.get('linkType') as string;
                if (type) handleConfirmLink(type);
              }}>
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto mb-4">
                  {["Execution", "Persistence", "Traffic", "Modification", "Association"].map(t => (
                    <label key={t} className="flex items-center gap-3 p-3 bg-bg/50 border border-border rounded-lg cursor-pointer hover:bg-surface/50 transition-colors">
                      <input type="radio" name="linkType" value={t} className="w-4 h-4 text-primary bg-bg border-border focus:ring-primary focus:ring-2" required defaultChecked={t === "Association"} />
                      <span className="text-sm font-medium text-text-main">{t}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 w-full mt-4">
                  <button type="button" onClick={() => setShowLinkModal(null)} className="flex-1 px-4 py-2 text-sm text-text-dim hover:text-white bg-surface hover:bg-border/50 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 text-sm text-bg bg-primary font-bold hover:bg-primary/90 rounded-lg transition-colors">Confirm Link</button>
                </div>
              </form>
            </div>
          </div>
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

function QuickUrlScanner({ performScan, askAI, setActiveScreen }: any) {
  const [input, setInput] = useState('');
  const [scanType, setScanType] = useState<'url' | 'file'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { isValidFormat, formatError } = React.useMemo(() => {
    if (!input) return { isValidFormat: true, formatError: '' };
    if (scanType === 'url') {
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]{1,5})?(\/.*)?$/;
      const valid = urlPattern.test(input.trim());
      return { isValidFormat: valid, formatError: valid ? '' : 'Invalid URL format' };
    }
    return { isValidFormat: true, formatError: '' };
  }, [input, scanType]);

  const handleScan = async () => {
    if (scanType === 'url' && !isValidFormat) return;
    if (scanType === 'file' && !imageFile) return;
    
    setScanning(true);
    setResult(null);
    setErrorMsg(null);
    try {
      let res;
      if (scanType === 'file' && imageFile) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(imageFile);
        });
        const fileData = { mimeType: imageFile.type || 'application/octet-stream', data: base64Data, name: imageFile.name };
        res = await performScan('file', imageFile.name, fileData);
      } else {
        res = await performScan('url', input);
      }
      setResult(res);
    } catch (e: any) {
      if (e.message === 'LIMIT_REACHED') {
        setErrorMsg("You've used your 5 free Cyber Forensics scans. Upgrade to a subscription-based membership to access premium features.");
      }
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-[#10B981]/20 p-2 rounded-xl border border-[#10B981]/30">
            {scanType === 'url' ? <LinkIcon size={18} className="text-[#10B981]" /> : <FileText size={18} className="text-[#10B981]" />}
          </div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">Quick Threat Scanner</h4>
        </div>
        <div className="flex bg-surface/50 border border-border rounded-lg p-1">
          <button onClick={() => { setScanType('url'); setInput(''); setResult(null); setImageFile(null); }} className={cn("px-3 py-1 text-xs font-bold rounded flex items-center gap-1", scanType === 'url' ? "bg-primary text-white" : "text-text-dim hover:text-white")}><LinkIcon size={12}/> URL</button>
          <button onClick={() => { setScanType('file'); setInput(''); setResult(null); setImageFile(null); }} className={cn("px-3 py-1 text-xs font-bold rounded flex items-center gap-1", scanType === 'file' ? "bg-primary text-white" : "text-text-dim hover:text-white")}><FileText size={12}/> File</button>
        </div>
      </div>
      
      {scanType === 'url' ? (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Paste URL to scan for phishing & malware..."
              className={cn("w-full bg-surface/50 border rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none transition-colors", input ? (isValidFormat ? "border-success focus:border-success text-success" : "border-danger focus:border-danger text-danger") : "border-border focus:border-[#10B981]")}
            />
            {input && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isValidFormat ? <CheckCircle2 size={16} className="text-success" /> : <AlertTriangle size={16} className="text-danger" />}
              </div>
            )}
            {!isValidFormat && input && (
              <p className="text-xs text-danger mt-1 absolute -bottom-5">{formatError}</p>
            )}
          </div>
          <button 
            onClick={handleScan}
            disabled={scanning || !input || !isValidFormat}
            className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#34D399] disabled:opacity-50 text-bg font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 shrink-0"
          >
            {scanning ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Scan size={18} /></motion.div> : <Scan size={18} />}
            {scanning ? "Scanning..." : "Scan URL"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div onClick={() => fileInputRef.current?.click()} className="flex-1 w-full bg-surface/30 border border-dashed border-[#10B981]/50 hover:bg-[#10B981]/5 hover:border-[#10B981] cursor-pointer rounded-xl py-3 px-4 flex justify-between items-center transition-colors">
            <span className={cn("text-sm truncate mr-4", imageFile ? "text-[#10B981] font-bold" : "text-text-dim")}>{imageFile ? imageFile.name : 'Click to select a file...'}</span>
            <FileText size={18} className="text-[#10B981] shrink-0" />
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setImageFile(f); }} />
          </div>
          <button 
            onClick={handleScan}
            disabled={scanning || !imageFile}
            className="px-6 py-3 w-full md:w-auto bg-gradient-to-r from-[#10B981] to-[#34D399] disabled:opacity-50 text-bg font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 shrink-0"
          >
            {scanning ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Scan size={18} /></motion.div> : <Scan size={18} />}
            {scanning ? "Scanning..." : "Scan File"}
          </button>
        </div>
      )}

      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm font-medium flex justify-between items-center"
          >
            <div>{errorMsg}</div>
            {setActiveScreen && /LIMIT_REACHED|limit reached/i.test(String(errorMsg)) && (
              <button onClick={() => setActiveScreen('pricing')} className="px-4 py-2 bg-danger text-white rounded-lg text-xs font-bold hover:bg-danger/80 transition uppercase tracking-widest ml-4 whitespace-nowrap">View plans</button>
            )}
          </motion.div>
        )}
        {result && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-xl border border-border bg-surface overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4">
               <div className={cn("p-2 rounded-lg", result.verdict === 'Safe' ? "bg-success/20 text-success" : result.verdict === 'Suspicious' ? "bg-accent/20 text-accent" : "bg-danger/20 text-danger")}>
                  {result.verdict === 'Safe' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
               </div>
               <div>
                  <div className="text-sm font-bold">{result.verdict}</div>
                  <div className="text-xs text-text-dim capitalize">URL Analysis</div>
               </div>
               <div className="ml-auto flex items-center gap-2">
                 <div className="text-xs text-text-dim uppercase tracking-wider font-bold">Risk Score</div>
                 <div className={cn("text-xl font-bold", result.riskScore >= 70 ? 'text-danger' : result.riskScore >= 40 ? 'text-accent' : 'text-success')}>
                   {typeof result.riskScore === 'number' ? `${result.riskScore}/100` : 'Not scored'}
                 </div>
               </div>
            </div>
            
            <p className="text-sm text-text-main mb-4">{result.analysis}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
              {(result.domainReputation) && (
                <div className="p-3 bg-white/5 rounded-lg border border-border">
                  <div className="text-[10px] text-text-dim uppercase font-bold mb-1">Domain Reputation</div>
                  <div>{result.domainReputation}</div>
                </div>
              )}
              {(result.sslStatus) && (
                <div className="p-3 bg-white/5 rounded-lg border border-border">
                  <div className="text-[10px] text-text-dim uppercase font-bold mb-1">SSL Status</div>
                  <div>{result.sslStatus}</div>
                </div>
              )}
              {(result.redirectionPatterns) && (
                <div className="p-3 bg-white/5 rounded-lg border border-border">
                  <div className="text-[10px] text-text-dim uppercase font-bold mb-1">Redirection</div>
                  <div>{result.redirectionPatterns}</div>
                </div>
              )}
            </div>

            {result.redFlags && result.redFlags.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-danger flex items-center gap-2"><AlertTriangle size={14} /> Security Indicators</h5>
                {result.redFlags.map((flag: any, idx: number) => (
                  <div key={idx} className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm">
                    <strong>{flag.indicator}</strong>
                    <div className="text-xs mt-1 opacity-80">{flag.advice}</div>
                  </div>
                ))}
              </div>
            )}
            
            {askAI && <AIInsightBox data={result} contextKey={`quick-url-${input}`} askAI={askAI} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScanTimeline({ result, scanType }: any) {
  const collectedAt = result?.collectedAt || result?.createdAt;
  const sources = Array.isArray(result?.sources) ? result.sources : [];
  return <div className="mt-6 border-t border-border pt-4">
    <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">Evidence and collection details</h4>
    <div className="mt-3 space-y-3 text-sm">
      <div className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-primary"/><div><b>Analysis type</b><div className="text-text-dim">{String(scanType || result?.type || 'Security review')}</div></div></div>
      {collectedAt && <div className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-primary"/><div><b>Result collected</b><div className="text-text-dim">{new Date(collectedAt).toLocaleString()}</div></div></div>}
      <div className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-primary"/><div><b>Source evidence</b><div className="text-text-dim">{sources.length ? `${sources.length} source link(s) returned` : 'No source links were returned. Verify configuration; absence of sources is not a clean verdict.'}</div></div></div>
    </div>
  </div>;
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
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [status, setStatus] = useState<'idle'|'hashing'|'checking'|'done'|'error'>('idle');
  const [report, setReport] = useState<any>(null);
  const [message, setMessage] = useState('');
  const chooseFile = async (next: File | null) => {
    setFile(next); setHash(''); setReport(null); setMessage(''); setStatus('idle');
    if (!next) return;
    try {
      setStatus('hashing');
      const digest = await crypto.subtle.digest('SHA-256', await next.arrayBuffer());
      const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
      setHash(hex); setStatus('idle');
    } catch { setStatus('error'); setMessage('This browser could not calculate a SHA-256 hash. Try a modern browser.'); }
  };
  const checkReputation = async () => {
    if (!hash) return;
    setStatus('checking'); setReport(null); setMessage('');
    try {
      const lookup = httpsCallable(functions, 'lookupFileReputation');
      const result: any = await lookup({ sha256: hash });
      if (!result.data?.configured) { setStatus('error'); setMessage('Live file reputation is not configured yet. Set the VIRUSTOTAL_API_KEY Firebase secret and deploy the lookupFileReputation Cloud Function. No scan result has been fabricated.'); return; }
      if (result.data?.found === false) { setReport({ ...result.data, notFound: true }); setStatus('done'); return; }
      setReport(result.data); setStatus('done');
    } catch (e: any) {
      setStatus('error'); setMessage(e?.message || 'The live reputation service could not be reached. No clean verdict is assumed.');
    }
  };
  return <div className="max-w-5xl mx-auto space-y-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs uppercase tracking-[.2em] text-primary font-bold">Endpoint security</div><h1 className="text-3xl font-black mt-2">Antivirus & File Reputation</h1><p className="text-text-dim mt-2 max-w-2xl">Calculate a file's SHA-256 fingerprint locally and check its reputation against a configured live threat-intelligence provider.</p></div><span className="text-xs border border-accent/30 rounded-full px-3 py-2 text-accent">Reputation lookup · not full-device antivirus</span></div><div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm text-text-dim">Important: a website running in a browser cannot scan your entire laptop, memory, running processes or all installed apps. This page does not upload your file to the reputation provider; it submits only the SHA-256 hash. Unknown hashes are not proof of safety.</div><LocalSecuritySensor mode="antivirus" /><div className="glass-card p-6 space-y-5"><label className="block text-sm font-semibold">Select a file to check<input type="file" className="block w-full mt-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-bold file:text-white" onChange={e => chooseFile(e.target.files?.[0] || null)} /></label>{file && <div className="rounded-xl border border-border p-4 space-y-2"><div className="flex flex-wrap justify-between gap-2"><strong>{file.name}</strong><span className="text-text-dim text-xs">{(file.size/1024).toFixed(1)} KB · {file.type || 'Unknown MIME type'}</span></div><div className="text-xs text-text-dim break-all">SHA-256: {hash || 'Calculating…'}</div></div>}<div className="flex flex-wrap gap-3"><button className="rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50" disabled={!hash || status==='checking' || status==='hashing'} onClick={checkReputation}>{status==='checking' ? 'Checking live reputation…' : 'Check live reputation'}</button><button className="rounded-xl border border-border px-5 py-3" onClick={() => {setFile(null);setHash('');setReport(null);setMessage('');setStatus('idle');}}>Clear</button></div>{status==='hashing' && <p className="text-sm text-text-dim">Calculating SHA-256 locally…</p>}{message && <p role="status" className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">{message}</p>}{report && <div className="rounded-xl border border-border p-5 space-y-3"><h2 className="text-lg font-bold">Live provider response</h2>{report.notFound ? <p className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm">This hash was not found in the provider database. This is an <strong>unknown result</strong>, not a clean verdict. Use a trusted endpoint security product for a full scan.</p> : <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Malicious',report.malicious],['Suspicious',report.suspicious],['Harmless',report.harmless],['Undetected',report.undetected]].map(([label,value])=><div key={String(label)} className="rounded-lg bg-surface p-3"><div className="text-xs text-text-dim">{label}</div><div className="text-2xl font-black">{value ?? '—'}</div></div>)}</div>}<p className="text-xs text-text-dim">Source: VirusTotal file reputation · Retrieved {report.retrievedAt || 'just now'}. Reputation results are indicative and can be incomplete.</p>{report.permalink && <a href={report.permalink} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Open provider report</a>}</div>}</div></div>;
}

function ThreatMap() {
  const mapData = useMemo(() => {
    return [
      { name: "NA Command", coordinates: [-100, 40], isSource: false, color: "#10B981" },
      { name: "EU Target", coordinates: [15, 50], isSource: false, color: "#EF4444" },
      { name: "APAC Node", coordinates: [110, 30], isSource: true, color: "#F59E0B" },
      { name: "SA Node", coordinates: [-60, -10], isSource: true, color: "#8B5CF6" },
      { name: "AF Gateway", coordinates: [20, 10], isSource: true, color: "#EF4444" },
      { name: "ME Vector", coordinates: [45, 25], isSource: false, color: "#10B981" },
    ];
  }, []);

  return (
    <div className="relative w-full h-[300px] md:h-[400px] bg-surface/50 rounded-xl overflow-hidden border border-border mt-4">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-text-main filter drop-shadow-md">Global Activity Map</h4>
        <div className="flex flex-col gap-1 text-[10px] text-text-dim bg-black/50 p-2 rounded backdrop-blur">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></div> High Threat</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Secured Zone</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div> Anomaly Detected</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div> Unknown Vector</div>
        </div>
      </div>
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1E293B"
                stroke="#334155"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#334155", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        {mapData.map((marker, i) => (
          <Marker key={`marker-${i}`} coordinates={marker.coordinates as any}>
            <circle r={6} fill={marker.color} stroke="#0E1228" strokeWidth={2} />
            <circle r={12} fill={marker.color} opacity={0.3} className="animate-ping" />
          </Marker>
        ))}
        {mapData.filter(m => !m.isSource).map((target, i) => {
          const sources = mapData.filter(m => m.isSource);
          const source = sources[i % sources.length];
          return (
            <Line
              key={`line-${i}`}
              from={source.coordinates as any}
              to={target.coordinates as any}
              stroke={target.color}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              className="animate-pulse"
              style={{ strokeOpacity: 0.6 }}
            />
          );
        })}
      </ComposableMap>
    </div>
  );
}

function Dashboard({ isPermanentOwner, profile, breaches, scans, fetchDeviceIntelSummary, fetchThreatIntelSummary, globalThreats, activityLogs, scoreHistory, detectAnomalies, weather, toggleAutoMonitoring, autoRectify, optimizePhone, createAlert, performScan, setActiveScreen, askAI, logActivity }: any) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [intelSummary, setIntelSummary] = useState<string | null>(null);
  const [isRefreshingIntel, setIsRefreshingIntel] = useState(false);
  const [deviceIntelSummary, setDeviceIntelSummary] = useState<string | null>(null);
  const [showComplianceInfo, setShowComplianceInfo] = useState(false);
  const fetchingIntel = useRef(false);
  const [isAutoRectifying, setIsAutoRectifying] = useState(false);

  const handleRefreshIntelSummary = async () => {
    setIsRefreshingIntel(true);
    setIntelSummary(null);
    try {
      const globalText = await fetchThreatIntelSummary(true);
      setIntelSummary(globalText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshingIntel(false);
    }
  };

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

  useEffect(() => {
    let mounted = true;
    const loadSummaries = async () => {
      if (fetchingIntel.current) return;
      fetchingIntel.current = true;
      const deviceText = await fetchDeviceIntelSummary();
      if (mounted) {
        setDeviceIntelSummary(deviceText);
      }
      setTimeout(async () => {
        const globalText = await fetchThreatIntelSummary();
        if (mounted) {
          setIntelSummary(globalText);
        }
      }, 30000);
      fetchingIntel.current = false;
    };
    if (!intelSummary || !deviceIntelSummary) {
      loadSummaries();
    }
    return () => { mounted = false; };
  }, [fetchDeviceIntelSummary, fetchThreatIntelSummary, intelSummary, deviceIntelSummary]);

  // This browser app does not have a privileged endpoint agent; do not fabricate real-time block alerts.


  const handleDetect = async () => {
    setIsDetecting(true);
    const result = await detectAnomalies();
    setDetectionResult(result);
    setIsDetecting(false);
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

      <CyberNewsFeed createAlert={createAlert} askAI={askAI} />

      {/* Global Threat Intelligence Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="text-primary" size={24} />
          <h3 className="text-xl font-bold">Global Threat Intelligence</h3>
        </div>
        
        <div className="rounded-xl border border-border bg-surface/30 p-4 text-sm text-text-dim">
          Framework incident counts, compliance violation totals, and regional attack counts are not connected to verified live telemetry, so they are intentionally not displayed. The live summary below uses server-side Google Search grounding when configured and includes source references where returned.
        </div>

        {/* AI Threat Intel Summary */}
        <div className="glass-card p-6 space-y-4 col-span-1 lg:col-span-3">
          <div className="flex items-center gap-3 mb-2">
           <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
             <MessageSquare size={18} className="text-primary" />
           </div>
           <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">AI Threat Summary</h4>
           <div className="flex items-center gap-2 ml-auto">
             <button
               onClick={handleRefreshIntelSummary}
               disabled={isRefreshingIntel || !intelSummary}
               className="p-1.5 text-text-dim hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
               title="Refresh AI Summary"
               aria-label="Refresh AI Summary"
             >
               <RefreshCw size={14} className={cn(isRefreshingIntel && "animate-spin")} />
             </button>
             <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">AI Summarized</span>
           </div>
          </div>
          {intelSummary ? (
            <div className="text-sm text-text-main leading-relaxed space-y-3 prose prose-invert prose-p:my-1 prose-strong:text-white prose-h3:text-primary prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-2 prose-ul:ml-4 prose-ul:list-disc prose-li:my-0.5 max-w-none break-words whitespace-pre-wrap">
               <ReactMarkdown>{intelSummary}</ReactMarkdown>
            </div>
          ) : (
             <div className="flex items-center gap-3 text-text-dim text-sm animate-pulse">
               <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
               Analyzing global threat reports...
             </div>
          )}
        </div>

        {/* Device Intel Summary */}
        <div className="glass-card p-6 space-y-4 col-span-1 lg:col-span-3">
          <div className="flex items-center gap-3 mb-2">
           <div className="bg-[#3B82F6]/20 p-2 rounded-xl border border-[#3B82F6]/30">
             <Smartphone size={18} className="text-[#3B82F6]" />
           </div>
           <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">Device Intelligence & Security Status</h4>
           <span className="text-[10px] text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded ml-auto">Local Device</span>
          </div>
          {deviceIntelSummary ? (
            <div className="text-sm text-text-main leading-relaxed space-y-3 prose prose-invert prose-p:my-1 prose-strong:text-white prose-h3:text-[#3B82F6] prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-2 prose-ul:ml-4 prose-ul:list-disc prose-li:my-0.5 max-w-none break-words whitespace-pre-wrap">
               <ReactMarkdown>{deviceIntelSummary}</ReactMarkdown>
            </div>
          ) : (
             <div className="flex items-center gap-3 text-text-dim text-sm animate-pulse">
               <div className="w-4 h-4 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin" />
               Analyzing local device status...
             </div>
          )}
        </div>
        <div className="glass-card p-6 space-y-4 col-span-1 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-danger/20 p-2 rounded-xl border border-danger/30">
                <Ghost size={18} className="text-danger" />
              </div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">Public Breach Intelligence</h4>
            </div>
            <button 
               onClick={() => setActiveScreen('darkweb')}
               className="text-xs bg-danger/10 text-danger border border-danger/20 px-4 py-2 rounded-xl hover:bg-danger/20 transition-colors font-bold uppercase tracking-widest"
            >
              Open Public Breach Intelligence
            </button>
          </div>
          <div className="text-sm text-text-dim max-w-xl">
             Search configured public sources for published breach notices and reputable cybersecurity reporting. This is not continuous dark-web monitoring and does not access private leak sites.
          </div>
        </div>
        <QuickUrlScanner performScan={performScan} setActiveScreen={setActiveScreen} />
      </section>

      {/* Device Protection Center */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <ShieldCheck className="text-[#10B981]" size={24} /> Device Protection Center
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-text-dim">Connected protection tools</h4>
            <p className="text-sm text-text-dim">The website does not run background antivirus, memory inspection, or firewall filtering by itself. Connect the local sensor to use installed open-source scanning and packet-analysis tools.</p>
            <div className="space-y-3">
              {[['File malware scan', 'ClamAV signature scan + optional YARA rules'], ['Network packet analysis', 'Wireshark / TShark with optional Suricata IDS alerts'], ['SIEM export', 'Optional Splunk HTTP Event Collector summaries']].map(([title, detail]) => (
                <div key={title} className="flex items-start gap-3 rounded-xl border border-border bg-white/5 p-3">
                  <ShieldAlert size={17} className="mt-0.5 text-primary shrink-0" />
                  <div><div className="text-sm font-bold">{title}</div><div className="text-xs text-text-dim mt-1">{detail}</div></div>
                  <span className="ml-auto text-[10px] whitespace-nowrap text-amber-200">Check sensor</span>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveScreen('antivirus')} className="w-full py-3 bg-primary rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity">Open Antivirus & File Scan</button>
            <button onClick={() => setActiveScreen('network')} className="w-full py-3 bg-surface border border-border rounded-xl text-sm font-bold hover:bg-white/5 transition-colors">Open Network Diagnostics</button>
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
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Password Leaks</span>
            <span className="text-xs text-success font-bold">✓ Safe</span>
          </div>
          <div className="text-4xl font-bold">{breaches.length.toString().padStart(2, '0')}</div>
          <div className="text-xs text-text-dim">Leaks detected in last 30 days</div>
        </div>
        
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">AI Phishing Filter</span>
            <span className="text-xs text-primary font-bold">Active</span>
          </div>
          <div className="text-4xl font-bold">99.4%</div>
          <div className="text-xs text-text-dim">Detection accuracy active</div>
        </div>

        <div className="glass-card p-6 space-y-4 border-accent/30 bg-accent/5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Key Features</span>
            <button className="bg-accent text-bg px-2 py-0.5 rounded text-[10px] font-black">PRO</button>
          </div>
          <div className="text-4xl font-bold">9</div>
          <div className="text-xs text-text-dim">Powerful capabilities</div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Browser security context</span>
            <span className="text-xs text-accent font-bold">Limited visibility</span>
          </div>
          <div className="text-2xl font-bold">Web session</div>
          <div className="text-xs text-text-dim">A browser cannot inspect the full operating system or certify that this device is malware-free. Use Antivirus & File Scan for file reputation checks.</div>
          <button onClick={() => setActiveScreen('antivirus')} className="text-xs text-primary underline">Open Antivirus & File Scan</button>
        </div>

        <div className="glass-card p-6 space-y-4 md:col-span-2 lg:col-span-1 border border-accent/20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold flex items-center gap-2"><Zap size={16} className="text-accent" /> Remediation Centre</span>
            <button onClick={() => setActiveScreen('tasks')} className="bg-accent/20 text-accent px-3 py-1 text-xs font-bold rounded-lg hover:bg-accent/30 transition-colors">View actions</button>
          </div>
          <div className="text-2xl font-bold">Review findings</div>
          <div className="text-xs text-text-dim">CyberAmour will not claim to clear junk files or free device memory from a browser. Review findings and follow verified remediation steps.</div>
        </div>
      </div>
      <AnimatePresence>
        {showComplianceInfo && <ComplianceInfoModal onClose={() => setShowComplianceInfo(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function ScanCenter({ performScan, checkBreaches, logActivity, setActiveScreen, profile, activeLinkSource, setActiveLinkSource, setShowLinkModal, linkages, askAI, scans, rewardUserWithScan }: any) {
  const [scanType, setScanType] = useState<'phishing' | 'email' | 'sms' | 'phone' | 'name' | 'company' | 'username' | 'domain' | 'url' | 'training' | 'file' | 'antivirus'>('phishing');
  const [input, setInput] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentPhases, setCurrentPhases] = useState<string[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [draftResult, setDraftResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [filterVerdict, setFilterVerdict] = useState<string>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  
  const cancelRef = useRef<boolean>(false);
  
  // Advanced Search State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advNameVariations, setAdvNameVariations] = useState('');
  const [advAssociatedCompanies, setAdvAssociatedCompanies] = useState('');
  const [advDigitalInconsistencies, setAdvDigitalInconsistencies] = useState('');
  const [advOtherKeywords, setAdvOtherKeywords] = useState('');

  const [isAdLoading, setIsAdLoading] = useState(false);

  const handleWatchAd = async (type: 'phone' | 'forensics') => {
    setIsAdLoading(true);
    try {
      const { BillingService, AD_UNITS } = await import('./utils/billing');
      const success = await BillingService.showRewardedAd(AD_UNITS.REWARDED_SCAN);
      if (success) {
        await rewardUserWithScan(type);
      }
    } catch (e) {
       console.error("Rewarded-ad integration unavailable", e);
       window.alert('Rewarded ads are not configured in this web build. No scan credit was added.');
    } finally {
      setIsAdLoading(false);
    }
  };

  const { isValidFormat, formatError } = React.useMemo(() => {
    if (!input) return { isValidFormat: true, formatError: '' };

    if (scanType === 'url') {
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]{1,5})?(\/.*)?$/;
      const valid = urlPattern.test(input.trim());
      return { isValidFormat: valid, formatError: valid ? '' : 'Invalid URL format' };
    }

    const items = input.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return { isValidFormat: true, formatError: '' };

    if (scanType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const valid = items.every(e => emailRegex.test(e));
      return { isValidFormat: valid, formatError: valid ? '' : 'Please enter a valid email address' };
    }
    if (scanType === 'phone') {
      const valid = items.every(p => /^\+?[0-9\s\-\(\)]+$/.test(p) && p.replace(/[^0-9]/g, '').length >= 7);
      return { isValidFormat: valid, formatError: valid ? '' : 'Invalid phone number format' };
    }
    if (scanType === 'domain') {
      const valid = items.every(d => /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(d));
      return { isValidFormat: valid, formatError: valid ? '' : 'Invalid domain format' };
    }
    return { isValidFormat: true, formatError: '' };
  }, [input, scanType]);

  const isSubscriber = !!profile?.subscriptionTier && profile?.subscriptionTier !== 'free';
  
  const isOutOfCyberForensicsScans = !isSubscriber && (profile?.forensicsScansLeft ?? 5) <= 0;
  const isOutOfPhoneScans = !isSubscriber && (profile?.phoneScansLeft ?? 3) <= 0;
  
  const outOfFreeScans = (scanType === 'phone' && isOutOfPhoneScans) || (scanType !== 'phone' && isOutOfCyberForensicsScans);

  if (outOfFreeScans) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Search size={48} className="text-primary/40" />
        </div>
        <h2 className="text-2xl font-bold">Free Scan Limit Reached</h2>
        <p className="text-text-dim max-w-md mx-auto leading-relaxed">
          {scanType === 'phone' 
            ? "You've used your 3 free Phone Scans. Upgrade to a subscription-based membership or watch an ad to earn more scans." 
            : "You've used your 5 free Cyber Forensics scans. Upgrade to a subscription-based membership or watch an ad to earn more scans."}
        </p>
        <div className="flex gap-4 items-center justify-center flex-wrap">
          <button 
            onClick={() => setActiveScreen('pricing')}
            className="px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            View Plans
          </button>
          <button 
            onClick={() => handleWatchAd(scanType === 'phone' ? 'phone' : 'forensics')}
            disabled={isAdLoading}
            className="px-8 py-4 bg-surface border border-border text-text-main font-bold rounded-2xl hover:bg-white/5 transition-all flex items-center gap-2 group disabled:opacity-50"
          >
            {isAdLoading ? <Activity size={18} className="animate-spin text-accent" /> : <Play size={18} className="text-accent group-hover:scale-110 transition-transform" />}
            {isAdLoading ? 'Loading Ad...' : 'Watch Ad (+1 Scan)'}
          </button>
        </div>
      </div>
    );
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (overrideType?: any, overrideInput?: string) => {
    const isStringOverride = typeof overrideType === 'string';
    const finalType = isStringOverride ? overrideType : scanType;
    const finalInput = isStringOverride ? overrideInput || input : input;
    if (!finalInput && finalType !== 'file' && finalType !== 'antivirus') return;
    if (finalType === 'file' && !imageFile) return;
    
    if ((finalType === 'url' || finalType === 'email') && !isValidFormat) return;
    
    if (isStringOverride && overrideInput) {
      setScanType(overrideType as any);
      setInput(overrideInput);
    }
    
    setRecentSearches(prev => {
      const target = finalType === 'file' ? imageFile?.name || 'File Upload' : finalType === 'antivirus' ? 'Device Scan' : finalInput;
      const updated = [target, ...prev.filter(s => s !== target)].slice(0, 5);
      return updated;
    });
    
    playScanSound();
    cancelRef.current = false;
    setScanning(true);
    setScanProgress(0);
    setResult(null);
    setDraftResult(null);
    setScanError(null);
    const logInputName = finalType === 'file' ? imageFile?.name || 'file' : finalType === 'antivirus' ? 'device' : finalInput.substring(0, 10);
    logActivity('scan_started', { type: finalType, input: logInputName + '...', urgency });
    
    const scanPhases = {
      phishing: ["Preparing supplied content...", "Querying configured live sources...", "Reviewing returned evidence...", "Preparing report..."],
      email: ["Validating input...", "Querying configured live sources...", "Reviewing source evidence...", "Preparing report..."],
      sms: ["Reviewing supplied message...", "Checking supported reputation sources...", "Preparing evidence-based report..."],
      phone: ["Validating phone-number format...", "Querying configured public-source services...", "Preparing report..."],
      name: ["Preparing authorized public-source query...", "Searching configured sources...", "Validating returned references...", "Preparing report..."],
      company: ["Preparing organization query...", "Searching configured public sources...", "Reviewing evidence...", "Preparing report..."],
      username: ["Preparing public username query...", "Searching configured sources...", "Validating references...", "Preparing report..."],
      domain: ["Validating domain...", "Querying configured reputation providers...", "Reviewing returned indicators...", "Preparing report..."],
      url: ["Validating URL...", "Querying configured reputation providers...", "Reviewing returned indicators...", "Preparing report..."],
      antivirus: ["Preparing file reputation check...", "Checking configured hash reputation provider...", "Preparing report..."],
      default: ["Preparing request...", "Querying configured services...", "Reviewing returned evidence...", "Preparing report..."]
    };
    const phaseList = scanPhases[finalType as keyof typeof scanPhases] || scanPhases.default;
    setCurrentPhases(phaseList);
    setCurrentPhaseIndex(0);

    setScanProgress(0);
    setCurrentPhaseIndex(0);

    try {
      let res;
      let finalResults: any = [];
      let hasThreat = false;
      const isSearchType = finalType === 'email' || finalType === 'phone' || finalType === 'name' || finalType === 'company' || finalType === 'username' || finalType === 'domain';
      const inputs = finalInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

      const getAdvancedInput = (inp: string) => {
        let advancedInputStr = inp;
        if (isSearchType) {
          const parts = [];
          if (countryFilter || cityFilter) parts.push(`Location: ${cityFilter}${cityFilter && countryFilter ? ', ' : ''}${countryFilter}`);
          if (showAdvancedFilters) {
            if (advNameVariations) parts.push(`Name Variations/Aliases: ${advNameVariations}`);
            if (advAssociatedCompanies) parts.push(`Associated Companies: ${advAssociatedCompanies}`);
            if (advDigitalInconsistencies) parts.push(`Known Inconsistencies: ${advDigitalInconsistencies}`);
            if (advOtherKeywords) parts.push(`Other Keywords: ${advOtherKeywords}`);
          }
          if (parts.length > 0) {
            advancedInputStr = `${inp} (Additional Search context: ${parts.join(' | ')})`;
          }
        }
        return advancedInputStr;
      };

      let fileData: any = undefined;
      if (finalType === 'file' && imageFile) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(imageFile);
        });
        fileData = { mimeType: imageFile.type || 'application/octet-stream', data: base64Data, name: imageFile.name };
      }

      if (isSearchType && inputs.length > 1) {
        const nestedResults = await Promise.all(inputs.map(async (inp) => {
          if (cancelRef.current) throw new Error('SCAN_CANCELLED');
          const advInput = getAdvancedInput(inp);
          const individualRes = await performScan(finalType, advInput);
          if (cancelRef.current) throw new Error('SCAN_CANCELLED');
          const currentRes = [{ type: finalType, input: inp, ...individualRes }];
          
          if (finalType === 'email' && checkBreaches) {
            const breaches = await checkBreaches(inp);
            if (breaches) {
              currentRes.push({ type: 'breach', input: inp, found: breaches });
            }
          }
          return currentRes;
        }));
        
        finalResults = nestedResults.flat();
        hasThreat = finalResults.some((r: any) => r.verdict === 'Suspicious' || r.verdict === 'Malicious' || (r.leakages && r.leakages.length > 0) || (r.type === 'breach' && r.found?.length > 0));
      } else {
        const advancedInput = getAdvancedInput(finalInput);
        const nameToUse = finalType === 'file' ? (imageFile?.name || 'file') : finalType === 'antivirus' ? 'Mobile Device' : advancedInput;
        const resInputToUse = finalType === 'file' ? (imageFile?.name || 'file') : finalType === 'antivirus' ? 'Scan Device' : finalInput;
        res = await performScan(finalType, nameToUse, fileData);
        if (cancelRef.current) throw new Error('SCAN_CANCELLED');
        finalResults = [{ type: finalType, input: resInputToUse, ...res }];
        
        hasThreat = finalResults.some((r: any) => r.verdict === 'Suspicious' || r.verdict === 'Malicious' || (r.leakages && r.leakages.length > 0) || (r.type === 'breach' && r.found?.length > 0));
      }
      
      setScanProgress(100);
      setCurrentPhaseIndex(Math.max(0, phaseList.length - 1));
      
      // small delay to show 100% just in case
      setTimeout(() => {
        setDraftResult({ finalResults, hasThreat });
      }, 300);
    } catch (e: any) {
      if (e.message === 'SCAN_CANCELLED') {
        console.log('Scan cancelled by user.');
        setResult(null);
        setDraftResult(null);
        return;
      }
      console.error('Scan Center operation failed; no automated result should be inferred', e);
      const identityTypes = ['email', 'phone', 'name', 'company', 'username', 'domain'];
      if (identityTypes.includes(finalType) && finalInput.trim()) {
        // No-Blaze fallback: provide search portals without claiming that they were queried.
        const target = finalInput.trim();
        const exact = `"${target}"`;
        const q = encodeURIComponent(exact);
        const general = encodeURIComponent(target);
        const sources: Array<{ title: string; url: string }> = [
          { title: `Google exact-phrase search for ${target}`, url: `https://www.google.com/search?q=${q}` },
          { title: `Bing exact-phrase search for ${target}`, url: `https://www.bing.com/search?q=${q}` },
          { title: `DuckDuckGo exact-phrase search for ${target}`, url: `https://duckduckgo.com/?q=${q}` },
        ];
        if (finalType === 'phone') {
          sources.push(
            { title: 'Truecaller public phone lookup', url: `https://www.truecaller.com/search/${general}` },
            { title: 'Tellows caller reports', url: `https://www.tellows.com/num/${general}` },
            { title: 'WhoCallsMe public caller reports', url: `https://whocallsme.com/Phone-Number.aspx/${general}` },
          );
        } else if (finalType === 'email') {
          sources.push(
            { title: 'Have I Been Pwned (enter address on official site)', url: 'https://haveibeenpwned.com/' },
            { title: 'Google indexed email search', url: `https://www.google.com/search?q=${encodeURIComponent(`"${target}" (breach OR leaked OR exposed OR scam)`)}` },
          );
        } else if (finalType === 'name') {
          sources.push(
            { title: 'Google public records and news search', url: `https://www.google.com/search?q=${encodeURIComponent(`"${target}" (official OR registry OR court OR news)`)}` },
            { title: 'LinkedIn public profile search', url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${target}"`)}` },
          );
        } else if (finalType === 'company' || finalType === 'domain') {
          sources.push(
            { title: 'Official-source search', url: `https://www.google.com/search?q=${encodeURIComponent(`"${target}" (official OR registry OR security advisory OR breach)`)}` },
            { title: 'CISA known exploited vulnerabilities catalog', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
          );
        } else if (finalType === 'username') {
          sources.push({ title: 'WhatsMyName web search project', url: 'https://whatsmyname.app/' });
        }
        setScanError(null);
        setResult([{
          type: finalType,
          input: target,
          verdict: 'Manual review required',
          riskScore: null,
          analysis: `Automated OSINT service was unavailable (${e?.message || 'service error'}). CyberAmour has provided public search links only. These links have not been searched by CyberAmour and are not findings. Open the sources, verify the exact identifier and context, and record evidence manually. No identity or risk conclusion can be made from this fallback alone.`,
          sources,
          sourceMode: 'manual-search-links',
          collectedAt: new Date().toISOString(),
          redFlags: [],
        }]);
      } else {
        setScanError(e?.message || 'The scan failed. No result was produced. Check service configuration and try again.');
      }
      playErrorSound();
    } finally {
      if (!cancelRef.current) {
        setTimeout(() => {
          setScanning(false);
        }, 300);
      } else {
        setScanning(false);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Cyber Forensics (Scan Center)</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-dim">Run supported checks, review available evidence, and document findings. Live analysis depends on configured services.</p>
          {!isSubscriber && (
            <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(139,92,246,0.2)]">
              {profile?.forensicsScansLeft || 0} free scans remaining
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface/30 p-4 text-sm text-text-dim">
        <div className="font-semibold text-text-main">One scan workspace</div>
        Choose a scan type below and run it here. Results and recent searches stay in this workspace to avoid duplicate scan panels. Investigations cover supplied content, configured providers, and public or authorized sources only; this web app does not monitor every online activity or private account.
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-widest pl-2">Security & Threat Analysis</h3>
          <div className="flex flex-wrap gap-3 p-2 bg-surface/30 rounded-3xl border border-border">
            {([
              { id: 'phishing', label: 'Phishing Analysis (Email/Text)' },
              { id: 'sms', label: 'SMS Smishing Analysis' },
              { id: 'file', label: 'File Analysis (AI-assisted)' }
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => { setScanType(t.id as any); setInput(''); setResult(null); setImagePreview(null); setImageFile(null); }}
                className={cn(
                  "px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border",
                  scanType === t.id 
                    ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)] shadow-primary/20 scale-105" 
                    : "bg-surface border-border text-text-dim hover:text-text-main hover:border-text-dim/30 hover:bg-surface/80"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-widest pl-2">Investigating By Identity</h3>
          <div className="flex flex-wrap gap-3 p-2 bg-surface/30 rounded-3xl border border-border">
            {([
              { id: 'email', label: 'Email Leaks' },
              { id: 'phone', label: 'Phone' },
              { id: 'name', label: 'Name' },
              { id: 'company', label: 'Company' },
              { id: 'username', label: 'Username' },
              { id: 'domain', label: 'Domain' }
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => { setScanType(t.id as any); setInput(''); setResult(null); setImagePreview(null); setImageFile(null); }}
                className={cn(
                  "px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border",
                  scanType === t.id 
                    ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.3)] shadow-[#3B82F6]/20 scale-105" 
                    : "bg-surface border-border text-text-dim hover:text-text-main hover:border-text-dim/30 hover:bg-surface/80"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="px-3 pt-2 text-xs text-text-dim">Choose an identity type, enter the exact identifier, then select <strong>Search intel</strong>. If the automated service is unavailable, CyberAmour will provide public search links for manual verification instead of inventing findings.</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-widest pl-2">Education & Training</h3>
          <div className="flex flex-wrap gap-3 p-2 bg-surface/30 rounded-3xl border border-border">
            <button
              onClick={() => { setScanType('training' as any); setInput(''); setResult(null); setImagePreview(null); setImageFile(null); }}
              className={cn(
                "px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border",
                scanType === 'training'
                  ? "bg-[#10B981] text-white border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)] shadow-[#10B981]/20 scale-105"
                  : "bg-surface border-border text-text-dim hover:text-text-main hover:border-text-dim/30 hover:bg-surface/80"
              )}
            >
              Interactive Phishing Training
            </button>
          </div>
        </div>
      </div>

      {scanType === 'training' ? (
        <PhishingTrainingModule onClose={() => setScanType('phishing')} logActivity={logActivity} />
      ) : (
        <>
          <div className="space-y-4">
            {scanType === 'file' ? (
               <div className="w-full bg-surface/50 border border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => fileInputRef.current?.click()}>
                 <FileText size={48} className="text-primary mb-4" />
                 <div className="text-sm font-bold text-text-main mb-1">
                   Upload File for Malware Scan
                 </div>
                 <div className="text-xs text-text-dim">Supports executables, documents, archives</div>
                 {imageFile && <div className="mt-4 text-primary text-sm font-bold">{imageFile.name}</div>}
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   onChange={(e) => {
                     const f = e.target.files?.[0];
                     if (f) {
                        setImageFile(f);
                        setInput('File: ' + f.name); // To pass the validation if needed, or simply for visual completeness in some states
                     }
                   }}
                 />
               </div>
            ) : scanType === 'antivirus' ? (
               <div className="w-full bg-surface/50 border border-border rounded-2xl p-8 text-center">
                 <ShieldAlert size={40} className="text-primary mx-auto mb-4" />
                 <div className="text-lg font-bold text-text-main mb-2">Full-device scanning is not available in a browser</div>
                 <div className="text-sm text-text-dim max-w-xl mx-auto mb-4">Use the dedicated Antivirus & File Scan page for local SHA-256 calculation and a configured live reputation lookup. This web app cannot inspect the complete file system or running processes.</div>
                 <button onClick={() => setActiveScreen('antivirus')} className="px-4 py-2 rounded-xl bg-primary text-white font-bold">Open Antivirus & File Scan</button>
               </div>
            ) : (
                <>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim">
                  {scanType === 'phishing' && <ShieldAlert size={18} />}
                  {scanType === 'email' && <Search size={18} />}
                  {scanType === 'sms' && <MessageCircle size={18} />}
                  {scanType === 'url' && <LinkIcon size={18} />}
                  {(scanType === 'phone' || scanType === 'name' || scanType === 'username') && <UserIcon size={18} />}
                  {scanType === 'company' && <Activity size={18} />}
                  {scanType === 'domain' && <Globe size={18} />}
                </div>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && isValidFormat && input && handleScan()}
                  placeholder={scanType === 'phishing' ? "Paste suspicious email content..." : scanType === 'url' ? "Paste suspicious URL to analyze for phishing & malware..." : scanType === 'email' ? "Enter emails to check leaks & public records (comma-separated)..." : scanType === 'phone' ? "Enter phone numbers (comma-separated)..." : scanType === 'name' ? "Enter full names (comma-separated)..." : scanType === 'company' ? "Enter company names (comma-separated)..." : scanType === 'username' ? "Enter usernames (comma-separated)..." : scanType === 'domain' ? "Enter domain names (comma-separated)..." : "Paste SMS content..."}
                  className={cn("w-full bg-surface/50 border rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none transition-colors", input && (scanType === 'url' || scanType === 'email') ? (isValidFormat ? "border-success focus:border-success" : "border-danger focus:border-danger text-danger") : (!isValidFormat && input ? "border-danger focus:border-danger text-danger" : "border-border focus:border-primary"))}
                />
                {input && (scanType === 'url' || scanType === 'email') && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {isValidFormat ? <CheckCircle2 size={18} className="text-success" /> : <AlertTriangle size={18} className="text-danger" />}
                  </div>
                )}
              </div>
              {!isValidFormat && input && (
                <p className="text-xs text-danger -mt-2 ml-4">{formatError}</p>
              )}
              </>
            )}
        
        {scanType !== 'phishing' && scanType !== 'sms' && scanType !== 'url' && scanType !== 'file' && scanType !== 'antivirus' && (
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between pl-2 pr-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00E5FF]">Advanced Search Filters</span>
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-xs text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors uppercase tracking-widest flex items-center gap-1 font-bold"
              >
                {showAdvancedFilters ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                <ChevronDown size={14} className={cn("transition-transform", showAdvancedFilters && "rotate-180")} />
              </button>
            </div>
            
            {(showAdvancedFilters || countryFilter || cityFilter) && (
              <div className="bg-surface/30 p-4 rounded-2xl border border-border space-y-4 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      placeholder="Country (Optional)"
                      className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      placeholder="City (Optional)"
                      className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                
                {showAdvancedFilters && (
                  <div className="space-y-4 pt-2 border-t border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={advNameVariations}
                          onChange={(e) => setAdvNameVariations(e.target.value)}
                          placeholder="Name Variations / Aliases (e.g. John Doe, J. Doe)"
                          className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={advAssociatedCompanies}
                          onChange={(e) => setAdvAssociatedCompanies(e.target.value)}
                          placeholder="Associated Companies (e.g. Acme Corp, Globex)"
                          className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={advDigitalInconsistencies}
                          onChange={(e) => setAdvDigitalInconsistencies(e.target.value)}
                          placeholder="Known Digital Inconsistencies (e.g. duplicate LinkedIn profiles)"
                          className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={advOtherKeywords}
                          onChange={(e) => setAdvOtherKeywords(e.target.value)}
                          placeholder="Other Keywords or Context (e.g. crypto scammer, fraud, marriage scandal)"
                          className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 bg-surface/30 p-2 rounded-2xl border border-border">
          <span className="text-xs text-text-dim uppercase tracking-widest px-2 font-bold whitespace-nowrap">Scan Priority:</span>
          <div className="flex w-full gap-2 overflow-x-auto no-scrollbar">
            {([
              { id: 'Low', label: 'Low', icon: <Clock size={14} />, color: 'text-success hover:bg-success/10 border-success/30' },
              { id: 'Medium', label: 'Medium', icon: <Activity size={14} />, color: 'text-accent hover:bg-accent/10 border-accent/30' },
              { id: 'High', label: 'High', icon: <AlertTriangle size={14} />, color: 'text-danger hover:bg-danger/10 border-danger/30' }
            ] as const).map((u) => (
              <button
                key={u.id}
                onClick={() => setUrgency(u.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all border",
                  urgency === u.id ? `bg-surface shadow-[0_0_10px_rgba(255,255,255,0.05)] ${u.color}` : "border-transparent text-text-dim hover:text-text-main"
                )}
              >
                {u.icon}
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {scanning ? (
            <button 
              onClick={() => {
                cancelRef.current = true;
                setScanning(false);
                setResult(null);
                setScanProgress(0);
              }}
              className="flex-1 py-4 bg-danger/20 border border-danger disabled:opacity-50 text-danger hover:bg-danger hover:text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <XCircle size={20} /> Stop Scan
            </button>
          ) : (
            <button 
              onClick={() => handleScan()}
              disabled={(!isValidFormat && scanType !== 'file' && scanType !== 'antivirus') || (!input && scanType !== 'file' && scanType !== 'antivirus') || (scanType === 'file' && !imageFile)}
              className="flex-1 py-4 cyber-gradient disabled:opacity-50 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 relative overflow-hidden transition-all hover:scale-[1.02]"
            >
              <div className="relative z-10 flex items-center gap-2">
                <Scan size={20} />
                {scanType === 'url' ? "Check URL reputation" : scanType === 'antivirus' ? "Open Antivirus & File Scan" : scanType === 'phishing' ? "Analyze Content" : scanType === 'file' ? "Analyze Uploaded File" : "Search intel"}
              </div>
            </button>
          )}
          <button
            onClick={() => { setInput(''); setCountryFilter(''); setCityFilter(''); setResult(null); setImagePreview(null); setImageFile(null); setRecentSearches([]); logActivity('cleared_scan_cache'); }}
            disabled={scanning || (!input && !result && !imageFile && recentSearches.length === 0)}
            className="px-6 py-4 bg-surface border border-border disabled:opacity-50 text-text-main font-bold rounded-[20px] hover:bg-white/5 transition-colors"
          >
            Clear form & recent searches
          </button>
        </div>
        
        {recentSearches.length > 0 && !scanning && !result && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Recent Searches</h4>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(search)}
                  className="px-3 py-1.5 bg-surface border border-border text-xs rounded-lg hover:border-primary transition-colors text-text-dim hover:text-text-main flex items-center gap-1.5"
                >
                  <Clock size={12} />
                  {search.length > 30 ? search.substring(0, 30) + '...' : search}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {scanning && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 flex flex-col justify-center gap-6"
        >
          <div className="flex justify-between items-end mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <Search size={18} className="text-[#00E5FF]" />
                </motion.div>
                {scanType === 'url' ? 'Scanning URL & Verifying Reputation' : 
                 scanType === 'antivirus' ? 'Device-wide scanning is not available in a browser' :
                 scanType === 'file' ? 'Analyzing File Hash & Structure' : 
                 scanType === 'phishing' ? 'Evaluating Phishing Threat' : 
                 scanType === 'sms' ? 'Detecting Smishing Patterns' :
                 'Reviewing available identity evidence'}
                <span className="text-[#00E5FF] ml-2 text-xl">Waiting for provider response…</span>
              </h3>
            </div>
          </div>
          
          <div className="flex w-full gap-2 h-3 rounded-full overflow-hidden mb-2 relative bg-surface border border-border">
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary via-[#00E5FF] to-[#34D399] shadow-[0_0_15px_rgba(0,229,255,0.6)]"
              initial={{ width: "0%" }}
              animate={{ width: "35%" }}
              transition={{ ease: "easeInOut", duration: 0.2 }}
            />
          </div>

          <div className="space-y-0 mt-8 relative before:absolute before:inset-0 before:left-8 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
            {currentPhases.map((phase, idx) => {
               const isActive = currentPhaseIndex === idx;
               const isCompleted = currentPhaseIndex > idx;
               return (
                  <div key={idx} className={cn(
                    "relative flex items-center gap-6 transition-all duration-500 py-4",
                    isCompleted ? "opacity-100" : isActive ? "opacity-100 scale-[1.02] origin-left" : "opacity-40 grayscale"
                  )}>
                    {/* Indicator Dot/Icon */}
                    <div className={cn(
                      "relative left-4 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 shadow-xl z-10 box-content outline outline-4 outline-bg",
                      isCompleted ? "bg-success text-bg ring-2 ring-success/50" : isActive ? "bg-[#00E5FF] text-bg ring-4 ring-[#00E5FF]/30 shadow-[0_0_20px_rgba(0,229,255,0.7)]" : "bg-surface border-2 border-border text-text-dim"
                    )}>
                      {isCompleted ? (
                        <Check size={16} strokeWidth={3} />
                      ) : isActive ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                          <Loader size={16} strokeWidth={3} />
                        </motion.div>
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    {/* Connecting line fill (active state) */}
                    {isCompleted && idx < currentPhases.length - 1 && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        className="absolute left-8 top-12 w-[2px] bg-gradient-to-b from-success to-[#00E5FF] z-0"
                      />
                    )}
                    
                    <div className={cn(
                      "flex-1 p-4 ml-6 rounded-xl border transition-all duration-300",
                      isCompleted ? "bg-success/5 border-success/30" : isActive ? "bg-[#00E5FF]/10 border-[#00E5FF]/50 shadow-[0_0_15px_rgba(0,229,255,0.15)]" : "bg-transparent border-transparent"
                    )}>
                      <div className="flex justify-between items-center">
                        <span className={cn(
                          "text-sm font-bold transition-colors duration-300 tracking-wide",
                          isCompleted ? "text-success" : isActive ? "text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" : "text-text-dim"
                        )}>
                          {phase}
                        </span>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[10px] bg-[#00E5FF] text-bg rounded-full uppercase font-black tracking-widest px-2 py-0.5"
                          >
                            In Progress
                          </motion.div>
                        )}
                        {isCompleted && (
                           <span className="text-[10px] text-success uppercase font-black tracking-widest px-2 py-0.5">
                             Done
                           </span>
                        )}
                      </div>
                      
                      {isActive && (
                        <div className="mt-3 w-full bg-surface rounded-full h-1.5 overflow-hidden">
                          <motion.div 
                            className="bg-[#00E5FF] h-full shadow-[0_0_10px_rgba(0,229,255,0.8)]"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
               )
            })}
          </div>
        </motion.div>
      )}

      {scanError && !scanning && (
        <div role="alert" className="glass-card p-5 border border-danger/40 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-danger font-bold"><AlertTriangle size={18} /> Scan did not complete</div>
          <p className="text-sm text-text-main">{scanError}</p>
          <p className="text-xs text-text-dim">No clean result is implied by this failure. Correct the configuration or permissions and retry.</p>
          <button onClick={() => setScanError(null)} className="text-xs underline text-text-dim">Dismiss</button>
        </div>
      )}

      {draftResult && !scanning && !result && (
        <ScanDraftViewer 
          draftResult={draftResult} 
          setDraftResult={setDraftResult} 
          askAI={askAI} 
          onFinalize={() => {
             setResult(draftResult.finalResults);
             setDraftResult(null);
          }} 
        />
      )}

      {result && !scanning && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4 flex-col sm:flex-row gap-4">
            <h3 className="text-xl font-bold">Investigation Results</h3>
            {Array.isArray(result) && result.length > 1 && (
              <div className="flex bg-surface/50 p-1 rounded-xl border border-border overflow-x-auto w-full sm:w-auto">
                {['All', 'Safe', 'Suspicious', 'Malicious', 'Breaches'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilterVerdict(f)}
                    className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", filterVerdict === f ? "bg-primary text-white" : "text-text-dim hover:text-text-main")}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {(Array.isArray(result) ? result : [result]).filter((resItem: any) => {
             if (filterVerdict === 'All') return true;
             if (filterVerdict === 'Breaches') return resItem.type === 'breach' && resItem.found?.length > 0;
             return resItem.verdict === filterVerdict || (filterVerdict === 'Safe' && resItem.verdict === 'Clean') || (filterVerdict === 'Clean' && resItem.verdict === 'Safe');
          }).map((resItem: any, index: number) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "glass-card p-6 border-l-4 mb-4",
            resItem.verdict === 'Safe' || resItem.verdict === 'Clean' || (resItem.type === 'breach' && resItem.found?.length === 0) ? "border-l-success" : resItem.verdict === 'Suspicious' ? "border-l-[#F59E0B]" : "border-l-danger"
          )}
        >
          {Array.isArray(result) && <h3 className="font-bold text-lg mb-4 opacity-80 border-b border-border pb-2">Results for: {resItem.input || 'Unknown'}</h3>}
          <div className="flex items-start gap-4 flex-col md:flex-row">
            <div className={cn(
              "p-3 rounded-2xl flex-shrink-0",
              resItem.verdict === 'Safe' || resItem.verdict === 'Clean' || (resItem.type === 'breach' && resItem.found?.length === 0) ? "bg-success/10 text-success" : resItem.verdict === 'Suspicious' ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-danger/10 text-danger"
            )}>
              {resItem.verdict === 'Safe' || resItem.verdict === 'Clean' || (resItem.type === 'breach' && resItem.found?.length === 0) ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div className="space-y-2 flex-grow w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h4 className="font-bold text-xl uppercase tracking-wider">
                  {resItem.type === 'breach' ? (resItem.found?.length > 0 ? "Breaches Found!" : "No Breaches Found") : resItem.verdict}
                </h4>
                {resItem.riskScore !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest text-text-dim">Risk Score</span>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-bold text-white",
                      resItem.riskScore < 30 ? "bg-success" : resItem.riskScore < 70 ? "bg-[#F59E0B]" : "bg-danger"
                    )}>
                      {typeof resItem.riskScore === 'number' ? `${resItem.riskScore}/100` : 'Not scored'}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-text-main leading-relaxed">
                {resItem.type === 'breach' 
                  ? (resItem.found?.length > 0 ? `Your email was exposed in ${resItem.found.length} breaches. Change your passwords immediately.` : "Your email is currently safe from known breaches.")
                  : (resItem.analysis || resItem.reason || 'No analysis narrative was returned. Treat this result as insufficient evidence.')}
              </p>
              {Array.isArray(resItem.sources) && resItem.sources.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-surface/40 p-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-3">{resItem.sourceMode === 'manual-search-links' ? 'Public search links (not yet searched)' : 'Evidence sources returned by provider'}</h5>
                  <ul className="space-y-2">
                    {resItem.sources.map((source: any, sourceIndex: number) => {
                      const url = typeof source === 'string' ? source : source.url || source.uri || source.link;
                      const title = typeof source === 'string' ? source : source.title || source.name || url || 'Source';
                      return <li key={sourceIndex} className="text-sm">{url && /^https?:\/\//i.test(url) ? <a href={url} target="_blank" rel="noreferrer" className="text-[#00E5FF] underline break-all">{title}</a> : <span className="text-text-main">{title}</span>}</li>;
                    })}
                  </ul>
                </div>
              )}
              {resItem.collectedAt && <p className="text-[11px] text-text-dim mt-2">Collected: {new Date(resItem.collectedAt).toLocaleString()} · A search result is not a direct scan of the target.</p>}
              
              {resItem.type !== 'breach' && resItem.redFlags && resItem.redFlags.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-sm font-bold text-[#F59E0B] flex items-center gap-2 mb-4 uppercase tracking-wider">
                    <AlertTriangle size={16} /> Threat Detailed Breakdown
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                    {resItem.redFlags.map((flag: any, i: number) => (
                      <div key={i} className="bg-[#F59E0B]/5 border border-[#F59E0B]/30 p-4 rounded-xl flex flex-col gap-2">
                        <div className="font-semibold text-text-main flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                          {flag.indicator}
                        </div>
                        <div className="text-xs text-text-dim leading-relaxed bg-[#0F172A]/50 p-2 rounded-lg border border-border/50">
                          {flag.advice}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {scanType === 'phone' && resItem.type !== 'breach' && (resItem.scamReports || resItem.maliciousAssociations || resItem.carrier || resItem.lineType) && (
                <div className="mt-4 p-4 border border-danger/20 bg-danger/5 rounded-xl space-y-4">
                   <h5 className="text-sm font-bold text-danger flex items-center gap-2 uppercase tracking-wider">
                      <ShieldAlert size={16} /> Phone Security & Identity Analysis
                   </h5>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                      {(resItem.carrier) && (
                        <div className="space-y-1">
                           <div className="text-xs text-text-dim uppercase tracking-wider font-bold">Carrier</div>
                           <div className="text-text-main">{resItem.carrier}</div>
                        </div>
                      )}
                      {(resItem.lineType) && (
                        <div className="space-y-1">
                           <div className="text-xs text-text-dim uppercase tracking-wider font-bold">Line Type</div>
                           <div className="text-text-main">{resItem.lineType}</div>
                        </div>
                      )}
                      {(resItem.scamReports) && (
                        <div className="space-y-1 col-span-1 md:col-span-2">
                           <div className="text-xs text-danger uppercase tracking-wider font-bold animate-pulse">⚠️ Scam Reports / Robocalls Detected</div>
                           <div className="text-danger font-semibold bg-danger/10 border border-danger/20 p-2 rounded">{resItem.scamReports}</div>
                        </div>
                      )}
                      {(resItem.maliciousAssociations) && (
                        <div className="space-y-1 col-span-1 md:col-span-2">
                           <div className="text-xs text-danger uppercase tracking-wider font-bold animate-pulse">⚠️ Malicious Associations Detected</div>
                           <div className="text-danger font-semibold bg-danger/10 border border-danger/20 p-2 rounded">{resItem.maliciousAssociations}</div>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {scanType === 'url' && resItem.type !== 'breach' && (
                <div className="mt-4 p-4 border border-[#3B82F6]/30 bg-[#3B82F6]/5 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] space-y-4">
                   <h5 className="text-sm font-bold text-[#3B82F6] flex items-center gap-2 uppercase tracking-wider">
                      <LinkIcon size={16} /> URL In-Depth Analysis
                   </h5>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                      {(resItem.domainReputation) && (
                        <div className="space-y-1 bg-surface border border-border p-3 rounded-lg">
                           <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold mb-1">Domain Reputation</div>
                           <div className="text-text-main font-medium">{resItem.domainReputation}</div>
                        </div>
                      )}
                      {(resItem.sslStatus) && (
                        <div className="space-y-1 bg-surface border border-border p-3 rounded-lg">
                           <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold mb-1">SSL Certificate Status</div>
                           <div className="text-text-main font-medium">{resItem.sslStatus}</div>
                        </div>
                      )}
                      {(resItem.redirectionPatterns) && (
                        <div className="space-y-1 bg-surface border border-border p-3 rounded-lg">
                           <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold mb-1">Redirection Patterns</div>
                           <div className="text-text-main w-full overflow-hidden text-ellipsis font-medium">{resItem.redirectionPatterns}</div>
                        </div>
                      )}
                      {(!resItem.domainReputation && !resItem.sslStatus && !resItem.redirectionPatterns) && (
                        <div className="text-text-dim italic text-xs col-span-3">Standard analysis performed. No specific advanced URL metrics were flagged.</div>
                      )}
                   </div>
                </div>
              )}

              {currentPhases.length > 0 && resItem.type !== 'breach' && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h5 className="text-sm font-bold text-text-dim uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity size={16} /> Scan Process Timeline
                  </h5>
                  <div className="relative border-l-2 border-[#10B981]/30 ml-4 space-y-6">
                    {currentPhases.map((phase, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface border-2 border-[#10B981] flex items-center justify-center">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        </div>
                        <div className="text-sm font-bold text-text-main">{phase}</div>
                        <div className="text-xs text-text-dim mt-0.5 opacity-80">Phase completed successfully</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(scanType === 'email' || scanType === 'phishing') && resItem.type !== 'breach' && (
                <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-xl space-y-4">
                   <h5 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                      <Search size={16} /> Email Analysis Breakdown
                   </h5>
                   <div className="grid grid-cols-1 gap-4 text-sm mt-3">
                      {(resItem.senderReputation) && (
                        <div className="space-y-1">
                           <div className="text-xs text-text-dim uppercase tracking-wider font-bold">Sender Reputation</div>
                           <div className="text-text-main">{resItem.senderReputation}</div>
                        </div>
                      )}
                      {(resItem.spfdkimdmarcRecords) && (
                        <div className="space-y-1">
                           <div className="text-xs text-text-dim uppercase tracking-wider font-bold">SPF/DKIM/DMARC Records</div>
                           <div className="text-text-main">{resItem.spfdkimdmarcRecords}</div>
                        </div>
                      )}
                      {(resItem.suspiciousHeaders) && (
                        <div className="space-y-1">
                           <div className="text-xs text-text-dim uppercase tracking-wider font-bold">Suspicious Headers</div>
                           <div className="text-text-main w-full overflow-hidden text-ellipsis">{resItem.suspiciousHeaders}</div>
                        </div>
                      )}
                      {(!resItem.senderReputation && !resItem.spfdkimdmarcRecords && !resItem.suspiciousHeaders) && (
                        <div className="text-text-dim italic text-xs">Standard analysis performed. No specific advanced Email metrics were flagged.</div>
                      )}
                   </div>
                </div>
              )}
              
              
              {resItem.verdict === 'Malicious' && resItem.type !== 'breach' && (
                <div className="mt-4 p-4 border border-[#EF4444]/30 bg-[#EF4444]/5 rounded-xl space-y-3">
                  <h5 className="text-sm font-bold text-[#EF4444] flex items-center gap-2">
                    <ShieldAlert size={16} /> Immediate Actions Required
                  </h5>
                  <ul className="text-xs text-[#94A3B8] space-y-2 list-none m-0 p-0">
                    {scanType === 'phishing' && (
                      <>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Do not click the link, download attachments, or provide any personal information.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Close the page if you have already opened it and do not reply to the sender.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Mark the email/message as phishing or consider blocking the sender.</span></li>
                      </>
                    )}
                    {scanType === 'url' && (
                      <>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Do not visit the URL or download any files from it.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Check your system for malware if you have already clicked the link.</span></li>
                      </>
                    )}
                    {scanType === 'sms' && (
                      <>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Do not reply to the sender (not even "STOP").</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Block the number on your device.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Delete the message from your inbox.</span></li>
                      </>
                    )}
                    {scanType === 'phone' && (
                      <>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Do not answer incoming calls from this number.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Report the number to your carrier if they support spam reporting.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Block the number in your phone's call settings.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>If it matches a known scam, consider reporting it to authorities or a carrier blocking service.</span></li>
                      </>
                    )}
                    {scanType === 'name' && (
                      <>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Review your privacy settings on social media.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Consider requesting removal of your phone number from public directories.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Enable two-factor authentication on all accounts.</span></li>
                      </>
                    )}
                    {scanType === 'email' && (
                      <>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Change the password for this email address immediately.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Use a password manager and enable hardware 2FA if possible.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Check and secure accounts linked to this email address.</span></li>
                      </>
                    )}
                    {scanType === 'company' && (
                      <>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Exercise caution regarding investments or correspondence with this company.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Verify corporate details with official registries.</span></li>
                      </>
                    )}
                    {scanType === 'username' && (
                      <>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Assume accounts bearing this username might be compromised.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>If this is your username, secure your accounts immediately.</span></li>
                      </>
                    )}
                    {scanType === 'domain' && (
                      <>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Avoid visiting this domain or entering credentials on any related page.</span></li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" /> <span>Block the domain at your network proxy or firewall.</span></li>
                      </>
                    )}
                  </ul>
                  <button onClick={() => setActiveScreen('ai')} className="mt-4 w-full py-2.5 bg-[#1E293B] border border-[#334155] text-xs font-semibold rounded-xl flex justify-center items-center gap-2 hover:bg-[#334155] transition-colors text-white">
                    <GraduationCap size={16} className="text-[#8B5CF6]" /> Start Phishing AI Trainer
                  </button>
                </div>
              )}

              {resItem.type === 'breach' && resItem.found.length > 0 && (
                <div className="mt-4 space-y-2">
                  {resItem.found.map((b: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs bg-surface/50 p-2 rounded-lg border border-border">
                      <span className="font-medium">{b.source}</span>
                      <span className="text-text-dim">{b.date}</span>
                    </div>
                  ))}
                </div>
              )}

              {resItem.type !== 'breach' && (scanType === 'phone' || scanType === 'name' || scanType === 'email' || scanType === 'sms' || scanType === 'company' || scanType === 'username' || scanType === 'domain') && resItem.candidates && resItem.candidates.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2"><UserIcon size={16} className="text-[#10B981]" /> Potential Matches</h4>
                  <div className="space-y-4">
                    {resItem.candidates.map((candidate: any, cIdx: number) => {
                      const candidateId = candidate.id || `${candidate.name}-${cIdx}`;
                      const isLinkingActive = activeLinkSource?.id === candidateId;
                      const isOtherEntityWhileLinking = activeLinkSource && !isLinkingActive;

                      return (
                      <div key={cIdx} className={cn("bg-surface/60 border p-4 rounded-xl shadow-lg space-y-3 relative overflow-hidden", isOtherEntityWhileLinking ? "border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "border-[#10B981]/30")}>
                        <div className="flex justify-between items-start gap-4 flex-col lg:flex-row">
                          <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="col-span-2 flex items-start gap-4">
                              {candidate.photoUrl && (
                                <img src={candidate.photoUrl} alt={candidate.name} className="w-16 h-16 rounded-xl object-cover border-2 border-primary/50 shadow-lg" referrerPolicy="no-referrer" />
                              )}
                              <div>
                                <span className="block text-xs text-text-dim uppercase tracking-wider mb-1">Name</span>
                                <span className="font-bold text-white text-lg flex flex-wrap items-center gap-2">
                                  {candidate.name || 'Unknown'}
                                  {isLinkingActive && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse border border-primary/50 flex items-center gap-1"><LinkIcon size={10} /> Linking Active</span>}
                                </span>
                                {(candidate.fullName || candidate.alias) && (
                                  <div className="text-xs text-text-main mt-1 font-medium">
                                    {[candidate.fullName ? `Full Name: ${candidate.fullName}` : null, candidate.alias ? `Alias: ${candidate.alias}` : null].filter(Boolean).join(' • ')}
                                  </div>
                                )}
                              </div>
                            </div>
                            {((candidate.emails && candidate.emails.length > 0) || (candidate.phoneNumbers && candidate.phoneNumbers.length > 0) || candidate.publicSpacesLinked?.length > 0) && (
                              <div className="col-span-2">
                                <span className="block text-xs text-text-dim uppercase tracking-wider mb-1">Contact & Public presence</span>
                                {((candidate.emails && candidate.emails.length > 0) || (candidate.phoneNumbers && candidate.phoneNumbers.length > 0)) && (
                                  <div className="text-xs text-[#3B82F6] font-medium">
                                    {[candidate.emails?.length > 0 ? `Emails: ${candidate.emails.join(', ')}` : null, candidate.phoneNumbers?.length > 0 ? `Phone: ${candidate.phoneNumbers.join(', ')}` : null].filter(Boolean).join(' • ')}
                                  </div>
                                )}
                                {candidate.publicSpacesLinked && candidate.publicSpacesLinked.length > 0 && (
                                  <div className="text-xs text-[#F59E0B] font-medium mt-1">
                                    Public Spaces: {candidate.publicSpacesLinked.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                            {(candidate.age || candidate.dateOfBirth || candidate.location || candidate.sex || candidate.maritalStatus || candidate.profession) && (
                              <div className="col-span-2 md:col-span-1">
                                <span className="block text-xs text-text-dim uppercase tracking-wider mb-1">Details</span>
                                <span className="text-sm text-text-main flex flex-wrap gap-x-3 gap-y-1">
                                  {candidate.dateOfBirth && <span>DOB: {candidate.dateOfBirth}</span>}
                                  {candidate.age && <span>• {candidate.age} years old</span>}
                                  {candidate.sex && <span>• {candidate.sex}</span>}
                                  {candidate.profession && <span>• {candidate.profession}</span>}
                                  {candidate.maritalStatus && <span>• {candidate.maritalStatus}</span>}
                                  {candidate.location && <span>• {candidate.location}</span>}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 lg:ml-4 gap-2 flex-row lg:flex-col">
                            {!activeLinkSource && (
                              <button onClick={() => setActiveLinkSource({ id: candidateId, name: candidate.name || 'Unknown' })} className="text-xs bg-bg border border-border px-3 py-1.5 rounded-lg hover:border-primary transition-colors text-text-dim hover:text-white flex items-center gap-1">
                                 <LinkIcon size={12} /> Select for Link
                              </button>
                            )}
                            {isLinkingActive && (
                              <button onClick={() => setActiveLinkSource(null)} className="text-xs bg-bg border border-border px-3 py-1.5 rounded-lg hover:border-danger transition-colors text-text-dim hover:text-white flex items-center gap-1">
                                 Cancel Link
                              </button>
                            )}
                            {isOtherEntityWhileLinking && (
                              <button onClick={() => setShowLinkModal({ targetId: candidateId, targetName: candidate.name || 'Unknown' })} className="text-xs bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors shadow-[0_0_10px_rgba(139,92,246,0.5)] flex items-center gap-1 shrink-0">
                                <LinkIcon size={14} /> Link to {activeLinkSource.name}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {(candidate.characterCredibilityScore != null || candidate.characterRiskScore != null) && (
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            {candidate.characterCredibilityScore != null && (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-dim uppercase tracking-wider">Credibility</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                                     <div className="h-full bg-success" style={{ width: `${candidate.characterCredibilityScore}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-success">{candidate.characterCredibilityScore}%</span>
                                </div>
                              </div>
                            )}
                            {candidate.characterRiskScore != null && (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-dim uppercase tracking-wider">Character Risk</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                                     <div className="h-full bg-danger" style={{ width: `${candidate.characterRiskScore}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-danger">{candidate.characterRiskScore}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {candidate.characterAssessment && (
                          <ExpandableSection title="Character & Integrity Assessment" color="#3B82F6" icon={<GraduationCap size={14}/>}>
                            <p className="text-sm text-[#3B82F6]/90">{candidate.characterAssessment}</p>
                          </ExpandableSection>
                        )}
                        
                        {candidate.description && (
                          <ExpandableSection title="Description / Summary" color="#94A3B8">
                            <p className="text-sm text-[#94A3B8]">{candidate.description}</p>
                          </ExpandableSection>
                        )}

                        {candidate.history && (
                          <ExpandableSection title="History & Background" color="#3B82F6">
                            <p className="text-sm text-[#94A3B8]">{candidate.history}</p>
                          </ExpandableSection>
                        )}
                        
                        {candidate.workHistory && (
                          <ExpandableSection title="Work History" color="#3B82F6">
                            <p className="text-sm text-[#94A3B8]">{candidate.workHistory}</p>
                          </ExpandableSection>
                        )}
                        
                        {candidate.criminalRecords && (
                          <ExpandableSection title="Criminal & Fraud Records" color="#EF4444" defaultOpen={true}>
                            <p className="text-sm text-[#EF4444]/90">{candidate.criminalRecords}</p>
                          </ExpandableSection>
                        )}
                        
                        {candidate.moralFidelity && (
                          <ExpandableSection title="Moral Fidelity" color="#F59E0B">
                            <p className="text-sm text-[#94A3B8]">{candidate.moralFidelity}</p>
                          </ExpandableSection>
                        )}

                        {candidate.sexTapeLeakages && (
                          <ExpandableSection title="Sex Tape Leakages" color="#EF4444" defaultOpen={true}>
                            <p className="text-sm text-[#94A3B8]">{candidate.sexTapeLeakages}</p>
                          </ExpandableSection>
                        )}

                        {candidate.sexualScandals && (
                          <ExpandableSection title="Known Scandals" color="#EF4444" defaultOpen={true}>
                            <p className="text-sm text-[#94A3B8]">{candidate.sexualScandals}</p>
                          </ExpandableSection>
                        )}

                        {candidate.relationshipHistory && (
                          <ExpandableSection title="Relationship History" color="#8B5CF6">
                            <p className="text-sm text-[#94A3B8]">{candidate.relationshipHistory}</p>
                          </ExpandableSection>
                        )}

                        {candidate.previousMarriages && (
                          <ExpandableSection title="Previous Marriages" color="#8B5CF6">
                            <p className="text-sm text-[#94A3B8]">{candidate.previousMarriages}</p>
                          </ExpandableSection>
                        )}
                        
                        {candidate.creditWorthiness && (
                          <ExpandableSection title="Business & Credit Worthiness" color="#10B981">
                            <p className="text-sm text-[#94A3B8]">{candidate.creditWorthiness}</p>
                          </ExpandableSection>
                        )}

                        {candidate.financialCredibilityForLoans && (
                          <ExpandableSection title="Financial Credibility for Loans" color="#10B981">
                            <p className="text-sm text-[#94A3B8]">{candidate.financialCredibilityForLoans}</p>
                          </ExpandableSection>
                        )}

                        {candidate.characterCredibilityForBusiness && (
                          <ExpandableSection title="Character Credibility for Business" color="#10B981">
                            <p className="text-sm text-[#94A3B8]">{candidate.characterCredibilityForBusiness}</p>
                          </ExpandableSection>
                        )}
                        
                        {(candidate.digitalInconsistencies && candidate.digitalInconsistencies.length > 0) && (
                          <ExpandableSection title="Digital Presence Inconsistencies" color="#F59E0B">
                            <div className="space-y-3">
                              {candidate.digitalInconsistencies.map((inc: any, idx: number) => (
                                <div key={idx} className="bg-surface/40 p-3 rounded-lg border border-[#F59E0B]/20">
                                  <p className="text-sm text-[#F59E0B]/90">{inc.description || inc}</p>
                                  {(inc.source || inc.date || inc.reliabilityLevel) && (
                                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-text-dim items-center">
                                      {inc.reliabilityLevel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] uppercase font-bold", inc.reliabilityLevel === 'High' ? "bg-success/10 text-success" : inc.reliabilityLevel === 'Medium' ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-danger/10 text-danger")}>{inc.reliabilityLevel}</span>}
                                      {inc.date && <span>{inc.date}</span>}
                                      {inc.source && <span className="truncate max-w-[200px] hover:text-[#00E5FF] transition-colors">{inc.source.startsWith('http') ? <a href={inc.source} target="_blank" rel="noopener noreferrer">{inc.source}</a> : inc.source}</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ExpandableSection>
                        )}

                        {(candidate.socialMediaProfiles && candidate.socialMediaProfiles.length > 0) ? (
                          <ExpandableSection title="Publicly Available Social Media Profiles" color="#10B981" defaultOpen={true}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {candidate.socialMediaProfiles.map((profile: any, idx: number) => (
                                <div key={idx} className="p-3 bg-[#10B981]/5 border border-[#10B981]/20 rounded-lg flex flex-col gap-2">
                                  <a href={profile.url.startsWith('http') ? profile.url : `https://${profile.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#10B981] font-medium hover:underline">
                                    {profile.platform} <span className="text-xs ml-auto">External &nearr;</span>
                                  </a>
                                  {(profile.source || profile.date || profile.reliabilityLevel) && (
                                    <div className="flex flex-wrap gap-2 text-[10px] text-text-dim">
                                      {profile.reliabilityLevel && <span className={cn("px-1 rounded font-bold", profile.reliabilityLevel === 'High' ? "text-success" : profile.reliabilityLevel === 'Medium' ? "text-[#F59E0B]" : "text-danger")}>{profile.reliabilityLevel}</span>}
                                      {profile.date && <span>• {profile.date}</span>}
                                      {profile.source && <span className="truncate max-w-[120px]">• {profile.source.replace(/^https?:\/\//, '')}</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ExpandableSection>
                        ) : null}

                        {(candidate.associatedCompanies && candidate.associatedCompanies.length > 0) && (
                          <ExpandableSection title="Associated Companies" color="#F59E0B" icon={<Briefcase size={14} />} defaultOpen={true}>
                            <div className="space-y-2">
                              {candidate.associatedCompanies.map((company: any, idx: number) => (
                                <div key={idx} className="bg-surface/50 p-3 rounded-lg border border-border">
                                  <div className="text-sm font-bold text-white mb-1">{company.name}</div>
                                  <div className="text-xs text-[#F59E0B] mb-2">{company.relationship}</div>
                                  {company.finding && <p className="text-xs text-text-main mb-2">{company.finding}</p>}
                                  {(company.source || company.date || company.reliabilityLevel) && (
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-text-dim border-t border-border/50 pt-2">
                                      {company.reliabilityLevel && <span className={cn("px-1.5 py-0.5 border rounded uppercase", company.reliabilityLevel === 'High' ? "border-success/30 text-success" : company.reliabilityLevel === 'Medium' ? "border-[#F59E0B]/30 text-[#F59E0B]" : "border-danger/30 text-danger")}>{company.reliabilityLevel} Confidence</span>}
                                      {company.date && <span>{company.date}</span>}
                                      {company.source && <span className="truncate max-w-[150px]">{company.source.startsWith('http') ? <a href={company.source} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary">{company.source.replace(/^https?:\/\//, '')}</a> : company.source}</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ExpandableSection>
                        )}

                        {(candidate.sources && candidate.sources.length > 0) && (
                          <ExpandableSection title="Public Sources of Information" color="#3B82F6" icon={<LinkIcon size={14} />} defaultOpen={true}>
                            <div className="space-y-1.5">
                              {candidate.sources.map((source: any, idx: number) => (
                                <a href={source.url.startsWith('http') ? source.url : `https://${source.url}`} target="_blank" rel="noopener noreferrer" key={idx} className="block px-3 py-2 bg-surface text-text-main border border-border rounded-lg text-xs hover:bg-surface/80 hover:border-primary/50 hover:text-primary transition-all">
                                  {source.title || source.url}
                                </a>
                              ))}
                            </div>
                          </ExpandableSection>
                        )}

                        <div className="pt-3 border-t border-border flex justify-end">
                          <button 
                            onClick={() => handleScan('name', candidate.name + (candidate.location ? ` in ${candidate.location}` : ''))}
                            className="bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-[#10B981]/30">
                            <Search size={14} /> Scan Candidate
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {resItem.type !== 'breach' && scanType !== 'phishing' && resItem.leakages && resItem.leakages.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Globe size={16} className="text-[#F59E0B]" /> Known Leakages</h4>
                  <div className="space-y-3">
                    {resItem.leakages.map((leak: any, idx: number) => (
                      <div key={idx} className="bg-surface/60 border border-[#F59E0B]/30 p-4 rounded-xl shadow-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm text-[#F59E0B]">{leak.source || 'Unknown Source'}</span>
                          <span className="text-xs text-text-dim/80 font-mono">{leak.date || 'Unknown Date'}</span>
                        </div>
                        <div className="text-xs text-text-dim mt-2">
                          <strong className="text-white">Exposed Data:</strong> {leak.dataExposed ? leak.dataExposed.join(', ') : (scanType === 'phone' ? 'Phone Number' : scanType === 'email' ? 'Email Address' : 'Full Name, Phone Number, Email')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resItem.type !== 'breach' && scanType !== 'phishing' && resItem.websites && resItem.websites.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2"><LinkIcon size={16} className="text-[#3B82F6]" /> Exposed on Websites</h4>
                  <div className="flex flex-wrap gap-2">
                    {resItem.websites.map((website: string, idx: number) => {
                      const url = website.startsWith('http') ? website : `https://${website}`;
                      return (
                        <a href={url} target="_blank" rel="noopener noreferrer" key={idx} className="px-3 py-1.5 bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 rounded-lg text-xs font-medium hover:bg-[#3B82F6]/20 transition-colors">
                          {website}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <ScanTimeline result={resItem} scanType={scanType} />

              <AIInsightBox data={resItem} contextKey={`scan-${resItem.type}-${resItem.input}`} askAI={askAI} />
            </div>
          </div>
        </motion.div>
      ))}
        </div>
      )}
      </>
     )}
    </motion.div>
  );
}

function AIAssistant({ askAI, logActivity, profile, setActiveScreen, alerts, activityLogs }: any) {
  const [messages, setMessages] = useState<any[]>([
    { role: 'ai', text: "Hello! I'm CyberAmour. How can I help secure your digital life today?" }
  ]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typing, setTyping] = useState(false);
  const [mode, setMode] = useState<'chat' | 'training'>('chat');
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);

  const isPremium = profile?.isPremium;
  const userMessagesCount = messages.filter(m => m.role === 'user').length;
  const isLimitReached = !isPremium && userMessagesCount >= 5;

  const handleSend = async (forcedInput?: string) => {
    const userMsg = forcedInput || input;
    if (!userMsg || isLimitReached) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTyping(true);
    logActivity('ai_query', { query: userMsg.substring(0, 20) + '...' });

    const lowerMsg = userMsg.toLowerCase();
    if (/(password|login|credential|vault|strong)/.test(lowerMsg)) setCurrentDomain('password');
    else if (/(network|wifi|router|vpn|ip|scan)/.test(lowerMsg)) setCurrentDomain('network');
    else if (/(phishing|email|spam|scam|link|train)/.test(lowerMsg)) setCurrentDomain('phishing');
    else if (/(breach|leak|dark|hack)/.test(lowerMsg)) setCurrentDomain('darkweb');
    else setCurrentDomain(null);
    
    const response = await askAI(userMsg);
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setTyping(false);
  };

  const handleGenerateAdvice = async () => {
    const userMsg = "Please provide proactive security advice based on my recent activity.";
    if (isLimitReached) return;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTyping(true);

    const context = `
    Analyze the following recent activity and alerts to provide proactive security advice.
    Return your advice formatted in markdown. Focus on clear, actionable advice.
    At the end of your response, output a special JSON block enclosed in \`\`\`json containing recommended navigation actions.
    The action should be one of: 'dashboard', 'scan', 'alerts', 'features', 'settings', 'darkweb', 'network'.
    Example JSON:
    [
      { "label": "Review Scan Center", "action": "scan" },
      { "label": "Check Alerts", "action": "alerts" }
    ]

    Recent Alerts: ${JSON.stringify(alerts?.slice(0, 3) || [])}
    Recent Activity: ${JSON.stringify(activityLogs?.slice(0, 5) || [])}
    `;

    const response = await askAI(context);
    
    let textToDisplay = response;
    let actions = [];
    try {
       const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
       if (jsonMatch) {
         textToDisplay = response.replace(jsonMatch[0], '').trim();
         actions = JSON.parse(jsonMatch[1]);
       }
    } catch(e) {
       console.error("Failed to parse AI action suggestions", e);
    }

    setMessages(prev => [...prev, { role: 'ai', text: textToDisplay, actions }]);
    setTyping(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-200px)] lg:h-[calc(100vh-300px)] relative"
    >
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            AI Assistant
          </h2>
          <div className="flex bg-surface p-1 rounded-lg border border-border">
            <button 
              onClick={() => setMode('chat')}
              className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", mode === 'chat' ? "bg-primary text-white" : "text-text-dim hover:text-white")}
            >
              Chat
            </button>
            <button 
              onClick={() => setMode('training')}
              className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5", mode === 'training' ? "bg-accent text-white" : "text-text-dim hover:text-white")}
            >
              <GraduationCap size={14} /> Training
            </button>
          </div>
        </div>

        {mode === 'chat' && (
          <div className="flex items-center gap-2 w-full md:w-auto md:justify-end overflow-x-auto">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                placeholder="Search chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 px-3 py-1.5 focus:outline-none focus:border-primary border border-border bg-surface text-xs rounded-full w-full md:w-40 placeholder:text-text-dim/50 text-white"
              />
            </div>
            <button 
              onClick={handleGenerateAdvice}
              disabled={isLimitReached || typing}
              className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-xs font-bold hover:bg-success/20 transition-all disabled:opacity-50"
            >
              <ShieldAlert size={14} />
              Generate Advice
            </button>
            <button 
              onClick={() => setMessages([{ role: 'ai', text: "Hello! I'm CyberAmour. How can I help secure your digital life today?" }])}
              className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 text-danger rounded-full text-xs font-bold hover:bg-danger/20 transition-all"
            >
              <Trash2 size={14} />
              Clear Chat
            </button>
          </div>
        )}
      </div>

      {mode === 'training' ? (
        <PhishingTrainingModule onClose={() => setMode('chat')} logActivity={logActivity} isEmbedded={true} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
        {messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase())).map((m, i) => (
          <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
              m.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-surface text-text-main rounded-tl-none border border-border"
            )}>
              <ReactMarkdown>{m.text}</ReactMarkdown>
              {m.actions && m.actions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border">
                  {m.actions.map((action: any, aIdx: number) => (
                    <button 
                      key={aIdx} 
                      onClick={() => setActiveScreen(action.action)}
                      className="px-3 py-1.5 bg-success/10 text-success border border-success/30 hover:bg-success/20 rounded-lg transition-colors font-bold text-xs flex items-center gap-2"
                    >
                      <ArrowRight size={14} /> {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-surface p-4 rounded-2xl rounded-tl-none flex gap-1 border border-border">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-text-dim rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-text-dim rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-text-dim rounded-full" />
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={() => handleSend("How do I identify a phishing email?")} className="px-3 py-1.5 bg-surface border border-border hover:border-primary rounded-full transition-colors text-text-dim hover:text-white">How to spot phishing?</button>
            <button onClick={() => handleSend("What makes a password strong and secure?")} className="px-3 py-1.5 bg-surface border border-border hover:border-primary rounded-full transition-colors text-text-dim hover:text-white">Password best practices</button>
            <button onClick={() => handleSend("How can I secure my social media accounts?")} className="px-3 py-1.5 bg-surface border border-border hover:border-primary rounded-full transition-colors text-text-dim hover:text-white">Secure social accounts</button>
            <button onClick={() => handleSend("What should I do if my data is compromised?")} className="px-3 py-1.5 bg-surface border border-border hover:border-primary rounded-full transition-colors text-text-dim hover:text-white">Data breach response</button>
          </div>
        )}
        {isLimitReached && (
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-[10px] text-accent font-bold text-center">
            Free tier limit reached (5 messages). Premium AI access is subject to configured usage limits.
          </div>
        )}
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            disabled={isLimitReached}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isLimitReached ? "Limit reached..." : "Ask anything about security..."}
            className="flex-1 bg-surface/50 border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLimitReached}
            className="p-3 bg-primary text-white rounded-2xl shadow-lg disabled:opacity-50"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        {/* Domain-specific Action Buttons */}
        {currentDomain === 'password' && (
           <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mt-1">
             <button onClick={() => setActiveScreen('features')} className="text-xs bg-[#1E293B] border border-[#334155] text-white px-3 py-1.5 rounded-full hover:bg-[#334155] transition-colors flex items-center gap-1.5">
               <Lock size={12} className="text-accent" /> Check Features
             </button>
             <button onClick={() => handleSend("Generate a strong and secure password for me")} className="text-xs bg-[#1E293B] border border-[#334155] text-white px-3 py-1.5 rounded-full hover:bg-[#334155] transition-colors flex items-center gap-1.5">
               <Zap size={12} className="text-primary" /> Generate Strong Password
             </button>
           </motion.div>
        )}
        {currentDomain === 'network' && (
           <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mt-1">
             <button onClick={() => setActiveScreen('network')} className="text-xs bg-[#1E293B] border border-[#334155] text-white px-3 py-1.5 rounded-full hover:bg-[#334155] transition-colors flex items-center gap-1.5">
               <Network size={12} className="text-[#8B5CF6]" /> View Network Status
             </button>
             <button onClick={() => handleSend("How can I secure my home router?")} className="text-xs bg-[#1E293B] border border-[#334155] text-white px-3 py-1.5 rounded-full hover:bg-[#334155] transition-colors flex items-center gap-1.5">
               <Shield size={12} className="text-success" /> Router Security Guide
             </button>
           </motion.div>
        )}
        {currentDomain === 'phishing' && (
           <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mt-1">
             <button onClick={() => setMode('training')} className="text-xs bg-[#1E293B] border border-[#334155] text-white px-3 py-1.5 rounded-full hover:bg-[#334155] transition-colors flex items-center gap-1.5">
               <GraduationCap size={12} className="text-accent" /> Start Phishing Training
             </button>
             <button onClick={() => handleSend("Can you tell me the common red flags of a phishing email?")} className="text-xs bg-[#1E293B] border border-[#334155] text-white px-3 py-1.5 rounded-full hover:bg-[#334155] transition-colors flex items-center gap-1.5">
               <ShieldAlert size={12} className="text-danger" /> Spot Phishing Red Flags
             </button>
           </motion.div>
        )}
        {currentDomain === 'darkweb' && (
           <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mt-1">
             <button onClick={() => setActiveScreen('darkweb')} className="text-xs bg-[#1E293B] border border-[#334155] text-white px-3 py-1.5 rounded-full hover:bg-[#334155] transition-colors flex items-center gap-1.5">
               <Ghost size={12} className="text-danger" /> Search Public Sources
             </button>
             <button onClick={() => handleSend("What should I do first if my password is part of a data breach?")} className="text-xs bg-[#1E293B] border border-[#334155] text-white px-3 py-1.5 rounded-full hover:bg-[#334155] transition-colors flex items-center gap-1.5">
               <AlertCircle size={12} className="text-accent" /> Breach Response Plan
             </button>
           </motion.div>
        )}
      </div>
        </>
      )}

    </motion.div>
  );
}

function PhishingTrainingModule({ onClose, logActivity, isEmbedded = false }: { onClose: () => void, logActivity: any, isEmbedded?: boolean }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const scenarios = [
    {
      title: "The Urgent Bank Alert",
      type: "email",
      sender: "Security@BankOfAmerica-Support.com",
      subject: "URGENT: Your account has been locked",
      content: "Dear Customer,\n\nYour account has been locked due to suspicious activity. Click the link below to verify your identity immediately or your funds will be frozen permanently.\n\nhttp://verify-bankofamerica.net/login\n\nSincerely,\nSecurity Team",
      options: [
        "Click the link to secure my funds immediately.",
        "Check the sender's email address carefully and look for a lock icon.",
        "Ignore the email and log in directly through the official bank website or app.",
        "Reply to the email asking for more details."
      ],
      correct: 2,
      explanation: "Official banks will never ask you to verify sensitive info via a direct link in an urgent email. Notice the fake sender domain and URL. Always use official channels."
    },
    {
      title: "The Internal Helpdesk Request",
      type: "email",
      sender: "IT-Support@company-portal-update.com",
      subject: "Action Required: Update your Outlook Password",
      content: "Hi team,\n\nWe are migrating to a new email server. Please update your Outlook credentials today by 5 PM to avoid losing access to your inbox.\n\nUpdate here: https://outlook-company-update.com/auth\n\nThanks,\nIT Department",
      options: [
        "Click the link and submit my credentials as requested.",
        "Forward the email to my personal email to do it later.",
        "Report the email to IT via official internal channels without clicking the link.",
        "Reply to the email to confirm if it's real."
      ],
      correct: 2,
      explanation: "This is a targeted phishing attack (spear-phishing) pretending to be internal IT. The sender domain is not the official company domain. Always report suspicious internal emails."
    },
    {
      title: "The Surprise Package",
      type: "text",
      content: "An SMS arrives: 'FedEx: Your package delivery failed. Please update your address at http://fedex-delivery-update.net/track to avoid a $50 storage fee.'",
      options: [
        "Click the link to update my address.",
        "Call FedEx customer service using a number from their official website.",
        "Pay the $50 fee to get it over with.",
        "Forward the text to my friends to warn them."
      ],
      correct: 1,
      explanation: "Smishing (SMS Phishing) often uses fake delivery alerts. The URL 'fedex-delivery-update.net' is not an official FedEx domain."
    },
    {
      title: "The IT Support Call",
      type: "text",
      content: "A person calling themselves 'John from Microsoft Support' calls you, saying your computer is sending out viruses and he needs remote access to fix it.",
      options: [
        "Give him remote access so he can fix the problem.",
        "Ask him for his employee ID and then give access.",
        "Hang up. Tech companies like Microsoft do not make unsolicited support calls.",
        "Ask him to wait while you back up your files."
      ],
      correct: 2,
      explanation: "This is a classic tech support scam. Microsoft and other tech giants never call users proactively about 'viruses' on their machines."
    },
    {
      title: "The Dark Web Alert",
      type: "email",
      sender: "Alerts@CyberAmour",
      subject: "Action Required: Exposed Credentials Found",
      content: "You receive a legitimate alert from your Public Breach Intelligenceing service that a password you use frequently was found in a database breach.\n\nWhat is the most appropriate first step to secure your accounts?",
      options: [
        "Ignore it since it's just one password.",
        "Change the password immediately on the breached site and any other sites where you reused it.",
        "Download the breached database to see what other information is there.",
        "Delete your account on the breached website and wait."
      ],
      correct: 1,
      explanation: "Credential stuffing is a common attack where hackers use exposed passwords on other services. You must immediately change the reused password everywhere and enable Two-Factor Authentication (2FA)."
    },
    {
      title: "The Unknown Device on Network",
      type: "text",
      content: "Your home network scanner alerts you: 'Unknown Device Connected: Raspberry Pi - IP 192.168.1.105'. You don't own a Raspberry Pi.",
      options: [
        "Assume it's a neighbor's device and safely ignore it.",
        "Immediately block the device's MAC address via your router and change the Wi-Fi password.",
        "Try to connect to the device to see what it is.",
        "Run an antivirus scan on your mobile phone."
      ],
      correct: 1,
      explanation: "Rogue devices on your network can intercept traffic, perform man-in-the-middle attacks, or act as a backdoor. Immediate isolation by blocking the MAC address and changing credentials is required."
    },
    {
      title: "GDPR: Fair & Transparent Processing",
      type: "text",
      content: "The GDPR protects Europeans' personal data and requires fair, lawful, and transparent data processing. What is a key requirement of this principle?",
      options: [
        "Organizations must encrypt all data to military standards.",
        "Organizations must tell people how their data will be used, kept, and processed.",
        "Organizations must delete data as soon as it is collected.",
        "Organizations must only collect data from European citizens."
      ],
      correct: 1,
      explanation: "Organizations must be transparent by telling people how their data will be used, kept, and processed. They must also allow individuals to view and correct their personal data."
    },
    {
      title: "GDPR: Intended Use & Data Minimization",
      type: "text",
      content: "According to the GDPR's second key principle regarding the acquisition of personal data, how should an organization approach data collection?",
      options: [
        "Acquire as much data as possible for future, undetermined use.",
        "Share collected data with third parties to maximize its utility.",
        "Only acquire and process the data needed to fulfill their specific goals.",
        "Collect data indefinitely without informing the users."
      ],
      correct: 2,
      explanation: "Organizations must only acquire and treat personal data for its intended use and simply process the data needed to fulfill their goals."
    },
    {
      title: "GDPR: Safeguarding Personal Data",
      type: "text",
      content: "The third key GDPR principle mandates the protection of personal data. Which of the following represents appropriate measures an organization should take?",
      options: [
        "Printing all personal data and storing it in physical cabinets.",
        "Uploading all personal data to a public cloud storage bucket.",
        "Using personal data only during regular business hours.",
        "Implementing security safeguards like encryption and firewalls to protect personal data."
      ],
      correct: 3,
      explanation: "Third, organizations must safeguard personal data. Organizations must protect personal data using encryption, firewalls, etc."
    },
    {
      title: "GDPR: Storage Limitation",
      type: "text",
      content: "Under the fourth key principle of GDPR, what should an organization do with personal data once its initial purpose has been fulfilled?",
      options: [
        "Sell the data to a third-party marketing agency.",
        "Store the data indefinitely in case it is needed again.",
        "Archive the data in a publicly accessible database.",
        "Dispose of or delete the data since it cannot be stored beyond the required duration."
      ],
      correct: 3,
      explanation: "The fourth key principle highlights that organizations ought to dispose of personal data when its initial purpose has been fulfilled or deleted. Personal data cannot be stored by organizations beyond the required duration."
    },
    {
      title: "GDPR: Data Subject Rights",
      type: "text",
      content: "The fifth basic GDPR principle relates to individual rights. Which of the following must organizations enable for data subjects?",
      options: [
        "The right to process other users' data.",
        "The right to access, correct, and delete their personal data, and to object to processing.",
        "The right to bypass organizational firewalls.",
        "The right to indefinitely extend the storage of their data."
      ],
      correct: 1,
      explanation: "Under the fifth basic principle, personal data can be accessed, corrected, and deleted by the individual. Organizations must also allow data subjects to object to processing."
    }
  ];

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    const correct = index === scenarios[step].correct;
    setIsCorrect(correct);
    if (correct) setScore(prev => prev + 1);
  };

  const nextStep = () => {
    if (step < scenarios.length - 1) {
      setStep(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      logActivity('phishing_training_complete', { score });
      setStep(99); // Completion state
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: isEmbedded ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: isEmbedded ? 1 : 0.95 }}
      className={cn(
        "flex flex-col flex-1",
        isEmbedded ? "w-full" : "absolute inset-0 z-50 bg-bg p-6 rounded-2xl border border-border shadow-2xl"
      )}
    >
      <div className={cn("flex justify-between items-center mb-6", isEmbedded && "mt-2")}>
        <div className="flex items-center gap-2">
          <GraduationCap className="text-primary" size={24} />
          <h3 className="font-bold text-lg">Phishing Defense Academy</h3>
        </div>
        <div className="flex gap-4 items-center">
          {step < scenarios.length && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  logActivity('phishing_training_next_question_clicked');
                  nextStep();
                }} 
                className="text-xs text-text-dim hover:text-white uppercase tracking-widest px-2 font-bold flex flex-row items-center gap-1"
              >
                Next <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => {
                  logActivity('phishing_training_skipped');
                  setStep(99); 
                }} 
                className="text-xs text-text-dim hover:text-white uppercase tracking-widest px-2 font-bold"
              >
                Skip to End
              </button>
            </div>
          )}
          <button onClick={onClose} className="text-text-dim hover:text-text-main">
            <XCircle size={24} />
          </button>
        </div>
      </div>

      {step < scenarios.length ? (
        <div className="flex-1 flex flex-col">
          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold text-text-dim mb-2 uppercase tracking-widest">
              <span>Scenario {step + 1} of {scenarios.length}</span>
              <span>Score: {score}</span>
            </div>
            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / scenarios.length) * 100}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>

          <div className="glass-card p-6 mb-6 border-primary/20 bg-primary/5">
            <h4 className="font-bold text-primary mb-4 flex items-center gap-2"><Eye size={18} /> {scenarios[step].title}</h4>
            
            {scenarios[step].type === 'email' ? (
              <div className="bg-white text-black p-4 rounded-xl border border-border/50 text-sm font-sans shadow-inner">
                <div className="flex border-b pb-3 mb-3 border-gray-200 text-xs">
                  <div className="flex flex-col gap-1 w-full">
                     <div className="flex justify-between">
                       <span className="text-gray-500 font-medium w-16">From:</span>
                       <span className="font-bold flex-1 text-gray-800 break-all">{scenarios[step].sender}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-500 font-medium w-16">Subject:</span>
                       <span className="font-bold flex-1 text-gray-800">{scenarios[step].subject}</span>
                     </div>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed break-words">{scenarios[step].content}</div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed italic bg-surface p-4 border border-border rounded-xl">"{scenarios[step].content}"</p>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {scenarios[step].options.map((option, i) => (
              <button
                key={i}
                disabled={selectedAnswer !== null}
                onClick={() => handleAnswer(i)}
                className={cn(
                  "w-full p-4 text-left text-sm rounded-xl border transition-all flex justify-between items-center",
                  selectedAnswer === null ? "bg-surface border-border hover:border-primary/50" : 
                  i === scenarios[step].correct ? "bg-success/10 border-success text-success" :
                  selectedAnswer === i ? "bg-danger/10 border-danger text-danger" : "bg-surface border-border opacity-50"
                )}
              >
                <span>{option}</span>
                {selectedAnswer !== null && i === scenarios[step].correct && <CheckCircle2 size={16} />}
                {selectedAnswer === i && i !== scenarios[step].correct && <XCircle size={16} />}
              </button>
            ))}
          </div>

          {selectedAnswer !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-surface rounded-xl border border-border"
            >
              <div className="flex items-start gap-3">
                <HelpCircle size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold mb-1">{isCorrect ? "Correct!" : "Not quite..."}</p>
                  <p className="text-xs text-text-dim leading-relaxed">{scenarios[step].explanation}</p>
                </div>
              </div>
              <button 
                onClick={nextStep}
                className="w-full mt-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2"
              >
                {step === scenarios.length - 1 ? "Finish Training" : "Next Scenario"}
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-2">
            <Trophy size={40} className="text-success" />
          </div>
          <div>
            <h4 className="text-2xl font-bold mb-2">Training Complete!</h4>
            <p className="text-text-dim text-sm max-w-xs mx-auto">
              You've successfully completed the Phishing Defense Academy. Your final score is <span className="text-primary font-bold">{score}/{scenarios.length}</span>.
            </p>
          </div>
          <div className="w-full space-y-3">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20"
            >
              Return to Assistant
            </button>
            <button 
              onClick={() => { setStep(0); setScore(0); setSelectedAnswer(null); setIsCorrect(null); }}
              className="w-full py-4 text-text-dim font-bold hover:text-text-main transition-colors"
            >
              Retake Training
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

const HighlightedText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-primary/20 text-primary font-bold rounded px-0.5">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

function KeyFeatures({ setActiveScreen, isPermanentOwner }: any) {
  const freeFeatures = [
    { name: 'Basic Threat Scanning', desc: 'Scan URLs and files for known threats', icon: <Search size={24} className="text-secondary" /> },
    { name: 'Security Score Dashboard', desc: 'Overview of your security posture', icon: <Shield size={24} className="text-primary" /> },
    { name: 'AI Security Assistant (Limited)', desc: 'Basic chatbot guidance', icon: <MessageSquare size={24} className="text-text-dim" /> },
    { name: 'Alerts Center', desc: 'Standard threat feeds', icon: <Bell size={24} className="text-[#F59E0B]" /> },
    { name: 'Task Manager', desc: 'Manage your security tasks', icon: <CheckSquare size={24} className="text-text-dim" /> }
  ];

  const premiumFeatures = [
    { name: 'Comprehensive Global Identity Search', desc: 'Deep AI-driven forensics into personas', icon: <UserSearch size={24} className="text-[#00E5FF]" /> },
    { name: 'Dark Web Exposure Checks', desc: 'Run supported exposure checks when configured; results are not continuous surveillance', icon: <Ghost size={24} className="text-[#8B5CF6]" /> },
    { name: 'AI Security Assistant', desc: 'Advanced conversational AI; usage limits apply', icon: <MessageSquare size={24} className="text-accent" /> },
    { name: 'Pre-Report Interactive Feedback', desc: 'Refine raw scan findings interactively', icon: <Settings size={24} className="text-success" /> },
    { name: 'Antivirus & File Reputation', desc: 'Local SHA-256 fingerprinting and live reputation lookup when configured; not full-device antivirus', icon: <ShieldCheck size={24} className="text-success" /> },
    { name: 'Export Diagnostics', desc: 'PDF/CSV export of advanced hardware stats', icon: <Download size={24} className="text-danger" /> }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Star className="text-accent" /> Key Features & Capabilities
        </h2>
        <p className="text-text-dim text-sm">Explore the advanced capabilities of the CyberAmour platform.</p>
        <div className="flex gap-4 mt-2">
           <button onClick={() => setActiveScreen?.('guide')} className="px-4 py-2 bg-surface border border-success/30 text-success rounded-xl font-bold flex gap-2 items-center hover:bg-success/10 transition">
             <BookOpen size={16} /> User Guide
           </button>
           {!isPermanentOwner && <button onClick={() => setActiveScreen?.('pricing')} className="px-4 py-2 bg-primary text-white rounded-xl font-bold flex gap-2 items-center hover:bg-primary/90 transition shadow-[0_0_15px_rgba(139,92,246,0.3)]">
             <Crown size={16} /> Upgrade to Premium
           </button>}
        </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-lg font-bold flex items-center gap-2 text-white"><CheckSquare className="text-secondary" /> Standard Features (Free)</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeFeatures.map((f, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                key={i} 
                className="glass-card p-6 flex items-start gap-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-secondary/10 transition-all border border-border/50 hover:border-secondary/50 relative overflow-hidden group"
              >
                <div className="p-3 bg-surface/50 rounded-xl border border-border">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{f.name}</h3>
                  <p className="text-xs text-text-dim leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
         </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-lg font-bold flex items-center gap-2 text-primary"><Crown className="text-accent" /> Premium Features (CyberAmour Elite)</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((f, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                key={i} 
                className="glass-card p-6 flex items-start gap-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all border border-primary/30 bg-primary/5 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-8 -mt-8 blur-xl" />
                <div className="p-3 bg-black/40 rounded-xl border border-primary/30">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#00E5FF] mb-1">{f.name}</h3>
                  <p className="text-xs text-text-dim leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
         </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="mt-8 glass-card p-8 border border-border/50"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Connect with CyberAmour</h3>
            <p className="text-sm text-text-dim">Follow us for the latest cyber threat intelligence and updates.</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com/cyberamour" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-text-dim hover:text-primary transition-colors hover:-translate-y-1">
              <div className="p-3 bg-surface/80 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
                <Twitter size={20} />
              </div>
            </a>
            <a href="https://linkedin.com/company/cyberamour" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-text-dim hover:text-[#0A66C2] transition-colors hover:-translate-y-1">
              <div className="p-3 bg-surface/80 rounded-xl border border-border/50 hover:border-[#0A66C2]/50 transition-colors">
                <Linkedin size={20} />
              </div>
            </a>
            <a href="https://github.com/cyberamour" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-text-dim hover:text-white transition-colors hover:-translate-y-1">
              <div className="p-3 bg-surface/80 rounded-xl border border-border/50 hover:border-white/50 transition-colors">
                <Github size={20} />
              </div>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UserGuide({ setActiveScreen }: any) {
  const guideSections = [
    {
      title: "Cyber Forensics & Scanning",
      desc: "CyberAmour provides an extensive suite of AI-driven scanning capabilities. Whether it's investigating an IP address, validating an email, analyzing a file (hash), checking Crypto wallets, or dissecting a phishing SMS, our forensics module covers it all.",
      features: [
        "Select your scan type from the tabs.",
        "Enter the target data (IP, File Hash, Domain, Text message).",
        "Watch as CyberAmour AI investigates across OSINT and distinct intelligence feeds.",
        "[PREMIUM] Review preliminary data in the Interactive Findings Viewer and correct misidentifications before creating the final report."
      ],
      icon: <Search size={24} className="text-[#00E5FF]" />
    },
    {
      title: "Global Identity Search",
      desc: "Conduct authorized public-source cybersecurity research, review verifiable digital-exposure signals, and retain source references. No private-database access or unsupported personal profiling.",
      features: [
        "Navigate to 'Cyber Forensics' and scroll to 'Global Identity Search'.",
        "The system scans common platforms, checks forum registrations, and analyzes linked personas.",
        "[PREMIUM] Results are processed by our elite Elite Intelligence Analysis, uncovering hidden relational intelligence."
      ],
      icon: <UserSearch size={24} className="text-accent" />
    },
    {
      title: "Interactive Scan Pre-Report Insights",
      desc: "During deep forensic analysis, the system identifies all related metadata. CyberAmour grants you the power to filter the data interactively.",
      features: [
        "A Draft Results Panel will appear before generating the final comprehensive report.",
        "Use the chat interface to ask the AI to omit specific identities, filter false positives, or refocus the analysis.",
        "[PREMIUM] Fully interact with the raw findings to ensure the highest fidelity intelligence output."
      ],
      icon: <Settings size={24} className="text-success" />
    },
    {
      title: "Hardware Health & Diagnostics",
      desc: "Monitor your local device's security and performance metrics in real-time.",
      features: [
        "View CPU, RAM, Fan speed, and Temperature.",
        "[PREMIUM] Export your local device health diagnostics directly to a branded PDF, CSV, or TXT file for audit tracking."
      ],
      icon: <Smartphone size={24} className="text-[#3B82F6]" />
    },
    {
      title: "CyberAmour AI Assistant",
      desc: "Your personal, 24/7 incident response and threat analysis co-pilot.",
      features: [
        "Chat with the AI to summarize dense scan logs.",
        "Ask security recommendations to secure networks.",
        "Clear chats, regenerate advice, or use pre-populated forensic analysis questions."
      ],
      icon: <MessageSquare size={24} className="text-primary" />
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="text-center py-10 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3')] bg-cover bg-center rounded-2xl relative overflow-hidden border border-[#00E5FF]/20 shadow-[0_0_30px_rgba(0,229,255,0.1)]">
        <div className="absolute inset-0 bg-bg/90 backdrop-blur-sm" />
        <div className="relative z-10 px-6">
          <BookOpen size={48} className="text-success mx-auto mb-4 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">CyberAmour User Guide & Walkthrough</h2>
          <p className="text-text-dim text-sm max-w-lg mx-auto">Master advanced threat modeling and forensics capabilities with our step-by-step visual demonstration guide.</p>
        </div>
      </div>

      <div className="space-y-8 mt-6">
        {guideSections.map((section, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass-card p-6 border border-border/50 flex flex-col md:flex-row gap-6"
          >
            <div className="shrink-0 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-surface/80 border border-border flex items-center justify-center">
                 {section.icon}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{section.title}</h3>
              <p className="text-sm text-text-dim mb-4 leading-relaxed">{section.desc}</p>
              
              <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-3">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-text-main flex items-center gap-2"><PlayCircle size={14} /> How it works:</h4>
                 <ul className="space-y-2">
                   {section.features.map((feature, j) => {
                     const isPremium = feature.includes("[PREMIUM]");
                     return (
                       <li key={j} className="text-sm text-text-main flex items-start gap-2">
                         {isPremium ? <Crown size={14} className="text-primary shrink-0 mt-0.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-text-dim shrink-0 mt-2" />}
                         <span className={isPremium ? "text-[#A78BFA] font-medium" : ""}>
                           {feature.replace("[PREMIUM]", "").trim()}
                           {isPremium && <span className="ml-2 text-[9px] uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/30">Premium Function</span>}
                         </span>
                       </li>
                     );
                   })}
                 </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="glass-card p-8 text-center border-border/50 border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px]" />
        <h3 className="text-xl font-bold mb-3">Ready to unleash full potential?</h3>
        <p className="text-sm text-text-dim max-w-md mx-auto mb-6">Upgrade to CyberAmour Elite to unlock interactive feedback, global identity tracking, API limits extensions, and comprehensive diagnostics exporting.</p>
        <button onClick={() => setActiveScreen?.('pricing')} className="px-6 py-3 bg-primary text-white rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] font-bold tracking-wide hover:bg-primary/90 transition-colors mx-auto flex items-center gap-2">
          <Crown size={18} /> View Premium Plans
        </button>
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
      return { screen: 'scan', label: 'Open Cyber Forensics', icon: <Search size={14} className="mr-1.5" /> };
    }
    if (content.includes("dark web") || content.includes("breach") || content.includes("leak")) {
      return { screen: 'darkweb', label: 'Open Public Breach Intelligence', icon: <Ghost size={14} className="mr-1.5" /> };
    }
    if (content.includes("scan") || content.includes("phishing") || content.includes("url") || content.includes("forensics")) {
      return { screen: 'scan', label: 'Open Cyber Forensics', icon: <Search size={14} className="mr-1.5" /> };
    }
    if (content.includes("network") || content.includes("wifi") || content.includes("transaction") || content.includes("device") || content.includes("anomal")) {
      return { screen: 'network', label: 'Open Network & Device', icon: <Network size={14} className="mr-1.5" /> };
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

function LinkModal({ targetName, onConfirm, onCancel }: { targetName: string, onConfirm: (type: string) => void, onCancel: () => void }) {
  const types = ["Execution", "Persistence", "Traffic", "Modification", "Association"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><LinkIcon size={18} className="text-primary"/> Link to {targetName}</h3>
        <p className="text-sm text-text-dim mb-4">Select the relationship type:</p>
        <div className="flex flex-col gap-2">
          {types.map(t => (
            <button key={t} onClick={() => onConfirm(t)} className="px-4 py-2 bg-surface text-text-main border border-border rounded-lg hover:bg-primary/20 hover:border-primary transition-colors text-left text-sm font-semibold">{t}</button>
          ))}
        </div>
        <button onClick={onCancel} className="mt-4 w-full px-4 py-2 text-sm text-text-dim hover:text-white transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function CaseMatrixVisualization({ linkages, activeLinkSource, setActiveLinkSource, setShowLinkModal }: any) {
  const nodesMap = new Map();
  linkages.forEach((l: any) => {
    if (!nodesMap.has(l.sourceId)) nodesMap.set(l.sourceId, { id: l.sourceId, name: l.sourceName });
    if (!nodesMap.has(l.targetId)) nodesMap.set(l.targetId, { id: l.targetId, name: l.targetName });
  });
  const nodes = Array.from(nodesMap.values());
  const radius = 140;
  const center = { x: 300, y: 200 };

  return (
    <svg width="100%" height="100%" viewBox="0 0 600 400" className="absolute inset-0">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8B5CF6" />
        </marker>
      </defs>
      {linkages.map((l: any, i: number) => {
        const sourceIndex = nodes.findIndex(n => n.id === l.sourceId);
        const targetIndex = nodes.findIndex(n => n.id === l.targetId);
        
        const sourceAngle = (sourceIndex / nodes.length) * 2 * Math.PI - Math.PI/2;
        const targetAngle = (targetIndex / nodes.length) * 2 * Math.PI - Math.PI/2;
        
        const sx = center.x + radius * Math.cos(sourceAngle);
        const sy = center.y + radius * Math.sin(sourceAngle);
        const tx = center.x + radius * Math.cos(targetAngle);
        const ty = center.y + radius * Math.sin(targetAngle);
        
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;

        return (
          <g key={i}>
            <line x1={sx} y1={sy} x2={tx} y2={ty} stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
            <rect x={mx - 35} y={my - 12} width="70" height="20" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            <text x={mx} y={my + 2} fill="#94A3B8" fontSize="10" textAnchor="middle" fontWeight="bold">{l.type}</text>
          </g>
        );
      })}
      
      {nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI - Math.PI/2;
        const x = center.x + radius * Math.cos(angle);
        const y = center.y + radius * Math.sin(angle);
        const isActive = activeLinkSource?.id === node.id;
        const isTargetMode = activeLinkSource && !isActive;
        
        return (
          <g key={node.id} transform={`translate(${x},${y})`} onClick={() => {
            if (isTargetMode) {
               setShowLinkModal({ targetId: node.id, targetName: node.name });
            } else if (!activeLinkSource) {
               setActiveLinkSource(node);
            } else {
               setActiveLinkSource(null);
            }
          }} style={{cursor: 'pointer'}} className="transition-all hover:opacity-80">
            <circle r="22" fill={isActive ? "#8B5CF6" : "#1E293B"} stroke={isActive ? "#fff" : isTargetMode ? "#10B981" : "#8B5CF6"} strokeWidth={isActive || isTargetMode ? "3" : "2"} className={isTargetMode ? "animate-pulse" : ""} />
            <text y="40" fill={isActive ? "#fff" : "#94A3B8"} fontSize="12" textAnchor="middle" fontWeight="bold" className="capitalize">{node.name}</text>
            {isActive && <text y="-30" fill="#8B5CF6" fontSize="10" textAnchor="middle" fontWeight="bold" className="uppercase tracking-widest">Active Link Source</text>}
            {isTargetMode && <text y="-30" fill="#10B981" fontSize="10" textAnchor="middle" fontWeight="bold" className="uppercase tracking-widest">Click to Link</text>}
          </g>
        );
      })}
    </svg>
  );
}

function NetworkDeviceMonitor({ scanNetwork, scanDevice, monitorTransactions, profile, activeLinkSource, setActiveLinkSource, setShowLinkModal, linkages, setActiveScreen }: any) {
  const [packets, setPackets] = useState<any[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<any | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isScanningNetwork, setIsScanningNetwork] = useState(false);
  const [isScanningDevice, setIsScanningDevice] = useState(false);
  const [isMonitoringFin, setIsMonitoringFin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Live traffic data requires an installed sensor/agent; never synthesize packet counts.
  const packetVolumeData: any[] = [];

  const handleNetworkScan = async () => {
    import('./utils/sounds').then(s => s.playScanSound());
    setIsScanningNetwork(true);
    try {
      const result = await scanNetwork();
      setPackets(result.packets);
      setAnomalies(result.anomalies);
      if (result.anomalies && result.anomalies.length > 0) {
        import('./utils/sounds').then(s => s.playErrorSound());
      } else {
        import('./utils/sounds').then(s => s.playSuccessSound());
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Live network capture is not configured. No packet data was collected.');
      import('./utils/sounds').then(s => s.playErrorSound());
    }
    setIsScanningNetwork(false);
  };

  const handleDeviceScan = async () => {
    import('./utils/sounds').then(s => s.playScanSound());
    setIsScanningDevice(true);
    setErrorMsg(null);
    try {
      const result = await scanDevice();
      setThreats(result);
      if (result && result.length > 0) {
        import('./utils/sounds').then(s => s.playErrorSound());
      } else {
        import('./utils/sounds').then(s => s.playSuccessSound());
      }
    } catch (e: any) {
      if (e.message === 'LIMIT_REACHED') setErrorMsg("You've used your included device scans.");
      else setErrorMsg(e?.message || 'A real endpoint scanner is not configured. No device scan was performed.');
      import('./utils/sounds').then(s => s.playErrorSound());
    }
    setIsScanningDevice(false);
  };

  const handleFinMonitor = async () => {
    setIsMonitoringFin(true);
    try {
      const result = await monitorTransactions();
      setTransactions(Array.isArray(result) ? result : result?.transactions || []);
      if (result?.message) setErrorMsg(result.message);
    } catch (e: any) { setErrorMsg(e?.message || 'No financial data connector is configured.'); }
    setIsMonitoringFin(false);
  };

  const handleQuarantine = (index: number) => {
    const newThreats = [...threats];
    newThreats.splice(index, 1);
    setThreats(newThreats);
    import('./utils/sounds').then(s => s.playSuccessSound());
  };

  const handleClean = (index: number) => {
    const newThreats = [...threats];
    newThreats.splice(index, 1);
    setThreats(newThreats);
    import('./utils/sounds').then(s => s.playSuccessSound());
  };

  const handleDelete = (index: number) => {
    const newThreats = [...threats];
    newThreats.splice(index, 1);
    setThreats(newThreats);
    import('./utils/sounds').then(s => s.playSuccessSound());
  };

  const handleRectifyAll = () => {
    setThreats([]);
    import('./utils/sounds').then(s => s.playSuccessSound());
  };

  useEffect(() => {
    handleNetworkScan();
    handleDeviceScan();
    handleFinMonitor();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Network & Device Diagnostics</h2>
          <p className="text-sm text-text-dim mt-1">Browser-based diagnostics. Live packet capture and endpoint protection require a separately installed, trusted sensor or agent.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-badge bg-amber-500/10 text-amber-200 border-amber-500/30">
            <ShieldAlert size={14} className="mr-1" />
            Check local sensor below
          </div>
        </div>
      </div>

      <LocalSecuritySensor mode="all" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Network telemetry: never draw synthetic packet counts. */}
        <div className="glass-card p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <Activity className="text-primary" size={24} />
            <div>
              <h3 className="text-xl font-bold">Network Telemetry</h3>
              <p className="text-sm text-text-dim mt-1">No live packet source is connected to this browser session.</p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-text-dim">
            <strong className="text-amber-200">Waiting for real telemetry.</strong> Start the CyberAmour Local Security Sensor above and analyze a Wireshark PCAP/PCAPNG capture. This screen will not generate sample packet counts, claim traffic is safe, or report that traffic was blocked.
          </div>
        </div>

        {/* Case Matrix Graph Section */}
        <div className="glass-card p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3 justify-between">
             <div className="flex items-center gap-3">
                <Network className="text-primary" size={24} />
                <h3 className="text-xl font-bold">Case Matrix: 2D Network Graph</h3>
             </div>
          </div>
          <div className="relative w-full h-[400px] border border-border bg-surface/30 rounded-2xl overflow-hidden flex items-center justify-center">
            {linkages && linkages.length > 0 ? (
               <CaseMatrixVisualization linkages={linkages} activeLinkSource={activeLinkSource} setActiveLinkSource={setActiveLinkSource} setShowLinkModal={setShowLinkModal} />
            ) : (
               <div className="text-text-dim text-center space-y-2">
                 <LinkIcon size={32} className="mx-auto text-primary/30" />
                 <p className="text-sm font-bold">No active linkages detected.</p>
                 <p className="text-xs">Establish relationships from the Cyber Forensics tab to populate the semantic network.</p>
               </div>
            )}
          </div>
        </div>

        {/* Packet analysis / SIEM status. Actual PCAP processing is in LocalSecuritySensor above. */}
        <div className="glass-card p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <Network className="text-primary" size={24} />
            <div>
              <h3 className="text-xl font-bold">Packet Analysis & SIEM Integration</h3>
              <p className="text-sm text-text-dim mt-1">Real saved-capture analysis runs through TShark/Wireshark in the local sensor. Optional summaries can be forwarded to Splunk HEC.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4 space-y-2">
              <h4 className="font-bold text-sm">Wireshark / TShark</h4>
              <p className="text-xs text-text-dim">Open the Local Security Sensor panel above, connect it, select a saved PCAP/PCAPNG file, and choose “Analyze PCAP”. The report includes decoded protocol fields and Suricata alerts when available.</p>
              <a href="https://www.wireshark.org/download.html" target="_blank" rel="noreferrer" className="text-xs text-primary underline">Official Wireshark download</a>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <h4 className="font-bold text-sm">Splunk HTTP Event Collector</h4>
              <p className="text-xs text-text-dim">Splunk is not running inside GitHub Pages. Configure an authorized Splunk HEC URL and token in the local sensor’s private .env file to forward summarized events. Raw packets and file contents are not sent.</p>
              <a href="https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector" target="_blank" rel="noreferrer" className="text-xs text-primary underline">Splunk HEC documentation</a>
            </div>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-100">
            No live traffic capture, automatic IP isolation, or traffic blocking is enabled by this web app. Use your operating-system firewall or a separately deployed, authorized IDS/IPS for enforcement.
          </div>
        </div>

          <div className="p-4 bg-bg/50 rounded-xl border border-border/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim">DDoS & Botnet Shield</h4>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary" />
                <span>Session Hijacking Detection</span>
              </div>
              <span className="text-amber-200 font-bold">NOT CONNECTED</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ZapOff size={14} className="text-danger" />
                <span>DoS / DDoS Prevention</span>
              </div>
              <span className="text-amber-200 font-bold">NOT CONFIGURED</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Crosshair size={14} className="text-accent" />
                <span>Botnet Node Blocking</span>
              </div>
              <span className="text-accent font-bold">NO BLOCKING ACTION</span>
            </div>
          </div>

        {/* Device & Malware Section */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="text-primary" size={24} />
              <h3 className="text-xl font-bold">Endpoint Protection & Antivirus</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveScreen('antivirus')}
                className="text-xs bg-[#1E293B] border border-[#334155] text-white px-3 py-1.5 rounded-full hover:bg-[#334155] transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert size={12} className="text-primary" />
                Antivirus & File Scan
              </button>
              {!profile?.isPremium && !profile?.isOwner && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">PREMIUM</span>}
              <button 
                onClick={handleDeviceScan}
                disabled={isScanningDevice}
                className="p-2 hover:bg-surface rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={cn(isScanningDevice && "animate-spin")} />
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm font-medium flex justify-between items-center"
              >
                <div>{errorMsg}</div>
                {setActiveScreen && !profile?.isPremium && !profile?.isOwner && (
                  <button onClick={() => setActiveScreen('pricing')} className="px-4 py-2 bg-danger text-white rounded-lg text-xs font-bold hover:bg-danger/80 transition uppercase tracking-widest ml-4 whitespace-nowrap">Upgrade Now</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {threats.length === 0 ? (
              <div className="space-y-4">
                <div className="p-8 text-center bg-success/5 border border-success/20 rounded-2xl">
                  <ShieldCheck size={32} className="text-success mx-auto mb-2" />
                  <p className="text-sm font-bold text-amber-200">Endpoint scan not performed.</p><p className="text-xs text-text-dim mt-2">Connect the local sensor and use the file scanner above, or install a trusted endpoint security product. This browser cannot inspect the full device.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border/50 pb-2 flex-grow mr-4">Threats Detected ({threats.length})</h4>
                  <button 
                    onClick={handleRectifyAll}
                    className="text-[10px] font-black uppercase tracking-widest bg-success text-black px-3 py-1.5 rounded hover:bg-success/80 transition-all flex items-center gap-1 min-w-max"
                  >
                    <ShieldCheck size={12} />
                    Dismiss displayed findings
                  </button>
                </div>
                {threats.map((t, i) => (
                  <div key={i} className="p-4 bg-danger/5 border border-danger/20 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldAlert size={20} className="text-danger" />
                        <div>
                          <div className="text-sm font-bold">{t.name}</div>
                          <div className="text-[10px] text-text-dim">{t.path || t.type}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest bg-danger text-white px-2 py-1 rounded">
                        {t.risk} Risk
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleClean(i)}
                        className="text-[10px] font-black uppercase tracking-widest bg-surface hover:bg-white/10 text-text-main px-3 py-1.5 rounded transition-all"
                        title="Removes this finding from the current UI only; does not modify a file"
                      >
                        Dismiss finding
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-bg/50 rounded-xl border border-border/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim">Endpoint Protection</h4>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary" />
                <span>Full-device antivirus</span>
              </div>
              <span className="text-accent font-bold">NO BLOCKING ACTION</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Network size={14} className="text-[#F59E0B]" />
                <span>Operating-system firewall</span>
              </div>
              <span className="text-amber-200 font-bold">NOT VERIFIED</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <EyeOff size={14} className="text-accent" />
                <span>Installed-app permission monitoring</span>
              </div>
              <span className="text-accent font-bold">NO BLOCKING ACTION</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ZapOff size={14} className="text-danger" />
                <span>Ransomware protection</span>
              </div>
              <span className="text-accent font-bold">NO BLOCKING ACTION</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-[#3B82F6]" />
                <span>Endpoint behaviour monitoring</span>
              </div>
              <span className="text-amber-200 font-bold">NOT VERIFIED</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard className="text-primary" size={24} />
              <h3 className="text-xl font-bold">Financial Fraud Monitor</h3>
            </div>
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="p-3 bg-surface/50 rounded-xl border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      t.status === 'Fraudulent' ? "bg-danger/20 text-danger" : "bg-success/20 text-success"
                    )}>
                      {t.status === 'Fraudulent' ? <AlertTriangle size={16} /> : <Check size={16} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.merchant}</div>
                      <div className="text-[10px] text-text-dim">{t.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{t.amount}</div>
                    <div className={cn(
                      "text-[10px] font-bold uppercase",
                      t.status === 'Fraudulent' ? "text-danger" : "text-success"
                    )}>
                      {t.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedPacket && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }} 
              className="bg-surface w-full max-w-2xl rounded-2xl border border-border/50 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-2">
                   <Network size={18} className="text-primary" />
                   <h3 className="font-bold text-lg">Packet Analysis</h3>
                 </div>
                 <button onClick={() => setSelectedPacket(null)} className="p-2 hover:bg-white/5 rounded-full text-text-dim hover:text-white transition-colors">
                   <X size={18} />
                 </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 bg-black/20 p-4 rounded-xl border border-border/50 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-dim block mb-1">Source IP</label>
                    <div className="font-mono text-sm">{selectedPacket.source}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-dim block mb-1">Destination IP</label>
                    <div className="font-mono text-sm">{selectedPacket.dest}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-dim block mb-1">Protocol</label>
                    <div className="font-mono text-sm text-primary">{selectedPacket.protocol}</div>
                  </div>
                   <div>
                    <label className="text-[10px] uppercase font-bold text-text-dim block mb-1">Size</label>
                    <div className="font-mono text-sm">{selectedPacket.size}</div>
                  </div>
                   <div>
                    <label className="text-[10px] uppercase font-bold text-text-dim block mb-1">Status</label>
                    <div className={cn("font-mono text-sm font-bold", 
                      selectedPacket.status === 'Safe' ? "text-success" : 
                      selectedPacket.status === 'SessionHijack' ? "text-danger" :
                      selectedPacket.status === 'Suspicious' ? "text-accent" : "text-danger"
                    )}>
                      {selectedPacket.status === 'SessionHijack' ? 'HIJACK ATTEMPT' : selectedPacket.status}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-[#F59E0B] flex items-center gap-2">
                      <Search size={14} />
                      Packet Header Preview (No live capture)
                   </h4>
                   <div className="bg-black p-4 rounded-xl border border-border/50 font-mono text-xs text-[#a0a0a0] max-h-48 overflow-y-auto whitespace-pre-wrap">
                     {selectedPacket.headers || JSON.stringify({
                        "Eth_Source": "aa:bb:cc:dd:ee:ff",
                        "Eth_Dest": "11:22:33:44:55:66",
                        "IP_Version": "4",
                        "IP_TTL": "64",
                        "TCP_Flags": "PSH, ACK",
                        "TCP_Seq": "135112",
                        "TCP_Ack": "85934"
                     }, null, 2)}
                   </div>
                </div>

                <div className="space-y-2">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Terminal size={14} />
                      Packet Payload (Hex Dump)
                   </h4>
                   <div className="bg-black p-4 rounded-xl border border-border/50 font-mono text-xs text-[#a0a0a0] max-h-64 overflow-y-auto whitespace-pre-wrap">
                      {selectedPacket?.payload || Array.from({ length: 8 }).map((_, i) => {
                        const offset = (i * 16).toString(16).padStart(4, '0');
                        const hex = 'No live packet payload available';
                        const ascii = Array.from({ length: 16 }).map(() => {
                           const c = 0;
                           return c > 32 && c < 127 ? String.fromCharCode(c) : '.';
                        }).join('');
                        return `${offset}  ${hex.substring(0, 23)}  ${hex.substring(24)}  |${ascii}|`;
                      }).join('\n')}
                   </div>
                </div>

                <div className="space-y-2">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-danger flex items-center gap-2">
                      <Terminal size={14} />
                      Packet Payload (Hex)
                   </h4>
                   <div className="bg-black p-4 rounded-xl border border-border/50 font-mono text-xs text-[#4ADE80] max-h-48 overflow-y-auto break-all">
                     {selectedPacket.payloadHex || "00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F  ................\n10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F  ................"}
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DarkWebMonitor({ profile, breaches, scans, scanDarkWeb, setActiveScreen, askAI }: any) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentPhases, setCurrentPhases] = useState<string[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [selectedExposure, setSelectedExposure] = useState<any>(null);
  const isPremium = profile?.isPremium;

  const handleScan = async () => {
    import('./utils/sounds').then(s => s.playScanSound());
    setIsScanning(true);
    setScanError('');
    setScanProgress(0);

    const phases = ["Submitting authorized account identifier...", "Searching indexed public breach notifications...", "Verifying source references...", "Preparing evidence-based summary..."];
    setCurrentPhases(phases);
    setCurrentPhaseIndex(0);

    setScanProgress(0);
    setCurrentPhaseIndex(0);

    try {
      const result = await scanDarkWeb();
      setScanProgress(100);
      setCurrentPhaseIndex(Math.max(0, phases.length - 1));
      setScanResult(result);
      if (result && result.findings && result.findings.length > 0) {
        import('./utils/sounds').then(s => s.playErrorSound());
      } else {
        import('./utils/sounds').then(s => s.playSuccessSound());
      }
    } catch (error: any) {
      console.error('Public breach intelligence search failed', error);
      setScanError(error?.message || 'The public-source search failed. No conclusion about exposure can be drawn.');
      setScanResult(null);
      import('./utils/sounds').then(s => s.playErrorSound());
    } finally {
      setTimeout(() => setIsScanning(false), 500);
    }
  };

  const darkWebBreaches = breaches.filter((b: any) => b.isDarkWeb || Boolean(b.sourceUrl));
  const darkWebScans = scans.filter((s: any) => s.type === 'darkweb' || s.type === 'public-breach-intelligence').sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isForensicsUnlocked = profile?.hasForensicsReport === true || profile?.isPremium === true || profile?.isOwner === true;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Public Breach Intelligence</h2>
          <p className="text-sm text-text-dim mt-1">AI-powered identity exposure detection.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mt-8 p-6 glass-card border-[#8B5CF6]/30 bg-[#8B5CF6]/5 rounded-2xl gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#8B5CF6]/20 rounded-xl">
            <Zap className="text-[#8B5CF6]" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Public Breach Intelligence Report</h3>
            <p className="text-sm text-text-dim">A search-grounded review of indexed public breach notices and cybersecurity reporting. Results are not exhaustive and do not establish that an account is safe.</p>
          </div>
        </div>
        <div>
          {isForensicsUnlocked ? (
            <button onClick={() => { const report = { product: 'CyberAmour Public Breach Intelligence', generatedAt: new Date().toISOString(), summary: scanResult?.summary || 'No scan summary available.', findings: darkWebBreaches.map((b: any) => ({ source: b.source, sourceUrl: b.sourceUrl || null, date: b.breachDate || null, riskLevel: b.riskLevel || 'Unverified', details: b.details || '', actionableSteps: b.actionableSteps || [] })), limitations: ['Public-source search is not exhaustive and does not access private dark-web forums.', 'Verify each source before taking action.'] }; const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'cyberamour-public-breach-intelligence-report.json'; link.click(); URL.revokeObjectURL(url); }} className="px-6 py-3 bg-[#8B5CF6] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#8B5CF6]/80 transition-colors whitespace-nowrap">
              <CheckCircle2 size={18} /> Export Report
            </button>
          ) : (
            <button onClick={() => setActiveScreen('pricing')} className="px-6 py-3 border border-[#8B5CF6] text-[#8B5CF6] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#8B5CF6]/10 transition-colors whitespace-nowrap">
              <Lock size={18} /> Unlock Feature
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="glass-card flex-1 p-6 flex items-center justify-between border-danger/30 bg-danger/5">
          <div>
            <p className="text-sm text-text-dim uppercase tracking-widest font-bold">Recorded Findings</p>
            <h3 className="text-4xl font-black text-danger mt-1">{darkWebBreaches.length}</h3>
          </div>
          <AlertTriangle className="text-danger opacity-50" size={48} />
        </div>
        
        <div className="flex flex-col justify-end">
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isScanning ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
            {isScanning ? "Searching public sources..." : "Search Public Sources"}
          </button>
        </div>
      </div>

      {scanError && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{scanError}</div>}

      {isScanning && (
            <div className="w-full flex-col items-center mt-4 p-4 bg-surface/50 border border-border rounded-xl">
               <div className="flex justify-between items-end mb-2">
                 <div className="space-y-1">
                   <h3 className="text-sm font-bold text-white flex items-center gap-2">
                     <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                       <Search size={14} className="text-primary" />
                     </motion.div>
                     Searching indexed public sources...
                   </h3>
                 </div>
                 <div className="text-right">
                   <span className="text-[10px] uppercase font-bold text-text-dim block mb-1">Waiting for live search response</span>
                 </div>
               </div>
               
               <div className="flex w-full gap-1 h-1.5 rounded-full overflow-hidden mb-4">
                 {currentPhases.map((_, idx) => {
                    const phaseSize = 100 / currentPhases.length;
                    const start = idx * phaseSize;
                    const phaseProgress = Math.max(0, Math.min(100, ((scanProgress - start) / phaseSize) * 100));
                    
                    return (
                      <div key={idx} className="flex-1 bg-surface border border-border relative overflow-hidden rounded-full">
                        <motion.div 
                          className={cn(
                            "absolute left-0 top-0 bottom-0 bg-gradient-to-r",
                            idx < currentPhases.length - 1 ? "from-primary to-[#A78BFA]" : "from-success to-[#34D399]"
                          )}
                          initial={{ width: "0%" }}
                          animate={{ width: `${phaseProgress}%` }}
                          transition={{ ease: "linear" }}
                        />
                      </div>
                    );
                 })}
               </div>
               
               <div className="mt-4 space-y-3">
                 {currentPhases.map((phase, idx) => {
                    const isActive = currentPhaseIndex === idx;
                    const isCompleted = currentPhaseIndex > idx;
                    return (
                        <div key={idx} className={cn(
                          "flex items-center gap-3 transition-all duration-300 p-2 rounded-lg",
                          isCompleted ? "opacity-100" : isActive ? "opacity-100 scale-105 origin-left bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]" : "opacity-40"
                        )}>
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-300 shadow-md",
                            isCompleted ? "bg-success/20 border-success text-success" : isActive ? "bg-primary/20 border-primary text-primary" : "bg-surface border-border text-border"
                          )}>
                            {isCompleted ? (
                              <Check size={12} strokeWidth={3} />
                            ) : isActive ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                <Loader size={12} />
                              </motion.div>
                            ) : (
                              <span className="text-[10px] font-bold">{idx + 1}</span>
                            )}
                          </div>
                          <span className={cn("text-xs font-bold transition-colors duration-300 tracking-wide", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" : "text-text-main")}>
                            {phase}
                          </span>
                        </div>
                    )
                 })}
               </div>
            </div>
          )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-2">
          <div className="text-text-dim text-xs font-bold uppercase tracking-widest">Exposures Found</div>
          <div className="text-4xl font-black text-danger">{darkWebBreaches.length}</div>
          <p className="text-[10px] text-text-dim">Source-backed records saved from prior searches</p>
        </div>
        <div className="glass-card p-6 space-y-2">
          <div className="text-text-dim text-xs font-bold uppercase tracking-widest">Monitored Email</div>
          <div className="text-xl font-bold truncate">{profile?.email}</div>
          <p className="text-[10px] text-amber-200 font-bold uppercase tracking-widest">On-demand only · no background monitoring</p>
        </div>
        <div className="glass-card p-6 space-y-2">
          <div className="text-text-dim text-xs font-bold uppercase tracking-widest">Last Scan</div>
          <div className="text-xl font-bold">{darkWebScans.length > 0 ? new Date(darkWebScans[0].createdAt).toLocaleDateString() : 'Never'}</div>
          <p className="text-[10px] text-text-dim">Search frequency: user-initiated</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertCircle size={20} className="text-danger" />
            Exposure Details
          </h3>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
            {darkWebBreaches.length === 0 ? (
              <div className="glass-card p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} className="text-text-dim" />
                </div>
                <p className="text-text-dim italic text-sm">No source-backed findings are currently saved. This may mean no findings were returned, no successful search has completed, or the provider was unavailable. It is not evidence that the account is safe.</p>
              </div>
            ) : (
              darkWebBreaches.map((b: any, idx: number) => (
                  <div 
                    key={b.id || idx} 
                    className={cn(
                      "glass-card p-5 border-l-4 transition-all cursor-pointer",
                      b.riskLevel === 'Critical' ? "border-l-danger" : b.riskLevel === 'High' ? "border-l-[#F59E0B]" : b.riskLevel === 'Medium' ? "border-l-accent" : "border-l-success",
                      selectedExposure?.id === b.id ? "bg-surface ring-1 ring-border shadow-xl space-y-6" : "hover:bg-surface/50"
                    )} 
                    onClick={() => setSelectedExposure(selectedExposure?.id === b.id ? null : b)}
                  >
                    <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full",
                        b.riskLevel === 'Critical' ? "bg-danger" : 
                        b.riskLevel === 'High' ? "bg-[#F59E0B]" : 
                        b.riskLevel === 'Medium' ? "bg-accent" : "bg-success"
                      )} />
                      <div>
                        <h4 className="font-bold text-base leading-tight">{b.source}</h4>
                        <p className="text-[10px] text-text-dim mt-0.5">{new Date(b.breachDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                      b.riskLevel === 'Critical' ? "bg-danger/20 text-danger" : b.riskLevel === 'High' ? "bg-[#F59E0B]/20 text-[#F59E0B]" : b.riskLevel === 'Medium' ? "bg-accent/20 text-accent" : "bg-success/20 text-success"
                    )}>
                      {b.riskLevel === 'Critical' && <Skull size={10} />}
                      {b.riskLevel === 'High' && <AlertTriangle size={10} />}
                      {(b.riskLevel !== 'Critical' && b.riskLevel !== 'High') && <AlertCircle size={10} />}
                      {b.riskLevel}
                    </span>
                  </div>
                    <p className={cn(
                      "text-xs leading-relaxed bg-bg/30 p-3 rounded-lg border border-border/50",
                      selectedExposure?.id === b.id ? "text-text-main line-clamp-none mt-4" : "text-text-main/80 line-clamp-2"
                    )}>
                      {b.details}
                    </p>

                    {selectedExposure?.id !== b.id && b.dataTypesExposed && b.dataTypesExposed.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {b.dataTypesExposed.slice(0, 3).map((dataType: string, idx: number) => (
                          <span key={idx} className="bg-surface/50 text-text-dim border border-border/50 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {dataType}
                          </span>
                        ))}
                        {b.dataTypesExposed.length > 3 && (
                          <span className="bg-surface/50 text-text-dim border border-border/50 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            +{b.dataTypesExposed.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <AnimatePresence>
                      {selectedExposure?.id === b.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-4 space-y-6 border-t border-border/50 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {b.dataTypesExposed && b.dataTypesExposed.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                                <AlertTriangle size={16} className="text-[#F59E0B]" />
                                Compromised Data Types
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {b.dataTypesExposed.map((dataType: string, idx: number) => (
                                  <span key={idx} className="bg-danger/10 border border-danger/20 text-danger text-xs font-bold px-3 py-1.5 rounded-full">
                                    {dataType}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {b.actionableSteps && b.actionableSteps.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-success" />
                                Recommended Action Plan
                              </h4>
                              <div className="bg-success/5 border border-success/20 rounded-xl p-4 space-y-3">
                                {b.actionableSteps.map((step: string, idx: number) => (
                                  <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-border bg-surface text-success focus:ring-success focus:ring-offset-surface" />
                                    <span className="text-sm text-text-main leading-relaxed group-hover:text-white transition-colors">{step}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          <AIInsightBox data={b} contextKey={`darkweb-exposure-${b.id || b.source}`} askAI={askAI} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity size={20} className="text-primary" />
            Scan History
          </h3>
          
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-hide border border-border/50 rounded-2xl bg-surface/30 p-1">
            {darkWebScans.length === 0 ? (
              <div className="glass-card p-12 text-center space-y-4 shadow-none border-none">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto">
                  <Search size={32} className="text-text-dim" />
                </div>
                <p className="text-text-dim italic text-sm">No scan history available.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface/50 border-b border-border/50 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim">Date</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim">Summary</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim">Number of Findings</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
              {darkWebScans.map((s: any) => (
                <tr 
                  key={s.id} 
                  onClick={() => setSelectedScan(s)}
                  className="hover:bg-bg/50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">{new Date(s.createdAt).toLocaleString()}</span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="text-xs text-text-dim leading-relaxed italic truncate">
                      "{s.summary}"
                    </p>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                        {s.findingsCount}
                      </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                      {s.maxRisk ? (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                          s.maxRisk === 'Critical' ? "bg-danger/20 text-danger" : s.maxRisk === 'High' ? "bg-[#F59E0B]/20 text-[#F59E0B]" : s.maxRisk === 'Medium' ? "bg-accent/20 text-accent" : "bg-success/20 text-success"
                        )}>
                          {s.maxRisk === 'Critical' && <Skull size={10} />}
                          {s.maxRisk === 'High' && <AlertTriangle size={10} />}
                          {s.maxRisk === 'Medium' && <AlertCircle size={10} />}
                          {s.maxRisk === 'Low' && <CheckCircle2 size={10} />}
                          {s.maxRisk}
                        </span>
                      ) : (
                        <span className="text-text-dim text-xs">-</span>
                      )}
                  </td>
                </tr>
              ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* exposure details modal removed since they're shown inline */}

      <AnimatePresence>
        {selectedScan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedScan(null)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
                <div>
                  <h3 className="text-xl font-bold">Scan Details</h3>
                  <p className="text-xs text-text-dim">{new Date(selectedScan.createdAt).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedScan(null)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <XCircle size={24} className="text-text-dim" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">AI Summary</h4>
                  <p className="text-sm italic leading-relaxed">"{selectedScan.summary}"</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim">Detailed Findings ({selectedScan.findingsCount})</h4>
                  <div className="space-y-3">
                    {selectedScan.findings?.map((f: any, i: number) => (
                      <div key={i} className="p-4 bg-bg/50 border border-border/50 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm">{f.source}</div>
                            <div className="text-[10px] text-text-dim">Breach Date: {f.date}</div>
                          </div>
                          <span className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border",
                            f.riskLevel === 'Critical' ? "bg-danger/20 text-danger border-danger/30" : f.riskLevel === 'High' ? "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30" : f.riskLevel === 'Medium' ? "bg-accent/20 text-accent border-accent/30" : "bg-success/20 text-success border-success/30"
                          )}>
                            {f.riskLevel === 'Critical' && <Skull size={10} />}
                            {f.riskLevel === 'High' && <AlertTriangle size={10} />}
                            {f.riskLevel === 'Medium' && <AlertCircle size={10} />}
                            {f.riskLevel === 'Low' && <CheckCircle2 size={10} />}
                            {f.riskLevel} Risk
                          </span>
                        </div>
                        <p className="text-xs text-text-main/80 leading-relaxed bg-surface/50 p-3 rounded-xl border border-border/30">
                          {f.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-surface/50 flex justify-end">
                <button 
                  onClick={() => setSelectedScan(null)}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 text-text-main font-bold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
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
        'Access to configured forensic and OSINT tools',
        'On-demand public-source breach intelligence searches',
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
      
      {/* One-Time In-App Purchases */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-sm font-bold text-text-dim uppercase tracking-widest mb-4">One-Time Premium Unlocks (IAP)</h3>
        <div className="glass-card p-6 border-[#8B5CF6]/30 bg-[#8B5CF6]/5 flex flex-col items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
            <div className="space-y-2 flex-1">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Zap className="text-[#8B5CF6]" /> Public Breach Intelligence Report
              </h4>
              <p className="text-sm text-text-dim">A search-grounded review of indexed public breach notices and cybersecurity reporting. Results are not exhaustive and do not establish that an account is safe.</p>
            </div>
            {profile?.hasForensicsReport ? (
              <div className="px-6 py-3 bg-[#10B981]/20 text-[#10B981] font-bold rounded-xl flex items-center gap-2">
                <Check size={18} /> Unlocked
              </div>
            ) : (
              <div className="flex flex-col items-end gap-3 min-w-[240px]">
                 <span className="text-2xl font-black mb-1">$4.99 <span className="text-sm text-text-dim font-normal">one-time</span></span>
                 
                 {/* Card Payment Button */}
                 <button 
                    disabled={processing}
                    onClick={() => {
                        setProcessing(true);
                        setTimeout(() => {
                           upgrade('forensics');
                           setProcessing(false);
                        }, 1500);
                    }}
                    className="w-full py-3 bg-[#635BFF] text-white font-bold rounded-xl hover:bg-[#635BFF]/90 transition-colors flex items-center justify-center gap-2"
                 >
                   <CreditCard size={18} /> {processing ? 'Processing...' : 'Pay with Card (Stripe)'}
                 </button>
                 
                 <div className="flex w-full gap-2 mt-2">
                    <input 
                      type="text"
                      placeholder="Activation Code"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value)}
                      className="flex-1 bg-surface border border-border rounded-xl px-3 text-xs focus:outline-none focus:border-[#8B5CF6]"
                    />
                    <button 
                      disabled={processing || !activationCode.trim()}
                      onClick={handleActivation}
                      className="px-3 bg-surface border border-border rounded-xl text-xs font-bold hover:border-[#8B5CF6] transition-colors"
                    >
                      Redeem
                    </button>
                 </div>
                 {activationError && <p className="text-danger text-[10px] mt-1 text-right w-full">{activationError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-12 glass-card p-6 border-[#10B981]/30 bg-[#10B981]/5 max-w-4xl mx-auto mt-10">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="text-[#10B981]" /> Direct Bank Transfer (Alternative)
        </h3>
        <p className="text-sm text-text-dim mb-4">
          You can also pay for the premium version directly to our bank account. After payment, please send an email to <a href="mailto:tongaigodfreymapiye@gmail.com" className="text-primary hover:underline">tongaigodfreymapiye@gmail.com</a> with your proof of payment. You will receive an activation code to unlock your premium access.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-surface/60 border border-border p-4 rounded-xl space-y-2 font-mono text-sm max-w-lg">
            <div className="flex justify-between">
              <span className="text-text-dim">Account Name:</span>
              <span className="font-bold">Tongai Godfrey Mapiye</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Account Number:</span>
              <span className="font-bold">18601759370</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Bank name:</span>
              <span className="font-bold">First Capital Bank</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Swift Code:</span>
              <span className="font-bold">BARCZWHX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Bank Branch:</span>
              <span className="font-bold">Msasa, Harare, Zimbabwe</span>
            </div>
          </div>

          <div className="bg-surface/60 border border-border p-4 rounded-xl space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#10B981]">Have an activation code?</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="Enter Code"
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#10B981]"
              />
              <button 
                onClick={handleActivation}
                disabled={!activationCode.trim()}
                className="bg-[#10B981] text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Activate
              </button>
            </div>
            {activationError && <p className="text-danger text-xs">{activationError}</p>}
          </div>
        </div>
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
  
  const handleGenerateCode = async (tier: 'premium' | 'business' | 'forensics') => {
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
          <h2 className="text-2xl font-bold tracking-tight">Admin Queue: Forensic Reviews & Approvals</h2>
          <p className="text-sm text-text-dim mt-1">Review accounts and generate manual activation codes.</p>
        </div>
      </div>
      
      <div className="glass-card p-6 border-accent/30 bg-surface/50 mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings size={18} className="text-accent" /> Offline Code Generation</h3>
        <p className="text-sm text-text-dim mb-4">Generate 16-digit alphanumeric activation codes for Premium/Business subscriptions or 12-digit codes specifically for Forensics Reports. Optionally link the code to a specific customer's email.</p>
        
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
          <button 
             onClick={() => handleGenerateCode('forensics')}
             disabled={generatingCode}
             className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-purple-600/80 transition-colors"
          >
             {generatingCode ? 'Generating...' : 'Forensics Report'}
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
          <div className="mt-2 text-sm uppercase tracking-widest font-black text-danger/50">Querying Forensic Base</div>
        </div>
      ) : usersQueue.length === 0 ? (
        <div className="glass-card p-12 text-center text-text-dim border-border/50">
          <ShieldCheck size={48} className="mx-auto mb-4 text-success/50" />
          <h3 className="text-xl font-bold mb-2 text-white">Queue is Empty</h3>
          <p>No users pending review. The ecosystem is secure.</p>
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
              
              <div className="mt-6 p-4 bg-[#0F172A]/80 border border-border rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-text-dim uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-primary" /> Forensics Engine
                </h4>
                
                {u.osintVerdict ? (
                  <>
                    <div className="flex gap-2 text-sm">
                      <span className="text-text-dim min-w-[80px]">Verdict:</span>
                      <strong className={u.osintVerdict === 'Malicious' || u.osintVerdict === 'Suspicious' ? 'text-danger' : 'text-success'}>
                        {u.osintVerdict}
                      </strong>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-text-dim min-w-[80px]">Details:</span>
                      <span className="text-text-main/90 leading-relaxed font-mono whitespace-pre-wrap">{u.osintReason}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-text-dim italic">Awaiting AI Forensics analysis...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CyberNewsFeed({ createAlert, askAI }: { createAlert: any, askAI?: any }) {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const latestNewsIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    let interval: any;
    let isMounted = true;

    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://hn.algolia.com/api/v1/search_by_date?query=cybersecurity+OR+breach+OR+hack&tags=story');
        const data = await res.json();
        const formattedNews = data.hits.map((hit: any) => ({
          id: hit.objectID,
          title: hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          date: new Date(hit.created_at).toLocaleString(),
          source: hit.url ? new URL(hit.url).hostname : 'Hacker News',
          summary: 'Analyzing threat intelligence context...'
        }));
        const topNews = formattedNews.slice(0, 4);

        if (topNews.length > 0) {
           const newestItem = topNews[0];
           if (latestNewsIdRef.current && latestNewsIdRef.current !== newestItem.id) {
               // New story detected!
               createAlert("Global Cyberattack Reported", newestItem.title, "high");
           }
           latestNewsIdRef.current = newestItem.id;
        }

        if (isMounted) setNews(topNews);

        // Generate AI summaries if available
        if (askAI && topNews.length > 0 && isMounted) {
          const summariesPrompt = `Please write a very brief 1-2 sentence professional overview summary for each of these cybersecurity news headlines:\n${topNews.map((n: any, i: number) => `${i+1}. ${n.title}`).join('\n')}\n\nFormat your response as a JSON array of strings corresponding to the headlines. ONLY respond with the JSON array, make sure it is a valid JSON array. For example: ["Summary 1", "Summary 2", "Summary 3", "Summary 4"]`;
          
          try {
            const aiResponse = await askAI(summariesPrompt, true);
            const summariesMatch = aiResponse.match(/\[.*\]/s);
            if (summariesMatch) {
              const summaries = JSON.parse(summariesMatch[0]);
              if (Array.isArray(summaries) && summaries.length === topNews.length && isMounted) {
                setNews(prev => prev.map((item, i) => ({
                  ...item,
                  summary: summaries[i] || item.summary
                })));
              }
            }
          } catch (e) {
            console.error("Failed to generate AI summaries", e);
            if (isMounted) {
               setNews(prev => prev.map(item => ({
                 ...item,
                 summary: "Recent developments in the global cybersecurity and digital landscape."
               })));
            }
          }
        } else if (isMounted) {
           setNews(prev => prev.map(item => ({
             ...item,
             summary: "Recent developments in the global cybersecurity landscape."
           })));
        }

      } catch (err) {
        console.error(err);
      }
      if (isMounted) setLoading(false);
    };

    if (liveMode) {
      fetchNews();
      interval = setInterval(fetchNews, 3600000); // 1 hour refresh
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [liveMode, askAI, createAlert]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Live Threat Map Card */}
      <div className="glass-card p-6 space-y-4 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Globe className="text-primary" /> Live Threat Map
          </h3>
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-text-dim uppercase tracking-widest">Live Map</span>
             <button 
               onClick={() => setLiveMode(!liveMode)}
               className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none", liveMode ? "bg-success" : "bg-surface border border-border")}
             >
               <span className={cn("inline-block w-4 h-4 transform rounded-full bg-white transition-transform", liveMode ? "translate-x-6" : "translate-x-1")} />
             </button>
          </div>
        </div>
        
        {liveMode ? (
          <div className="w-full flex-1 min-h-[350px] rounded-xl overflow-hidden border border-border/50 relative">
            <div className="absolute inset-0 bg-bg/50 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
               <span className="text-primary font-bold animate-pulse">Establishing secure connection...</span>
            </div>
            <iframe 
              src="https://threatmap.checkpoint.com/" 
              className="w-full h-full absolute inset-0 z-20"
              frameBorder="0"
              title="Live Threat Map"
              onLoad={(e) => {
                (e.target as HTMLIFrameElement).previousElementSibling?.remove();
              }}
            />
          </div>
        ) : (
          <div className="w-full flex-1 min-h-[350px] rounded-xl overflow-hidden border border-border/50 flex flex-col items-center justify-center bg-surface/30">
             <Globe className="text-text-dim mb-4" size={48} />
             <p className="text-text-dim text-sm font-medium">Map offline. Enable Live Mode to view global threats.</p>
          </div>
        )}
      </div>

      {/* Cyber News Feed Card */}
      <div className="glass-card p-6 space-y-4 flex flex-col h-[450px]">
        <h3 className="text-xl font-bold flex items-center gap-2">
           <Activity className="text-accent" /> Worldwide Threat Intelligence
        </h3>
        
        <div className="space-y-3 pt-2 overflow-y-auto pr-2 scrollbar-hide flex-1">
          {loading && news.length === 0 ? (
            <div className="h-full flex items-center justify-center">
               <div className="text-sm border border-primary/20 bg-primary/10 text-primary px-4 py-2 rounded-full animate-pulse flex items-center gap-2">
                 <RefreshCw size={14} className="animate-spin" /> Fetching global intelligence...
               </div>
            </div>
          ) : (
            news.map((item) => (
               <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-surface/50 hover:bg-surface border border-border/50 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(0,229,255,0.1)] rounded-xl transition-all group">
                 <div className="flex justify-between items-start mb-2">
                   <h4 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors leading-tight line-clamp-2">{item.title}</h4>
                   <ArrowRight size={14} className="text-text-dim group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-5px] group-hover:translate-x-0 ml-2 shrink-0" />
                 </div>
                 <p className="text-xs text-text-dim mb-3 line-clamp-2">{item.summary}</p>
                 <div className="flex items-center justify-between text-[10px] text-text-dim font-medium uppercase tracking-wider">
                   <span className="truncate mr-4">Source: {item.source}</span>
                   <span className="shrink-0">{item.date}</span>
                 </div>
               </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AIInsightBox({ data, contextKey, askAI }: { data: any, contextKey: string, askAI: any }) {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatting, setChatting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInsight = async () => {
      setLoading(true);
      const query = `Analyze the following findings logically as CyberAmour's elite comprehensive search and cybersecurity AI. Finding context: ${contextKey}. Data: ${JSON.stringify(data)}. Start your response with a section titled '### INSIGHTS' where you exhaustively detail and analyze every piece of data provided, leaving nothing out. NOTE: Do not mention the term "OSINT", instead say "CyberAmour comprehensive search reveals". If the data includes details on personal information about the identity of the person being investigated (such as age, birth date, sex, history, marital status, relationship status, moral fidelity, previous marriages, sex tape leakages, profession, criminal records, work history, financial credibility for loans, and character credibility for business purposes), provide this information in detail in this section. Then end with a section titled '### RECOMMENDATIONS' containing a bulleted list of specific, actionable advice on what the user should do next based on these findings.`;
      const result = await askAI(query);
      if (isMounted) {
        setMessages([{ role: 'ai', content: result }]);
        setLoading(false);
      }
    };
    fetchInsight();
    return () => { isMounted = false; };
  }, [contextKey]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setChatting(true);
    setMessages(prev => [...prev, { role: 'user', content: chatInput }]);
    const currentInput = chatInput;
    setChatInput('');
    try {
       const query = `You are a CyberAmour AI assisting the user with the scan results. Context data: ${JSON.stringify(data)}. User question: ${currentInput}. Respond directly to the user's question, without marketing. Be highly analytical.`;
       const result = await askAI(query);
       setMessages(prev => [...prev, { role: 'ai', content: result }]);
    } catch (e) {
       console.error(e);
       setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I am unable to process that at the moment." }]);
    } finally {
       setChatting(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-[#A78BFA]/30 bg-[#A78BFA]/5">
      <h5 className="text-sm font-bold text-[#A78BFA] flex items-center gap-2 mb-3">
        <Sparkles size={16} /> CyberAmour AI Insights & Interactive Assistant
      </h5>
      {loading ? (
        <div className="flex items-center gap-3 text-text-dim text-sm animate-pulse">
           <div className="w-4 h-4 rounded-full border-2 border-[#A78BFA] border-t-transparent animate-spin" />
           Generating initial findings and recommendations...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-none">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("p-4 rounded-xl text-sm leading-relaxed max-w-full", msg.role === 'ai' ? "bg-black/20 border border-white/5" : "bg-[#A78BFA]/20 border border-[#A78BFA]/30 self-end ml-8")}>
                 <div className="text-[10px] uppercase font-bold tracking-widest text-[#A78BFA] mb-1">{msg.role === 'ai' ? 'Insight Report' : 'Your Query'}</div>
                 <div className="prose prose-invert max-w-none prose-p:my-1 prose-headings:text-[#A78BFA] prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-1 prose-li:my-0">
                   <ReactMarkdown>{msg.content}</ReactMarkdown>
                 </div>
              </div>
            ))}
            {chatting && (
               <div className="p-4 rounded-xl text-sm bg-black/20 border border-white/5 w-fit flex gap-2 items-center">
                  <div className="w-4 h-4 rounded-full border-2 border-[#A78BFA] border-t-transparent animate-spin" />
                  Analyzing response...
               </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 border-t border-border/50 pt-3">
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask CyberAmour AI to summarize, explain, or analyze specific details further..."
              className="flex-1 bg-surface border border-border rounded-xl py-2 px-3 text-sm focus:border-[#A78BFA] outline-none"
            />
            <button onClick={handleSendMessage} disabled={chatting || !chatInput} className="bg-[#A78BFA] p-2 rounded-xl text-black hover:bg-white transition disabled:opacity-50">
               <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScanDraftViewer({ draftResult, setDraftResult, onFinalize, askAI }: any) {
  const [feedbackPrompt, setFeedbackPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [aiReview, setAiReview] = useState('');
  const [reviewingAI, setReviewingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleAIReview = async () => {
    setReviewingAI(true);
    setAiError('');
    setAiReview('');
    try {
      const prompt = `You are the evidence-review assistant in a cybersecurity forensics application. Analyze these preliminary scan results without inventing facts or changing the underlying findings. Explain: (1) what was actually checked and by which provider if the data states this, (2) key findings and their evidence, (3) source URLs and their limitations, (4) confidence and identity-match caveats, (5) what was not checked, and (6) prioritized next steps. Distinguish observed evidence, provider assertions, AI interpretation, and unknowns. A missing result is not proof of safety. Do not state a scan, malware detection, DNS/TLS/port test, breach lookup, or endpoint inspection occurred unless explicitly supported by the data. Keep the response concise and analyst-ready. Data: ${JSON.stringify(draftResult).slice(0, 24000)}`;
      const response = await askAI(prompt);
      if (!response || /AI service is unavailable|No simulated answer|Please sign in/i.test(response)) {
        setAiError(response || 'AI returned no review.');
      } else {
        setAiReview(response);
      }
    } catch (error: any) {
      setAiError(error?.message || 'AI review failed. No AI analysis was produced.');
    } finally { setReviewingAI(false); }
  };

  const handleRefine = async () => {
    if (!feedbackPrompt) return;
    setRefining(true);
    setMessages(prev => [...prev, { role: 'user', content: feedbackPrompt }]);
    const currentFeedback = feedbackPrompt;
    setFeedbackPrompt('');
    
    try {
      const systemPrompt = `You are an expert CyberAmour investigator AI. 
The user is reviewing preliminary scan results before finalization.
Current preliminary data: ${JSON.stringify(draftResult)}

User feedback/request: "${currentFeedback}"

Apply the user's correction, feedback, or filtering instructions carefully to the raw data.
For example, if the user asks to remove a specific identity, delete that object from 'candidates'.
Return ONLY a valid, updated JSON string (with no markdown code blocks). If the data is an array, return an array. If it's an object, return an object. This JSON will directly replace the application state, so it MUST strictly follow the exact same schema as the input data.`;
      
      const response = await askAI(systemPrompt);
      const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const parsed = JSON.parse(cleanedResponse);
        setDraftResult(parsed);
        setMessages(prev => [...prev, { role: 'ai', content: "I've refined the results based on your feedback. Please review." }]);
      } catch (parseError) {
        setMessages(prev => [...prev, { role: 'ai', content: "I couldn't safely apply the change. The output JSON was malformed. Please try phrasing your correction differently." }]);
      }
    } catch (err) {
       console.error("Refine error:", err);
       setMessages(prev => [...prev, { role: 'ai', content: "An error occurred while refining the results." }]);
    } finally {
      setRefining(false);
    }
  }

  return (
    <div className="mt-4 p-6 glass-card border border-[#00E5FF]/50 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-[#00E5FF] to-primary animate-pulse" />
       
       <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
         <Search size={20} className="text-[#00E5FF]"/> Preliminary Scan Findings Review
       </h3>
       <p className="text-sm text-text-dim mb-4">
         Review the raw data below. If you notice mixed identities or want to filter out specific findings, provide instructions to the CyberAmour AI assistant before generating the final comprehensive report.
       </p>
       
       <div className="max-h-60 overflow-y-auto bg-black border border-border rounded-xl p-4 mb-4 text-xs font-mono text-[#00E5FF]">
          <pre>{JSON.stringify(draftResult, null, 2)}</pre>
       </div>
       
       <div className="mb-4 rounded-2xl border border-[#00E5FF]/30 bg-[#00E5FF]/5 p-4 space-y-3">
         <div className="flex flex-wrap items-center justify-between gap-3">
           <div><h4 className="font-bold flex items-center gap-2"><Sparkles size={17} className="text-[#00E5FF]" /> AI Evidence Review</h4><p className="text-xs text-text-dim mt-1">Uses the configured server-side AI assistant to interpret this scan's returned data. It cannot add missing evidence.</p></div>
           <button onClick={handleAIReview} disabled={reviewingAI} className="px-4 py-2 rounded-xl bg-[#00E5FF] text-slate-950 font-bold text-sm disabled:opacity-50">{reviewingAI ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Reviewing evidence…</span> : <span className="flex items-center gap-2"><Sparkles size={16} /> Run AI Assist</span>}</button>
         </div>
         {aiError && <p role="alert" className="text-sm text-danger">AI Assist unavailable: {aiError}</p>}
         {aiReview && <div className="rounded-xl bg-black/30 border border-border p-4 text-sm leading-relaxed whitespace-pre-wrap">{aiReview}</div>}
       </div>

       <div className="space-y-3">
         {messages.map((m, i) => (
           <div key={i} className={cn("p-3 rounded-xl max-w-[85%] text-sm", m.role === 'ai' ? "bg-primary/20 text-white self-start" : "bg-surface text-text-main self-end ml-auto")}>
             <div className="font-bold text-[10px] uppercase tracking-widest text-text-dim mb-1">{m.role === 'ai' ? 'CyberAmour AI' : 'You'}</div>
             {m.content}
           </div>
         ))}
       </div>
       
       <div className="mt-4 flex gap-3">
         <input 
           type="text" 
           value={feedbackPrompt}
           onChange={(e) => setFeedbackPrompt(e.target.value)}
           onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
           placeholder="e.g. 'Remove the candidate from Florida' or 'Focus only on Acme Corp'"
           className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:border-[#00E5FF] outline-none"
         />
         <button onClick={handleRefine} disabled={refining || !feedbackPrompt} className="px-5 py-3 bg-surface border border-border rounded-xl font-bold hover:bg-white/10 transition">
           {refining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
         </button>
       </div>
       
       <button onClick={onFinalize} disabled={refining} className="w-full mt-4 py-4 bg-primary text-white font-bold rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.5)]">
           Generate Final Report & Advanced AI Insights
       </button>
    </div>
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


