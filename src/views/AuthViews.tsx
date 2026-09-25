import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Gift,
  Eye,
  EyeOff,
  Hash,
  Loader2,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { AuthSectionIllustration } from '../components/illustrations';
import { 
  requestPasswordResetOtp, 
  verifyOtpAndResetPassword, 
  checkRegistrationDuplicates,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp
} from '../services/api';
import type { User, WalletSummary } from '../types';

interface AuthViewsProps {
  mode: 'login' | 'register' | 'forgot-password';
  initialReferralCode?: string;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (data: { name: string; email: string; phone: string; pass: string; role: 'user' | 'client'; referralCode?: string }) => Promise<void>;
  onAuthSuccess?: (user: User, wallet?: WalletSummary) => void | Promise<void>;
  onSwitchMode: (mode: 'login' | 'register' | 'forgot-password') => void;
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  mode,
  initialReferralCode,
  onLogin,
  onRegister,
  onAuthSuccess,
  onSwitchMode,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'client'>('user');
  const [referralCode, setReferralCode] = useState<string>(() => {
    if (initialReferralCode) return initialReferralCode;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dsk_referral_code');
      if (stored) return stored;
    }
    return '';
  });

  // Registration OTP states
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regResendCooldown, setRegResendCooldown] = useState(0);

  // Forgot password OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetResendCooldown, setResetResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null);
  const [mobileFieldError, setMobileFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode);
    }
  }, [initialReferralCode]);

  // Resend cooldown timer for registration OTP
  useEffect(() => {
    if (regResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setRegResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [regResendCooldown]);

  // Resend cooldown timer for reset OTP
  useEffect(() => {
    if (resetResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetResendCooldown]);

  // Reset state when switching modes
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setEmailFieldError(null);
    setMobileFieldError(null);
    setOtpSent(false);
    setRegOtpSent(false);
    setRegOtpCode('');
    setOtpCode('');
  }, [mode]);

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    if (!hasLetter || !hasNumber) {
      return "Password must contain both letters and numbers (special characters optional).";
    }
    return null;
  };

  const validateLegalName = (fName: string, lName: string): string | null => {
    const cleanFirst = fName.trim();
    const cleanLast = lName.trim();
    if (!cleanFirst) {
      return "Please enter your first name.";
    }
    if (!cleanLast) {
      return "Please enter your last name.";
    }
    const combined = `${cleanFirst} ${cleanLast}`;
    if (!/^[\p{L}\s\.'-]+$/u.test(combined)) {
      return "First and last name must contain letters and spaces only.";
    }
    return null;
  };

  const handleResendRegOtp = async () => {
    if (regResendCooldown > 0 || resending) return;
    setError(null);
    setSuccess(null);
    setResending(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await resendRegistrationOtp(cleanEmail);
      setSuccess("OTP sent to your Gmail. Please check your Inbox or Spam folder.");
      setRegResendCooldown(45);
    } catch (err: any) {
      setError(err?.message || "Failed to resend registration code.");
    } finally {
      setResending(false);
    }
  };

  const handleResendResetOtp = async () => {
    if (resetResendCooldown > 0 || resending) return;
    setError(null);
    setSuccess(null);
    setResending(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await requestPasswordResetOtp(cleanEmail, 'user');
      setSuccess(res.message || `A new 6-digit verification code has been sent to ${cleanEmail}.`);
      setResetResendCooldown(45);
    } catch (err: any) {
      setError(err?.message || "Failed to resend reset code.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      setLoading(true);
      if (mode === 'login') {
        if (!cleanEmail || !password) {
          setError("Please enter both email and password.");
          return;
        }
        await onLogin(cleanEmail, password);
      } else if (mode === 'register') {
        if (!regOtpSent) {
          // Step 1: Validate inputs and request Real Email OTP
          const nameErr = validateLegalName(firstName, lastName);
          if (nameErr) {
            setError(nameErr);
            return;
          }
          const cleanName = `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ');

          if (!cleanEmail) {
            setError("Please enter your email address.");
            return;
          }

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setError("Please enter a valid email address.");
            return;
          }

          const cleanPhone = phone.trim();
          if (!cleanPhone) {
            setError("Please enter your mobile number.");
            return;
          }

          const digits = cleanPhone.replace(/\D/g, '');
          if (digits.length < 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
          }

          const passError = validatePassword(password);
          if (passError) {
            setError(passError);
            return;
          }

          if (password !== confirmPassword) {
            setError("Passwords do not match. Please verify your confirm password.");
            return;
          }

          // Pre-check duplicates
          try {
            const dupRes = await checkRegistrationDuplicates({ email: cleanEmail, mobile: cleanPhone });
            if (dupRes.emailUsed || dupRes.mobileUsed) {
              if (dupRes.emailUsed && dupRes.mobileUsed) {
                setEmailFieldError("This email is already used.");
                setMobileFieldError("This mobile number is already used.");
                setError("This email is already used. This mobile number is already used.");
              } else if (dupRes.emailUsed) {
                setEmailFieldError("This email is already used.");
                setMobileFieldError(null);
                setError("This email is already used.");
              } else {
                setMobileFieldError("This mobile number is already used.");
                setEmailFieldError(null);
                setError("This mobile number is already used.");
              }
              return;
            }
          } catch (dupCheckErr) {
            console.warn('[Registration Duplicate Pre-Check] Notice:', dupCheckErr);
          }

          // Dispatch REAL Email OTP
          const sendRes = await sendRegistrationOtp({
            name: cleanName,
            email: cleanEmail,
            mobile: cleanPhone,
            password: password,
            confirmPassword: confirmPassword,
            role: accountType,
            referralCode: referralCode.trim() || undefined,
          });

          setRegOtpSent(true);
          setRegResendCooldown(45);
          setSuccess("OTP sent to your Gmail. Please check your Inbox or Spam folder.");
        } else {
          // Step 2: Verify Registration OTP and Activate Account
          const cleanOtp = regOtpCode.trim();
          if (!cleanOtp || cleanOtp.length !== 6) {
            setError("Please enter the 6-digit verification code sent to your email.");
            return;
          }

          const verifyRes = await verifyRegistrationOtp({
            email: cleanEmail,
            otp: cleanOtp,
          });

          setSuccess(verifyRes.message || "Account created and verified successfully! Logging you in...");

          if (onAuthSuccess && verifyRes.user) {
            await onAuthSuccess(verifyRes.user, verifyRes.wallet);
          } else if (onRegister) {
            await onRegister({
              name: `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' '),
              email: cleanEmail,
              phone: phone.trim(),
              pass: password,
              role: accountType,
              referralCode: referralCode.trim() || undefined,
            });
          }
        }
      } else if (mode === 'forgot-password') {
        if (!otpSent) {
          // Request OTP step
          if (!cleanEmail) {
            setError("Please enter your registered email address.");
            return;
          }
          const res = await requestPasswordResetOtp(cleanEmail, 'user');
          setOtpSent(true);
          setResetResendCooldown(45);
          setSuccess(res.message || `Verification code sent to ${cleanEmail}. Check your Gmail inbox or spam folder.`);
        } else {
          // Verify OTP and Reset step
          const cleanOtp = otpCode.trim();
          const cleanNewPass = newPassword.trim();

          if (!cleanOtp || cleanOtp.length !== 6) {
            setError("Please enter the 6-digit verification code.");
            return;
          }

          const passError = validatePassword(cleanNewPass);
          if (passError) {
            setError(passError);
            return;
          }

          if (cleanNewPass !== confirmNewPassword) {
            setError("New password and confirm password do not match.");
            return;
          }

          const res = await verifyOtpAndResetPassword({
            email: cleanEmail,
            otp: cleanOtp,
            newPassword: cleanNewPass,
            confirmPassword: confirmNewPassword,
            role: 'user',
          });

          setSuccess(res.message || "Password reset successfully! Redirecting to sign in...");
          setPassword('');
          setConfirmPassword('');
          setOtpCode('');
          setNewPassword('');
          setConfirmNewPassword('');
          setOtpSent(false);

          setTimeout(() => {
            onSwitchMode('login');
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      const errMsg = err?.message || "Authentication error occurred.";
      const fErrors = err?.fieldErrors;
      if (fErrors) {
        if (fErrors.email) setEmailFieldError(fErrors.email);
        if (fErrors.mobile) setMobileFieldError(fErrors.mobile);
        setError(errMsg);
      } else if (errMsg.includes("This email is already used.") && errMsg.includes("This mobile number is already used.")) {
        setEmailFieldError("This email is already used.");
        setMobileFieldError("This mobile number is already used.");
        setError("This email is already used. This mobile number is already used.");
      } else if (errMsg.includes("This email is already used.")) {
        setEmailFieldError("This email is already used.");
        setMobileFieldError(null);
        setError("This email is already used.");
      } else if (errMsg.includes("This mobile number is already used.")) {
        setMobileFieldError("This mobile number is already used.");
        setEmailFieldError(null);
        setError("This mobile number is already used.");
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-blue-50/40 via-white to-slate-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-md w-full space-y-6">
        {/* Section Illustration Banner */}
        <div className="w-full flex justify-center">
          <AuthSectionIllustration size="md" className="drop-shadow-lg max-w-[280px] sm:max-w-[340px]" />
        </div>

        {/* Brand header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <BrandLogo size="lg" />
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {mode === 'login' && 'Welcome Back to DSK TaskMarketer'}
              {mode === 'register' && (regOtpSent ? 'Verify Your Email OTP' : 'Create Your DSK Account')}
              {mode === 'forgot-password' && (otpSent ? 'Enter Code & Reset Password' : 'Reset Account Password')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Digital Success Key • <span className="text-red-600 dark:text-red-400 font-bold">Complete Tasks</span> • <span className="text-yellow-600 dark:text-yellow-400 font-bold">Earn Rewards</span>
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex flex-col gap-1 font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              {mode === 'login' && (
                <div className="mt-1 pl-6 text-[11px] text-slate-600 dark:text-slate-300">
                  New to DSK TaskMarketer?{' '}
                  <button
                    type="button"
                    onClick={() => onSwitchMode('register')}
                    className="font-bold underline cursor-pointer text-blue-600 dark:text-blue-400"
                  >
                    Register free account
                  </button>
                  {' '}or use demo credentials below.
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Registration Step 1: Initial Form */}
            {mode === 'register' && !regOtpSent && (
              <>
                {/* Referral Banner */}
                {(referralCode || initialReferralCode) && (
                  <div className="p-3.5 bg-yellow-50 dark:bg-yellow-950/40 border-2 border-yellow-400/60 rounded-2xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                      <Gift className="w-5 h-5 text-slate-950" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 dark:text-yellow-200 flex items-center gap-1.5">
                        <span>Referral Invitation Active</span>
                        <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 font-extrabold text-[11px]">
                          {referralCode || initialReferralCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-yellow-300/80 mt-0.5">
                        Invited via verified referral code. Complete registration to unlock special task rewards!
                      </p>
                    </div>
                  </div>
                )}

                {/* Account Type Selector */}
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Select Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAccountType('user')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        accountType === 'user'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs">
                        <Gift className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                        <span>Task Earner</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        Complete verified offers & earn cash rewards
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountType('client')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        accountType === 'client'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs">
                        <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Advertiser</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        Post campaigns & acquire verified customers
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="register-first-name" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      First Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="register-first-name"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-last-name" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Last Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="register-last-name"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-mobile" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Mobile Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-mobile"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (mobileFieldError) setMobileFieldError(null);
                      }}
                      placeholder="10-digit mobile number"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                        mobileFieldError 
                          ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-600' 
                          : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-600'
                      } bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 text-xs text-slate-900 dark:text-white`}
                    />
                  </div>
                  {mobileFieldError && (
                    <p id="register-mobile-error" className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{mobileFieldError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="auth-email" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Email Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailFieldError) setEmailFieldError(null);
                      }}
                      placeholder="name@gmail.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                        emailFieldError 
                          ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-600' 
                          : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-600'
                      } bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 text-xs text-slate-900 dark:text-white`}
                    />
                  </div>
                  {emailFieldError && (
                    <p id="register-email-error" className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{emailFieldError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="register-password" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Password <span className="text-rose-500 font-bold">*</span>{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Min. 8 characters, letters & numbers)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters (letters & numbers)"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      id="toggle-register-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-confirm-password" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Confirm Password <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      id="toggle-register-confirm-password"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {accountType === 'user' && (
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Referral Code <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="e.g. DSK901"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white uppercase font-mono"
                    />
                  </div>
                )}
              </>
            )}

            {/* Registration Step 2: 6-Digit Email OTP Verification */}
            {mode === 'register' && regOtpSent && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-center space-y-1.5">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">Check Your Email</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    We sent a 6-digit verification code to <span className="font-bold text-blue-600 dark:text-blue-400">{email}</span>. Please check your inbox or spam folder.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    6-Digit Verification Code (OTP) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-otp-input"
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      value={regOtpCode}
                      onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit code"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-base tracking-widest text-center text-blue-600 font-black font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    Code expires in 10 minutes.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRegOtpSent(false);
                      setRegOtpCode('');
                      setError(null);
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Edit Registration Details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendRegOtp}
                    disabled={regResendCooldown > 0 || resending}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                  >
                    {resending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCw className="w-3 h-3" />
                    )}
                    {regResendCooldown > 0 ? `Resend Code (${regResendCooldown}s)` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {/* Login View */}
            {mode === 'login' && (
              <>
                <div>
                  <label htmlFor="auth-login-email" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Email Address or Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-login-email"
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address or 10-digit mobile number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-password" className="block font-bold text-slate-800 dark:text-slate-200">Password</label>
                    <button
                      type="button"
                      onClick={() => onSwitchMode('forgot-password')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      id="toggle-login-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Demo Fill Buttons */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                    <span>Quick Fill Demo Credentials:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('aarav.sharma.test@example.com');
                        setPassword('User@123456');
                        setError(null);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all text-left truncate cursor-pointer"
                    >
                      <span className="block font-bold text-blue-600 dark:text-blue-400">Task Earner</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">aarav.sharma.test@...</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail('client.demo@example.com');
                        setPassword('User@123456');
                        setError(null);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all text-left truncate cursor-pointer"
                    >
                      <span className="block font-bold text-purple-600 dark:text-purple-400">Advertiser</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">client.demo@...</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Forgot Password Step 1: Request OTP */}
            {mode === 'forgot-password' && !otpSent && (
              <div>
                <label htmlFor="forgot-email" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  We will dispatch a secure 6-digit verification code to your email.
                </p>
              </div>
            )}

            {/* Forgot Password Step 2: Verify OTP & Set New Password */}
            {mode === 'forgot-password' && otpSent && (
              <>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    Verification code sent to <span className="font-bold text-blue-600 dark:text-blue-400">{email}</span>
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    6-Digit Verification Code (OTP)
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm tracking-widest text-blue-600 font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    New Password <span className="text-slate-400 font-normal text-[11px]">(Min. 8 characters, letters & numbers)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendResetOtp}
                    disabled={resetResendCooldown > 0 || resending}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                  >
                    {resending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCw className="w-3 h-3" />
                    )}
                    {resetResendCooldown > 0 ? `Resend Code (${resetResendCooldown}s)` : 'Resend Code'}
                  </button>
                </div>
              </>
            )}

            {/* Submit Button in Red */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-red-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In to Account'}
                    {mode === 'register' && (!regOtpSent ? 'Send Verification Code (OTP)' : 'Verify Code & Activate Account')}
                    {mode === 'forgot-password' && (!otpSent ? 'Send 6-Digit Verification OTP' : 'Verify Code & Update Password')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switchers */}
          <div className="text-center pt-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchMode('register')}
                  className="font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Register Free
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchMode('login')}
                  className="font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security disclaimer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Protected by 256-bit SSL encryption. Zero sensitive banking info requested.</span>
        </div>
      </div>
    </div>
  );
};
