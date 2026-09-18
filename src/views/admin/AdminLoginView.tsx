import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { 
  adminLogin, 
  verifyAdminSession,
  getAdminSetupStatus,
  completeAdminSetup,
  requestAdminPasswordReset,
  submitAdminPasswordReset,
  setStoredToken
} from '../../services/api';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { User, PlatformSettings } from '../../types';

interface AdminLoginViewProps {
  currentUser: User | null;
  settings?: PlatformSettings;
  forceFirstTimeSetup?: boolean;
  onAdminLoginSuccess: (user: User) => void;
  onNavigateToUserApp: () => void;
  onLogoutCurrentUser: () => void;
}

type AuthMode = 'login' | 'first_time_setup' | 'forgot_password' | 'reset_password';

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  currentUser,
  settings,
  forceFirstTimeSetup = false,
  onAdminLoginSuccess,
  onNavigateToUserApp,
  onLogoutCurrentUser,
}) => {
  const isSetupForced = forceFirstTimeSetup || Boolean(currentUser?.role === 'admin' && currentUser?.mustChangeCredentials);
  const [authMode, setAuthMode] = useState<AuthMode>(isSetupForced ? 'first_time_setup' : 'login');
  const [setupStatus, setSetupStatus] = useState<{
    isFirstTimeSetup: boolean;
    defaultEmail?: string;
    defaultPassword?: string;
  } | null>(null);

  // Login form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // First-time setup states
  const [tempAdminUser, setTempAdminUser] = useState<User | null>(currentUser);
  const [setupEmail, setSetupEmail] = useState(currentUser?.email || '');
  const [setupNewPassword, setSetupNewPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  // Forgot / Reset password states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | undefined>(undefined);

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load Setup Status & Detect Password Recovery tokens on Mount
  useEffect(() => {
    getAdminSetupStatus()
      .then((status) => {
        setSetupStatus(status);
      })
      .catch(() => {
        setSetupStatus({ isFirstTimeSetup: false });
      });

    // Check URL parameters / hash for recovery flow
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      if (hash.includes('type=recovery') || searchParams.get('type') === 'recovery' || searchParams.get('reset') === 'true') {
        setAuthMode('reset_password');
        // Extract token if present in hash
        if (hash) {
          const params = new URLSearchParams(hash.replace('#', '?'));
          const token = params.get('access_token');
          if (token) setRecoveryToken(token);
        }
      }
    }

    // Supabase Auth State listener for recovery
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setAuthMode('reset_password');
            if (session?.user?.email) {
              setRecoveryEmail(session.user.email);
            }
            if (session?.access_token) {
              setRecoveryToken(session.access_token);
            }
          }
        });
        return () => {
          subscription?.unsubscribe();
        };
      } catch (err) {
        console.warn('Supabase auth state listener note:', err);
      }
    }
  }, []);

  // If already logged in as a normal user
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div id="admin-forbidden-view" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">Non-Admin Account Detected</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            You are currently signed in with a standard member account (<span className="text-slate-200 font-semibold">{currentUser.email}</span>). 
            Access to the Administrative Console is strictly restricted to verified system administrators.
          </p>

          <div className="mt-6 space-y-3">
            <button
              id="btn-return-user-dashboard"
              onClick={onNavigateToUserApp}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to User Dashboard</span>
            </button>

            <button
              id="btn-signout-admin"
              onClick={onLogoutCurrentUser}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign Out & Enter Admin Credentials</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to prefill initial credentials during first-time setup
  const handleAutoFillDefaultCredentials = () => {
    if (setupStatus?.isFirstTimeSetup && setupStatus.defaultEmail && setupStatus.defaultPassword) {
      setIdentifier(setupStatus.defaultEmail);
      setPassword(setupStatus.defaultPassword);
      setErrorMessage(null);
    }
  };

  // 1. Primary Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = identifier.trim().toLowerCase();
    const passTrimmed = password.trim();

    if (!emailTrimmed || !passTrimmed) {
      setErrorMessage('Please enter both administrator email and password.');
      return;
    }

    setLoading(true);

    try {
      let authenticatedUser: User | null = null;
      let mustChangeCredentials = false;

      // 1. Try Supabase Auth first if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: emailTrimmed,
            password: passTrimmed,
          });

          if (!error && data.session) {
            if (data.session.access_token) {
              setStoredToken(data.session.access_token);
            }
            const verifyRes = await verifyAdminSession().catch(() => null);
            if (verifyRes && verifyRes.verified && verifyRes.user.role === 'admin') {
              authenticatedUser = verifyRes.user;
            }
          }
        } catch {
          // Fall back to server admin login API
        }
      }

      // 2. Perform direct Server-Side Admin Authentication with role verification
      if (!authenticatedUser) {
        const res = await adminLogin(emailTrimmed, passTrimmed);
        if (res.user && res.user.role === 'admin') {
          authenticatedUser = res.user;
          mustChangeCredentials = Boolean(res.mustChangeCredentials);
        } else {
          throw new Error('Access Denied: This account does not possess verified administrator privileges.');
        }
      }

      // Check if First-Time Setup must be performed
      if (mustChangeCredentials || setupStatus?.isFirstTimeSetup) {
        setTempAdminUser(authenticatedUser);
        setSetupEmail(authenticatedUser.email);
        setAuthMode('first_time_setup');
        setSuccessMessage('Initial credentials verified. For security, you must now complete the first-time setup.');
        return;
      }

      // Regular successful admin login
      setSuccessMessage('Administrator credentials verified. Loading console...');
      setTimeout(() => {
        onAdminLoginSuccess(authenticatedUser!);
      }, 400);

    } catch (err: any) {
      console.error('Admin login error:', err);
      setErrorMessage(err.message || 'Invalid administrator credentials or insufficient privileges.');
    } finally {
      setLoading(false);
    }
  };

  // 2. First-Time Setup Submission (Forces password change & allows email update)
  const handleCompleteSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailClean = setupEmail.trim().toLowerCase();
    const passClean = setupNewPassword.trim();
    const confirmClean = setupConfirmPassword.trim();

    if (!emailClean) {
      setErrorMessage('Please provide a valid administrator email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      setErrorMessage('Please enter a valid format for the administrator email.');
      return;
    }

    if (passClean.length < 8) {
      setErrorMessage('New password must contain at least 8 characters.');
      return;
    }

    if (passClean !== confirmClean) {
      setErrorMessage('New password and password confirmation do not match.');
      return;
    }

    if (setupStatus?.defaultPassword && passClean === setupStatus.defaultPassword) {
      setErrorMessage('Security Policy: You cannot reuse the initial default password. Choose a new secure password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Sync password update to Supabase Auth if available
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.updateUser({
            email: emailClean,
            password: passClean
          });
        } catch (sbErr) {
          console.warn('Supabase client password update note:', sbErr);
        }
      }

      // 2. Call server to finalize setup, invalidate default credentials, and persist updated admin state
      const res = await completeAdminSetup({
        newEmail: emailClean,
        newPassword: passClean,
      });

      setSuccessMessage('Administrator credentials successfully established! Default credentials are now permanently disabled.');
      
      // Update local setup status so default credentials are wiped forever
      setSetupStatus({ isFirstTimeSetup: false });
      setIdentifier('');
      setPassword('');

      setTimeout(() => {
        onAdminLoginSuccess(res.user);
      }, 700);

    } catch (err: any) {
      console.error('Complete setup error:', err);
      setErrorMessage(err.message || 'Failed to finalize administrator credential update.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot Password Request Submission (Dispatches secure reset link via Supabase)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = recoveryEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }

    setLoading(true);

    try {
      // If client Supabase is configured, trigger client-side resetPasswordForEmail as well
      if (isSupabaseConfigured && supabase) {
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          await supabase.auth.resetPasswordForEmail(emailTrimmed, {
            redirectTo: `${origin}/admin/login?type=recovery`,
          });
        } catch (sbErr) {
          console.warn('Supabase reset request note:', sbErr);
        }
      }

      // Trigger server-side password recovery
      await requestAdminPasswordReset(emailTrimmed);

      // Security requirement 19: Safe generic message
      setSuccessMessage('If an administrative account matches this email address, password reset instructions have been dispatched. Please check your inbox and click the verification link.');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      // Still show generic message to avoid leaking user existence
      setSuccessMessage('If an administrative account matches this email address, password reset instructions have been dispatched. Please check your inbox and click the verification link.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Reset Password Submission (Sets verified new password after email link clicked)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const passClean = newResetPassword.trim();
    const confirmClean = confirmResetPassword.trim();
    const targetEmail = (recoveryEmail || resetEmailInput || identifier).trim().toLowerCase();

    if (!targetEmail) {
      setErrorMessage('Please specify the administrator email address.');
      return;
    }

    if (passClean.length < 8) {
      setErrorMessage('New password must contain at least 8 characters.');
      return;
    }

    if (passClean !== confirmClean) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setLoading(true);

    try {
      // Update in Supabase Auth if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.auth.updateUser({
            password: passClean
          });
          if (error) console.warn('Supabase auth updateUser note:', error.message);
        } catch (sbErr) {
          console.warn('Supabase auth reset error note:', sbErr);
        }
      }

      // Update in Server
      await submitAdminPasswordReset({
        email: targetEmail,
        newPassword: passClean,
        token: recoveryToken
      });

      setSuccessMessage('Administrator password successfully updated! You may now sign in with your new password.');
      setNewResetPassword('');
      setConfirmResetPassword('');
      setIdentifier(targetEmail);
      
      // Clean URL hash/params
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/admin/login');
      }

      setTimeout(() => {
        setAuthMode('login');
      }, 1200);

    } catch (err: any) {
      console.error('Reset password error:', err);
      setErrorMessage(err.message || 'Failed to update administrator password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 px-6 py-4 flex items-center justify-between">
        <button
          id="btn-return-user-website"
          onClick={onNavigateToUserApp}
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to User Website</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            Secure Admin Gateway
          </span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-500/10 mx-auto mb-4 border border-emerald-400/30">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {settings?.platformName || 'DSK TaskMarketer'}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mt-1">
              Administrative Control Center
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Secure single-sign-on access for authorized operators & supervisors
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Error Message */}
            {errorMessage && (
              <div id="auth-error-alert" className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div id="auth-success-alert" className="mb-5 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* ===================== VIEW MODE: FIRST-TIME SETUP ===================== */}
            {authMode === 'first_time_setup' && (
              <div id="first-time-setup-panel" className="space-y-4">
                <div className="mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <KeyRound className="w-4 h-4" />
                    <span>Mandatory Security Setup</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Default credentials must be replaced immediately. Please specify your official administrator email and configure your private master password.
                  </p>
                </div>

                <form onSubmit={handleCompleteSetupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Administrator Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="setup-email-input"
                        type="email"
                        required
                        value={setupEmail}
                        onChange={(e) => setSetupEmail(e.target.value)}
                        placeholder="e.g. dsabithkumar1@gmail.com"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      New Master Access Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="setup-password-input"
                        type={showSetupPassword ? 'text' : 'password'}
                        required
                        value={setupNewPassword}
                        onChange={(e) => setSetupNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPassword(!showSetupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Confirm New Master Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="setup-confirm-password-input"
                        type={showSetupPassword ? 'text' : 'password'}
                        required
                        value={setupConfirmPassword}
                        onChange={(e) => setSetupConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-complete-setup"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Finalizing Security Configuration...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Activate New Credentials & Enter Console</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===================== VIEW MODE: FORGOT PASSWORD ===================== */}
            {authMode === 'forgot_password' && (
              <div id="forgot-password-panel" className="space-y-4">
                <div className="mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <HelpCircle className="w-4 h-4" />
                    <span>Administrator Password Recovery</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Enter your registered administrator email address. We will dispatch a secure password reset verification link using Supabase Auth.
                  </p>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Administrator Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="forgot-email-input"
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="e.g. administrator@yourdomain.com"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      id="btn-send-recovery-link"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching Security Link...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send Verification Reset Link</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors text-center cursor-pointer"
                    >
                      Back to Administrator Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===================== VIEW MODE: RESET PASSWORD ===================== */}
            {authMode === 'reset_password' && (
              <div id="reset-password-panel" className="space-y-4">
                <div className="mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <KeyRound className="w-4 h-4" />
                    <span>Set New Administrator Password</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Identity ownership has been verified. Create a new master password for your administrator account.
                  </p>
                </div>

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  {!recoveryEmail && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Administrator Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="reset-email-input"
                          type="email"
                          required
                          value={resetEmailInput || identifier}
                          onChange={(e) => setResetEmailInput(e.target.value)}
                          placeholder="administrator@yourdomain.com"
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      New Master Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="new-reset-password-input"
                        type={showResetPassword ? 'text' : 'password'}
                        required
                        value={newResetPassword}
                        onChange={(e) => setNewResetPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Confirm New Master Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="confirm-reset-password-input"
                        type={showResetPassword ? 'text' : 'password'}
                        required
                        value={confirmResetPassword}
                        onChange={(e) => setConfirmResetPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-submit-reset-password"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Administrator Password...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Update Password & Return to Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===================== VIEW MODE: STANDARD LOGIN ===================== */}
            {authMode === 'login' && (
              <>
                {/* FIRST ADMIN LOGIN ONLY: Display Default Credentials Notice */}
                {setupStatus?.isFirstTimeSetup && setupStatus.defaultEmail && setupStatus.defaultPassword && (
                  <div id="first-time-setup-banner" className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Initial First-Time Administrator Setup</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Use the temporary initial credentials below to sign in. Upon your first login, the system will immediately require you to change the password and update your admin email.
                    </p>
                    <div className="pt-2 border-t border-amber-500/20 font-mono text-[11px] space-y-1 bg-slate-950/40 p-2.5 rounded-xl border border-amber-500/10">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Default Email:</span>
                        <span className="text-emerald-400 font-bold">{setupStatus.defaultEmail}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Default Password:</span>
                        <span className="text-slate-200 font-bold">{setupStatus.defaultPassword}</span>
                      </div>
                    </div>
                    <button
                      id="btn-autofill-default"
                      type="button"
                      onClick={handleAutoFillDefaultCredentials}
                      className="w-full py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Click to Auto-Fill Initial Credentials</span>
                    </button>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Administrator Email / Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-login-identifier"
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="administrator@yourdomain.com"
                        autoComplete="username"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                        Master Access Password
                      </label>
                      <button
                        id="btn-forgot-password-link"
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot_password');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-admin-login-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Security Clearance...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Authenticate Administrator</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Compliance & Security Footer */}
          <p className="text-center text-[10px] text-slate-600 mt-6 max-w-xs mx-auto leading-relaxed">
            Strictly for authorized DSK personnel. All IP addresses and access events are logged and audited server-side with database RLS enforcement.
          </p>
        </div>
      </div>

      {/* Footer info */}
      <div className="py-4 text-center text-[11px] text-slate-600 border-t border-slate-900">
        DSK TaskMarketer Administrative Security Subsystem • {new Date().getFullYear()}
      </div>
    </div>
  );
};
