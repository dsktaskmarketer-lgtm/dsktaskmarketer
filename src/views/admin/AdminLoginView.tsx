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
  HelpCircle,
  Hash
} from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';
import { 
  adminLogin, 
  verifyAdminSession,
  getAdminSetupStatus,
  initialAdminSetup,
  requestPasswordResetOtp,
  verifyOtpAndResetPassword,
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

type AuthMode = 'login' | 'first_time_setup' | 'forgot_password';

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  currentUser,
  settings,
  forceFirstTimeSetup = false,
  onAdminLoginSuccess,
  onNavigateToUserApp,
  onLogoutCurrentUser,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [setupStatus, setSetupStatus] = useState<{ isFirstTimeSetup: boolean } | null>(null);

  // Login form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // First-time setup states (Admin Gmail + Password)
  const [setupGmail, setSetupGmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [showSetupPass, setShowSetupPass] = useState(false);

  // Forgot password OTP states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check initial setup status on mount
  useEffect(() => {
    getAdminSetupStatus()
      .then((status) => {
        setSetupStatus(status);
        if (status.isFirstTimeSetup) {
          setAuthMode('first_time_setup');
        } else {
          setAuthMode('login');
        }
      })
      .catch(() => {
        setSetupStatus({ isFirstTimeSetup: false });
        setAuthMode('login');
      });
  }, []);

  // Guarantee that if setup is already completed, the setup screen is never shown
  useEffect(() => {
    if (setupStatus && !setupStatus.isFirstTimeSetup && authMode === 'first_time_setup') {
      setAuthMode('login');
    }
  }, [setupStatus, authMode]);

  // If already logged in as a normal user, block access
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div id="admin-forbidden-view" className="min-h-screen bg-[#07152F] flex flex-col justify-center items-center px-4 py-12 selection:bg-blue-600 selection:text-white">
        <div className="w-full max-w-md bg-[#0B1F4D] border border-blue-900 rounded-3xl p-8 shadow-2xl text-center text-white">
          <div className="w-16 h-16 bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8 text-yellow-400" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">Non-Admin Account Detected</h2>
          <p className="text-xs text-blue-200 mt-2 leading-relaxed">
            You are currently signed in with a standard member account (<span className="text-white font-semibold">{currentUser.email}</span>). 
            Access to the Administrative Console is strictly restricted to verified system administrators.
          </p>

          <div className="mt-6 space-y-3">
            <button
              id="btn-return-user-dashboard"
              onClick={onNavigateToUserApp}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-yellow-300" />
              <span>Return to User Dashboard</span>
            </button>

            <button
              id="btn-signout-admin"
              onClick={onLogoutCurrentUser}
              className="w-full py-3 px-4 bg-[#07152F] hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-all border border-blue-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign Out & Enter Admin Credentials</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 1. Initial Admin Setup Submission
  const handleInitialSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailClean = setupGmail.trim().toLowerCase();
    const passClean = setupPassword.trim();
    const confirmClean = setupConfirmPassword.trim();

    if (!emailClean) {
      setErrorMessage('Please enter your Admin Gmail address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      setErrorMessage('Please enter a valid Gmail / email address.');
      return;
    }

    if (passClean.length < 8) {
      setErrorMessage('Admin Password must contain at least 8 characters.');
      return;
    }

    if (passClean !== confirmClean) {
      setErrorMessage('Admin Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await initialAdminSetup({
        email: emailClean,
        password: passClean,
        confirmPassword: confirmClean,
      });

      setSuccessMessage('Administrator account initialized securely! Loading Administrative Console...');
      setSetupStatus({ isFirstTimeSetup: false });

      setTimeout(() => {
        onAdminLoginSuccess(res.user);
      }, 700);
    } catch (err: any) {
      console.error('Initial admin setup error:', err);
      setErrorMessage(err.message || 'Failed to initialize administrator account.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Admin Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = identifier.trim().toLowerCase();
    const passTrimmed = password.trim();

    if (!emailTrimmed || !passTrimmed) {
      setErrorMessage('Please enter both Admin Gmail and password.');
      return;
    }

    setLoading(true);

    try {
      let authenticatedUser: User | null = null;

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
        } else {
          throw new Error('Access Denied: This account does not possess verified administrator privileges.');
        }
      }

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

  // 3. Request OTP for Password Reset
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailClean = recoveryEmail.trim().toLowerCase();
    if (!emailClean) {
      setErrorMessage('Please enter your registered Admin Gmail address.');
      return;
    }

    setLoading(true);

    try {
      const res = await requestPasswordResetOtp(emailClean, 'admin');
      setOtpSent(true);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify OTP & Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailClean = recoveryEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    const cleanNewPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (cleanNewPass.length < 8) {
      setErrorMessage('New password must contain at least 8 characters.');
      return;
    }

    if (cleanNewPass !== cleanConfirm) {
      setErrorMessage('New Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyOtpAndResetPassword({
        email: emailClean,
        otp: cleanOtp,
        newPassword: cleanNewPass,
        confirmPassword: cleanConfirm,
        role: 'admin',
      });

      setSuccessMessage(res.message);
      setIdentifier(emailClean);
      setPassword('');
      setOtpSent(false);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setAuthMode('login');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-container" className="min-h-screen bg-blue-50/40 text-[#0B1F4D] flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
      {/* Top Bar */}
      <div className="border-b border-blue-900 bg-[#0B1F4D] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <button
          id="btn-return-user-website"
          onClick={onNavigateToUserApp}
          className="text-xs font-bold text-blue-100 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-yellow-300" />
          <span>Return to User Website</span>
        </button>

        <div className="flex items-center gap-2 bg-blue-900/80 border border-blue-700 px-3 py-1 rounded-full">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-yellow-300">
            Secure Admin Gateway
          </span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <BrandLogo size="lg" />
            <div className="mt-3">
              <span className="inline-block px-3 py-1 bg-[#0B1F4D] text-white border border-blue-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xs">
                Administrative Control Center
              </span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-blue-200 rounded-3xl p-7 sm:p-8 shadow-xl relative overflow-hidden text-[#0B1F4D]">
            
            {/* Error Message */}
            {errorMessage && (
              <div id="auth-error-alert" className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div id="auth-success-alert" className="mb-5 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* ===================== VIEW MODE: FIRST-TIME SETUP ===================== */}
            {authMode === 'first_time_setup' && (
              <div id="first-time-setup-panel" className="space-y-4">
                <div className="mb-4 pb-3 border-b border-blue-100 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <KeyRound className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-black text-[#0B1F4D] text-base">
                    Initial Administrator Setup
                  </h3>
                  <p className="text-[11px] text-[#0B1F4D]/70 mt-1 leading-relaxed">
                    Configure your official administrator account. Passwords are cryptographically salted and hashed.
                  </p>
                </div>

                <form onSubmit={handleInitialSetupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F4D] mb-1.5">
                      Admin Gmail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="setup-gmail-input"
                        type="email"
                        required
                        value={setupGmail}
                        onChange={(e) => setSetupGmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-white border border-blue-200 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F4D] mb-1.5">
                      Admin Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="setup-password-input"
                        type={showSetupPass ? 'text' : 'password'}
                        required
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                        placeholder="Min. 8 characters (letters & numbers)"
                        className="w-full bg-white border border-blue-200 focus:border-blue-600 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPass(!showSetupPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        {showSetupPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F4D] mb-1.5">
                      Confirm Admin Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="setup-confirm-password-input"
                        type={showSetupPass ? 'text' : 'password'}
                        required
                        value={setupConfirmPassword}
                        onChange={(e) => setSetupConfirmPassword(e.target.value)}
                        placeholder="Re-enter admin password"
                        className="w-full bg-white border border-blue-200 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-create-initial-admin"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Configuring Secure Account...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-yellow-300" />
                          <span>Create Administrator Account</span>
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
              <div id="login-panel" className="space-y-4">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-black text-[#0B1F4D]">Admin Login</h2>
                  <p className="text-xs text-[#0B1F4D]/70 mt-0.5">Access your administrative console</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F4D] mb-1.5">
                      Admin Gmail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-login-identifier"
                        type="email"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="yourname@gmail.com"
                        autoComplete="email"
                        className="w-full bg-white border border-blue-200 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F4D]">
                        Admin Password
                      </label>
                      <button
                        id="btn-forgot-password-link"
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot_password');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          setOtpSent(false);
                          setRecoveryEmail(identifier);
                        }}
                        className="text-xs text-blue-700 hover:underline font-bold transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                        autoComplete="current-password"
                        className="w-full bg-white border border-blue-200 focus:border-blue-600 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-admin-login"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Login</span>
                          <ArrowRight className="w-4 h-4 text-yellow-300" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===================== VIEW MODE: FORGOT PASSWORD (OTP FLOW) ===================== */}
            {authMode === 'forgot_password' && (
              <div id="forgot-password-panel" className="space-y-4">
                <div className="mb-4 pb-3 border-b border-blue-100">
                  <div className="flex items-center gap-2 text-yellow-600 font-bold text-sm">
                    <HelpCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-[#0B1F4D]">Admin Password Recovery (OTP)</span>
                  </div>
                  <p className="text-[11px] text-[#0B1F4D]/70 mt-1 leading-relaxed">
                    {!otpSent 
                      ? 'Enter your registered Admin Gmail. We will dispatch a 6-digit OTP verification code.'
                      : 'Enter the 6-digit verification code dispatched to your Gmail along with your new password.'
                    }
                  </p>
                </div>

                {!otpSent ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F4D] mb-1.5">
                        Admin Gmail
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="forgot-email-input"
                          type="email"
                          required
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="yourname@gmail.com"
                          className="w-full bg-white border border-blue-200 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <button
                        id="btn-send-otp"
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Dispatching Verification OTP...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            <span>Send 6-Digit Verification OTP</span>
                            <ArrowRight className="w-4 h-4 text-yellow-300" />
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
                        className="w-full py-2.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors text-center cursor-pointer"
                      >
                        Back to Admin Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F4D] mb-1.5">
                        6-Digit Verification Code (OTP)
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="otp-code-input"
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 123456"
                          className="w-full bg-yellow-50 border border-yellow-300 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-center tracking-widest text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F4D] mb-1.5">
                        New Admin Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="new-password-input"
                          type={showNewPass ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters (letters & numbers)"
                          className="w-full bg-white border border-blue-200 focus:border-blue-600 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1F4D] mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="confirm-password-input"
                          type={showNewPass ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full bg-white border border-blue-200 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        id="btn-verify-otp-reset"
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying & Updating Password...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                            <span>Verify Code & Update Password</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setErrorMessage(null);
                        }}
                        className="w-full py-2 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors text-center cursor-pointer"
                      >
                        Resend Verification OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="border-t border-blue-900 bg-[#0B1F4D] py-4 px-6 text-center text-white">
        <p className="text-[10px] text-blue-200 font-mono">
          DSK TaskMarketer • Administrator Security Gateway • All authentication events logged & audited
        </p>
      </div>
    </div>
  );
};
