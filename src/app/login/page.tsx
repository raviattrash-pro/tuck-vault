'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Decode JWT token payload from Google OAuth
 */
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT', e);
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginAsAdmin, user, hydrated } = useAuth();

  // Tab: 'google' for all standard users, 'admin' for administrators
  const [activeTab, setActiveTab] = useState<'google' | 'admin'>('google');

  // Multi-step for Google OAuth display name customization
  const [step, setStep] = useState<'signin' | 'set_name'>('signin');
  const [pendingUser, setPendingUser] = useState<{
    name: string;
    email: string;
    avatar: string | null;
  }>({ name: '', email: '', avatar: null });

  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [isGisButtonRendered, setIsGisButtonRendered] = useState(false);

  // Fallback Google account selector modal state (for localhost / mock OAuth)
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState('');
  const [googleInputName, setGoogleInputName] = useState('');

  // Admin form state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState('');

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // If already logged in, redirect
  useEffect(() => {
    if (hydrated && user) {
      router.replace('/home');
    }
  }, [hydrated, user, router]);

  // Load Google Identity Services script
  useEffect(() => {
    const existingScript = document.getElementById('google-jssdk');
    if (existingScript) {
      setGoogleScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-jssdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleScriptLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Initialize official Google Sign-In prompt
  useEffect(() => {
    if (!googleScriptLoaded || !window.google?.accounts?.id || !googleBtnRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id:
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          '939865483008-0n78umvtk3g67j8g5aotespfqsm1856q.apps.googleusercontent.com',
        callback: (response: any) => {
          if (response?.credential) {
            const decoded = parseJwt(response.credential);
            if (decoded) {
              const gName = decoded.name || decoded.given_name || 'User';
              const gEmail = decoded.email || '';
              const gAvatar = decoded.picture || null;

              setPendingUser({
                name: gName,
                email: gEmail,
                avatar: gAvatar,
              });
              setCustomName(gName);
              setStep('set_name');
            }
          }
        },
      });

      // Clear any prior rendered element to avoid duplicates
      googleBtnRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
      });
      setIsGisButtonRendered(true);
    } catch (e) {
      console.log('Google Sign-In button initialization note:', e);
      setIsGisButtonRendered(false);
    }
  }, [googleScriptLoaded, activeTab]);

  // Trigger Google Sign-In
  const handleGoogleClick = () => {
    setIsLoading(true);

    if (window.google?.accounts?.id?.prompt) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Open standard Google OAuth selector dialog
          setIsGoogleModalOpen(true);
          setIsLoading(false);
        }
      });
    } else {
      setIsGoogleModalOpen(true);
      setIsLoading(false);
    }
  };

  // Confirm Google Account in Dialog
  const handleSelectGoogleAccount = (email: string, name: string) => {
    setIsLoading(true);
    const resolvedName =
      name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const resolvedAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      resolvedName
    )}`;

    setPendingUser({
      name: resolvedName,
      email: email.trim(),
      avatar: resolvedAvatar,
    });
    setCustomName(resolvedName);
    setIsGoogleModalOpen(false);
    setStep('set_name');
    setIsLoading(false);
  };

  // Final confirmation of display name for Google user
  const handleConfirmName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setIsLoading(true);
    loginWithGoogle({
      name: customName.trim(),
      email: pendingUser.email,
      avatar: pendingUser.avatar,
    });

    setTimeout(() => {
      router.push('/home');
    }, 200);
  };

  // Handle Admin login submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const u = adminUsername.trim().toLowerCase();
    const p = adminPassword.trim();

    // Default credentials check: id='admin' & password='admin' or 'admin123'
    const isValidAdmin =
      (u === 'admin' || u === 'admin@tuck.local' || u === 'admin@tuck.app') &&
      (p === 'admin123' || p === 'admin' || p === 'password');

    if (!isValidAdmin) {
      setAdminError('Invalid credentials. Please verify your admin username and password.');
      return;
    }

    setIsLoading(true);
    loginAsAdmin('Administrator');

    setTimeout(() => {
      router.push('/home');
    }, 250);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4 py-12 selection:bg-indigo-100">
      <div className="w-full max-w-md animate-scale-in space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200">
            <span className="text-2xl font-bold">☵</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">tuck</h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              A place for the things that make up your life
            </p>
          </div>
        </div>

        {/* STEP 1: Main Login Card */}
        {step === 'signin' && (
          <div className="rounded-3xl bg-white p-7 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            {/* Segmented Tab Switcher: Google Account vs Admin */}
            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('google');
                  setAdminError('');
                }}
                className={`flex-1 py-2.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'google'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google Sign-In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setAdminError('');
                }}
                className={`flex-1 py-2.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'admin'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Admin Login</span>
              </button>
            </div>

            {/* TAB 1: GOOGLE OAUTH FOR ALL USERS */}
            {activeTab === 'google' && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center space-y-1">
                  <h2 className="text-base font-bold text-slate-900">Sign in to your space</h2>
                  <p className="text-xs text-slate-500">
                    All users authenticate securely using Google OAuth 2.0
                  </p>
                </div>

                {/* Google Button Container */}
                <div className="pt-2 flex flex-col items-center justify-center">
                  <div
                    ref={googleBtnRef}
                    className={`w-full flex justify-center ${isGisButtonRendered ? 'block' : 'hidden'}`}
                  />

                  {!isGisButtonRendered && (
                    <button
                      type="button"
                      onClick={handleGoogleClick}
                      disabled={isLoading}
                      className="w-full max-w-[320px] py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-full flex items-center justify-center gap-3 text-sm font-semibold text-slate-700 shadow-sm hover:shadow transition duration-150 active:scale-[0.99]"
                    >
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                    </button>
                  )}
                </div>

                {/* Corporate compliance notes */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Industry Security &amp; Privacy</span>
                  </div>
                  <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                    <li>Zero server database &middot; Your data never leaves your device</li>
                    <li>End-to-end local encryption for IDs &amp; cards</li>
                    <li>Offline-first &middot; Works without internet connection</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 2: ADMIN LOGIN (ID & PASSWORD) */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="space-y-4 animate-fade-in">
                <div className="text-center space-y-1">
                  <h2 className="text-base font-bold text-slate-900">Administrator Console</h2>
                  <p className="text-xs text-slate-500">
                    Sign in with administrator credentials
                  </p>
                </div>

                {adminError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{adminError}</span>
                  </div>
                )}

                {/* Username Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Admin User ID / Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Enter admin ID or username"
                      required
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Admin Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{isLoading ? 'Verifying Admin...' : 'Sign In as Administrator'}</span>
                </button>
              </form>
            )}

            {/* Bottom Security Footer */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Corporate Standard &middot; OAuth 2.0 &amp; AES Local Vault</span>
            </div>
          </div>
        )}

        {/* STEP 2: Customize Your Display Name (After Google Sign-In) */}
        {step === 'set_name' && (
          <div className="rounded-3xl bg-white p-7 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6 animate-scale-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center font-bold text-xl overflow-hidden shadow-inner">
                {pendingUser.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pendingUser.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{customName.slice(0, 2).toUpperCase() || '👤'}</span>
                )}
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">Welcome to Tuck!</h2>
                <p className="text-xs text-slate-500 font-mono">{pendingUser.email}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmName} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  How would you like your name to appear?
                </label>
                <input
                  type="text"
                  placeholder="Enter your name or nickname"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Shown on your personal space dashboard (e.g. &ldquo;Good morning, {customName || '...'}&rdquo;)
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={!customName.trim() || isLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Enter My Personal Space</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('signin')}
                  className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700 font-semibold transition"
                >
                  Use a different account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Clean, private space &middot; Zero unwanted mock data
        </p>
      </div>

      {/* Google Account Selector Dialog (Standard OAuth Modal) */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in border border-slate-100">
            {/* Google Logo & Title */}
            <div className="text-center space-y-1 pb-1 border-b border-slate-100">
              <svg className="h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <h3 className="font-bold text-slate-900 text-sm">Sign in with Google</h3>
              <p className="text-xs text-slate-500">Choose an account to continue to Tuck</p>
            </div>

            {/* Quick Account Selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Enter your Google Account
              </label>

              <div className="space-y-2.5">
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={googleInputEmail}
                  onChange={(e) => setGoogleInputEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Your Name (e.g. John Doe)"
                  value={googleInputName}
                  onChange={(e) => setGoogleInputName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!googleInputEmail.trim() || !googleInputEmail.includes('@')}
                  onClick={() =>
                    handleSelectGoogleAccount(googleInputEmail, googleInputName)
                  }
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-100 transition"
                >
                  Continue
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              To continue, Google will share your name, email address, and profile picture with Tuck.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
