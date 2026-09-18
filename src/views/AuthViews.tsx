import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Gift
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthViewsProps {
  mode: 'login' | 'register' | 'forgot-password';
  initialReferralCode?: string;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (data: { name: string; email: string; phone: string; pass: string; role: 'user' | 'client'; referralCode?: string }) => Promise<void>;
  onSwitchMode: (mode: 'login' | 'register' | 'forgot-password') => void;
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  mode,
  initialReferralCode,
  onLogin,
  onRegister,
  onSwitchMode,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  React.useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode);
    }
  }, [initialReferralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      if (mode === 'login') {
        await onLogin(email.trim(), password);
      } else if (mode === 'register') {
        if (!name.trim() || !email.trim() || !phone.trim() || !password) {
          setError("Please fill out all required fields");
          return;
        }
        await onRegister({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          pass: password,
          role: accountType,
          referralCode: referralCode.trim() || undefined,
        });
      } else if (mode === 'forgot-password') {
        if (!email.trim()) {
          setError("Please enter your registered email address");
          return;
        }
        if (isSupabaseConfigured) {
          const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin
          });
          if (resetErr) throw resetErr;
        }
        setResetSent(true);
      }
    } catch (err: any) {
      setError(err.message || "Authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-800 text-white font-black text-lg mx-auto flex items-center justify-center shadow-md">
            DSK
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {mode === 'login' && 'Welcome Back to DSK TaskMarketer'}
            {mode === 'register' && 'Create Your DSK Account'}
            {mode === 'forgot-password' && 'Reset Account Password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Digital Success Key • Complete Tasks • Earn Rewards
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'forgot-password' && resetSent ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Password Reset Link Dispatched</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                If an account exists with {email}, you will receive password reset instructions.
              </p>
              <button
                onClick={() => { setResetSent(false); onSwitchMode('login'); }}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline pt-2 block mx-auto"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {mode === 'register' && (
                <>
                  {/* Referral Context Banner (Requirement 5: Show referral information/status) */}
                  {(referralCode || initialReferralCode) && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500/40 rounded-2xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                          <span>Referral Invitation Active</span>
                          <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px]">
                            {referralCode || initialReferralCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                          Invited via verified referral code. Complete registration to unlock special task rewards!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Account Type Selector: Member vs Client/Advertiser (NO ADMIN OPTION) */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Select Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType('user')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          accountType === 'user'
                            ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Task Earner</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          Complete verified offers & earn cash rewards
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountType('client')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          accountType === 'client'
                            ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>Advertiser</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          Post campaigns & acquire verified customers
                        </p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {accountType === 'client' ? 'Company or Contact Name' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={accountType === 'client' ? 'Acme Corp / John Doe' : 'Your full name'}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Mobile number"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-800 dark:text-slate-200">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => onSwitchMode('forgot-password')}
                        className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && accountType === 'user' && (
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Referral Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="e.g. DSK901"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white uppercase font-mono"
                  />
                </div>
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Sign In to Account'}
                      {mode === 'register' && 'Complete Registration'}
                      {mode === 'forgot-password' && 'Send Password Reset Link'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switchers */}
          <div className="text-center pt-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchMode('register')}
                  className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
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
                  className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security disclaimer */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Protected by 256-bit SSL encryption. We never request banking passwords, card PINs, OTP codes, or CVVs.
        </p>
      </div>
    </div>
  );
};
