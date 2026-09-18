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
  Sparkles
} from 'lucide-react';
import { User, ThemeMode } from '../../types';
import { useTranslation } from '../../locales';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

interface UserProfileViewProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  onUpdateProfile,
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md inline-block mb-1">
          {t('settings.title', 'Settings & Preferences')}
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {t('nav.profile', 'Profile & Settings')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('settings.themeSubtitle', 'Manage your interface preferences, personal details, and saved withdrawal routing accounts.')}
        </p>
      </div>

      {/* Preferences & Appearance Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('settings.preferences', 'Preferences & Appearance')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize theme mode across all sessions.
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
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
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                  themeMode === 'light'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{t('settings.light', 'Light')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                  themeMode === 'dark'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>{t('settings.dark', 'Dark')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                  themeMode === 'system'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20'
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs cursor-not-allowed"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {t('auth.referralCode', 'Referral Code')}
              </label>
              <input
                type="text"
                disabled
                value={user?.referralCode || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Saved Payout Methods */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('settings.payoutDestination', 'Saved Payout Destination')}
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white font-mono"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white font-mono"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white font-mono uppercase"
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
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('settings.saving', 'Saving...') : t('settings.saveChanges', 'Save Profile Changes')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
