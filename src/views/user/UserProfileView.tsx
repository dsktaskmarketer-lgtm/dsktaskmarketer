import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  ClipboardList,
  Wallet,
  Users,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { User, ThemeMode, WalletSummary } from '../../types';
import { useTranslation } from '../../locales';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ProfileSectionIllustration } from '../../components/illustrations';

interface UserProfileViewProps {
  user: User;
  wallet?: WalletSummary;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
  onNavigate?: (view: string) => void;
  onLogout?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  wallet,
  onUpdateProfile,
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState((user as any)?.phone || user?.mobile || '');
  const [upiId, setUpiId] = useState((user as any)?.upiId || user?.payoutDetails?.upiId || '');
  const [bankAccountNumber, setBankAccountNumber] = useState((user as any)?.bankAccountNumber || user?.payoutDetails?.bankAccount || '');
  const [bankIfsc, setBankIfsc] = useState((user as any)?.bankIfsc || user?.payoutDetails?.ifsc || '');
  const [accountHolderName, setAccountHolderName] = useState((user as any)?.accountHolderName || user?.payoutDetails?.accountHolderName || user?.name || '');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone((user as any).phone || user.mobile || '');
      setUpiId((user as any).upiId || user.payoutDetails?.upiId || '');
      setBankAccountNumber((user as any).bankAccountNumber || user.payoutDetails?.bankAccount || '');
      setBankIfsc((user as any).bankIfsc || user.payoutDetails?.ifsc || '');
      setAccountHolderName((user as any).accountHolderName || user.payoutDetails?.accountHolderName || user.name || '');
    }
  }, [user]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleThemeChange = async (mode: ThemeMode) => {
    setThemeMode(mode);
    showToast('Preferences updated.');

    try {
      await onUpdateProfile({ themePreference: mode });
    } catch (e) {
      // localStorage already updated as primary cache
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await onUpdateProfile({
        name,
        phone,
        mobile: phone,
        themePreference: themeMode,
        languagePreference: 'en',
        upiId: upiId.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
        accountHolderName: accountHolderName.trim() || undefined,
      } as any);

      setSuccess(true);
      showToast(t('settings.profileSaved', 'Profile saved successfully!'));
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  // Get user avatar initials
  const initials = (name || user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'U';

  const totalEarnings = wallet?.totalEarned ?? 0;
  const availableBalance = wallet?.availableBalance ?? 0;

  return (
    <div className="w-full px-2.5 sm:px-6 py-3 sm:py-8 space-y-3 sm:space-6">
      {/* Profile Section Anime Hero Illustration */}
      <div className="w-full flex justify-center py-2">
        <ProfileSectionIllustration size="md" className="max-w-[340px] sm:max-w-[420px]" />
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-3xl p-3 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden">
        <div className="flex flex-row items-center gap-3 sm:gap-5">
          {/* Avatar with gradient & verified badge */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex items-center justify-center font-black text-sm sm:text-3xl shadow-lg shadow-blue-600/30 border-2 sm:border-4 border-white dark:border-slate-800">
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 sm:p-1 rounded-full border border-white dark:border-slate-800 shadow-2xs" title="Verified Member">
              <ShieldCheck className="w-2.5 sm:w-4 h-2.5 sm:h-4" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-left space-y-0.5 sm:space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                {name || user?.name || 'Verified Member'}
              </h1>
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                <CheckCircle2 className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-emerald-600 dark:text-emerald-400" />
                Verified
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              {user?.id && (
                <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                  User ID: <span className="font-mono font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-800/80">{user.id}</span>
                </span>
              )}
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </span>
              {(phone || (user as any)?.phone || user?.mobile) && (
                <span className="hidden sm:flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  {phone || (user as any)?.phone || user?.mobile}
                </span>
              )}
            </div>

            {user?.referralCode && (
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                Ref Code: <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/60">{user.referralCode}</span>
              </p>
            )}
          </div>

          {/* Edit Profile Button */}
          <div className="shrink-0">
            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <SettingsIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span className="hidden sm:inline">{showSettingsDrawer ? 'Hide Details' : 'Edit Details'}</span>
              <span className="sm:hidden">{showSettingsDrawer ? 'Hide' : 'Edit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Total Earnings Card - Royal Blue Gradient (Matches Reference Screen 6) */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-7 shadow-xl shadow-blue-700/20 border border-blue-500/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-yellow-300" />
              <span>Total Earnings</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
              <span>₹ {totalEarnings.toLocaleString('en-IN')}</span>
              <span className="text-xs text-yellow-300 font-bold bg-white/15 px-2 py-0.5 rounded-full">
                All Time
              </span>
            </div>
            <p className="text-xs text-blue-100">
              Available Balance: <strong className="text-white font-bold">₹ {availableBalance.toLocaleString('en-IN')}</strong>
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('wallet')}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Wallet className="w-4 h-4 text-slate-950" />
              <span>Go to Wallet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modern Profile Options Menu (Section 9 Specification) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-3 py-1">
          Account Navigation
        </h2>

        {/* Option: My Tasks */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('tasks')}
            className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  My Tasks
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  View started tasks, submissions & status
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </button>
        )}

        {/* Option: My Wallet */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('wallet')}
            className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-200/60 dark:border-yellow-800/60">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                  My Wallet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Withdrawals, available balance & ledger
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                ₹{availableBalance}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
            </div>
          </button>
        )}

        {/* Option: Referral & Earn */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('referrals')}
            className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/60">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Referral & Earn
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Invite friends & earn ₹50 per qualifying referral
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                ₹50 / ref
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
            </div>
          </button>
        )}

        {/* Option: Settings & Preferences */}
        <button
          onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
          className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Settings & Payout Accounts
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update UPI ID, Bank details, theme & name
              </p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showSettingsDrawer ? 'rotate-90' : ''}`} />
        </button>

        {/* Option: Help & Support */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('support')}
            className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Help & Support
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Open support ticket or view FAQs
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </button>
        )}

        {/* Option: Logout */}
        {onLogout && (
          <div className="pt-2">
            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left group cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-800/60">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                      Logout
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sign out from this device safely
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-rose-400" />
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Are you sure you want to sign out?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onLogout}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs cursor-pointer"
                  >
                    Confirm Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Form & Theme (Expanded when clicked) */}
      {showSettingsDrawer && (
        <div className="space-y-6 pt-2">
          {/* Preferences & Appearance Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t('settings.preferences', 'Preferences & Appearance')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize theme mode across all sessions.
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-yellow-500 shrink-0" />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 max-w-md">
              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('settings.theme', 'Appearance')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      themeMode === 'light'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{t('settings.light', 'Light')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      themeMode === 'dark'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>{t('settings.dark', 'Dark')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('system')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      themeMode === 'system'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-slate-400" />
                    <span>{t('settings.system', 'System')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{t('settings.profileSaved', 'Profile and payout information saved successfully!')}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {t('settings.profileDetails', 'Personal Information')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('auth.fullName', 'Full Name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={name || ''}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('auth.email', 'Email Address')}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs cursor-not-allowed font-medium"
                  />
                  <span className="text-[10px] text-slate-400">Email is fixed to your account identifier</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('auth.mobile', 'Mobile Number')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone || ''}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.id || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono font-black text-xs cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400">Your unique DSK TaskMarketer identifier</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('auth.referralCode', 'Referral Code')}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.referralCode || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-800/60 text-blue-900 dark:text-blue-300 font-mono font-black text-xs cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Saved Payout Methods */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t('settings.payoutDestination', 'Saved Payout Destination')}
                </h3>
                <span className="text-[10px] font-black text-yellow-950 bg-yellow-400 px-2.5 py-0.5 rounded-full border border-yellow-500">
                  Zero Confidential Data
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('withdrawals.enterUpi', 'Primary UPI ID')}
                  </label>
                  <input
                    type="text"
                    value={upiId || ''}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi or username@okhdfcbank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {t('withdrawals.bankTransfer', 'Direct Bank Account Details')}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {t('withdrawals.accountHolder', 'Account Holder Name')}
                      </label>
                      <input
                        type="text"
                        value={accountHolderName || ''}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="Legal name on bank passbook"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {t('withdrawals.accountNumber', 'Bank Account Number')}
                      </label>
                      <input
                        type="text"
                        value={bankAccountNumber || ''}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="e.g. 50100234567890"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {t('withdrawals.ifsc', 'Bank IFSC Code')}
                      </label>
                      <input
                        type="text"
                        value={bankIfsc || ''}
                        onChange={(e) => setBankIfsc(e.target.value)}
                        placeholder="e.g. HDFC0001234"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md shadow-red-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t('settings.saving', 'Saving...') : t('settings.saveChanges', 'Save Profile Changes')}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
