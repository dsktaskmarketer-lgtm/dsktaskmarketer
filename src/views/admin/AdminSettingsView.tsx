import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  DollarSign, 
  Phone, 
  FileText,
  Palette,
  Sliders,
  Wallet,
  Building,
  Smartphone,
  Lock,
  ExternalLink,
  UploadCloud,
  RotateCcw,
  Eye,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { PlatformSettings } from '../../types';
import { useTranslation } from '../../locales';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { processLogoFile, getStoredLogo, setStoredLogo, removeStoredLogo } from '../../utils/logoHelper';

interface AdminSettingsViewProps {
  settings: PlatformSettings;
  onUpdateSettings: (settings: Partial<PlatformSettings>) => Promise<void>;
  initialTab?: 'financial' | 'branding' | 'localization' | 'support' | 'compliance';
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  initialTab,
}) => {
  const { t } = useTranslation();
  const { applyBranding } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'financial' | 'branding' | 'support' | 'compliance'>(
    initialTab === 'localization' ? 'financial' : (initialTab || 'financial')
  );

  // Financial & Payout Settings
  const [minWithdrawal, setMinWithdrawal] = useState(settings?.minWithdrawal ?? settings?.minimumWithdrawalLimit ?? 200);
  const [maxWithdrawal, setMaxWithdrawal] = useState(settings?.maxWithdrawal ?? 50000);
  const [payoutMode, setPayoutMode] = useState<'manual' | 'automatic'>(settings?.payoutMode || 'manual');
  const [upiEnabled, setUpiEnabled] = useState(settings?.supportedPayoutMethods?.upi ?? true);
  const [bankEnabled, setBankEnabled] = useState(settings?.supportedPayoutMethods?.bankTransfer ?? true);
  const [manualInstructions, setManualInstructions] = useState(
    settings?.manualPaymentInstructions || 
    "1. Review member's task verification status. 2. Authorize withdrawal request ('Approve for Payment'). 3. Send payment via UPI or NetBanking IMPS. 4. Record Bank UTR Reference and click 'Mark as Paid'."
  );
  const [referralBonus, setReferralBonus] = useState(settings?.referralRewardAmount ?? 100);

  // Branding Settings
  const [platformName, setPlatformName] = useState(settings?.platformName || 'DSK TaskMarketer');
  const [companyName, setCompanyName] = useState(settings?.companyName || 'Digital Success Key Private Limited');
  const [tagline, setTagline] = useState(settings?.tagline || 'Complete Tasks • Earn Rewards');
  const [logoUrl, setLogoUrl] = useState(() => {
    return settings?.logoUrl || getStoredLogo() || '';
  });
  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || '#059669');
  const [accentColor, setAccentColor] = useState(settings?.accentColor || '#10b981');
  const [borderRadius, setBorderRadius] = useState(settings?.borderRadius || '1rem');
  const [themePreset, setThemePreset] = useState(settings?.themePreset || 'DSK Default');

  // Logo Upload & Interactive Drag/Drop State
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Support & Contact
  const [supportEmail, setSupportEmail] = useState(settings?.supportEmail || 'support@dsktaskmarketer.com');
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsappSupportNumber || settings?.whatsappNumber || '+91 98765 43210');
  const [whatsappLink, setWhatsappLink] = useState(settings?.whatsappSupportLink || 'https://wa.me/919876543210?text=Hello%20DSK%20TaskMarketer%20Support');
  const [supportHours, setSupportHours] = useState(settings?.supportHours || 'Monday to Saturday, 9:30 AM to 6:30 PM IST');

  // Compliance Disclaimers
  const [affiliateDisclosure, setAffiliateDisclosure] = useState(settings?.affiliateDisclosureText || settings?.affiliateDisclosure || '');
  const [complianceDisclaimer, setComplianceDisclaimer] = useState(settings?.complianceDisclaimer || '');

  useEffect(() => {
    if (settings) {
      setMinWithdrawal(settings.minWithdrawal ?? settings.minimumWithdrawalLimit ?? 200);
      setMaxWithdrawal(settings.maxWithdrawal ?? 50000);
      setPayoutMode(settings.payoutMode || 'manual');
      if (settings.supportedPayoutMethods) {
        setUpiEnabled(settings.supportedPayoutMethods.upi ?? true);
        setBankEnabled(settings.supportedPayoutMethods.bankTransfer ?? true);
      }
      setReferralBonus(settings.referralRewardAmount ?? 100);
      setPlatformName(settings.platformName || 'DSK TaskMarketer');
      setCompanyName(settings.companyName || 'Digital Success Key Private Limited');
      setTagline(settings.tagline || 'Complete Tasks • Earn Rewards');
      
      const localLogo = getStoredLogo();
      setLogoUrl(settings.logoUrl || localLogo || '');

      setPrimaryColor(settings.primaryColor || '#059669');
      setAccentColor(settings.accentColor || '#10b981');
      setThemePreset(settings.themePreset || 'DSK Default');
      setBorderRadius(settings.borderRadius || '1rem');
      setSupportEmail(settings.supportEmail || 'support@dsktaskmarketer.com');
      setWhatsappNumber(settings.whatsappSupportNumber || settings.whatsappNumber || '+91 98765 43210');
      setWhatsappLink(settings.whatsappSupportLink || '');
      setSupportHours(settings.supportHours || '');
      setAffiliateDisclosure(settings.affiliateDisclosureText || settings.affiliateDisclosure || 'DSK TaskMarketer receives financial affiliate compensation from partner institutions for qualified consumer actions.');
      setComplianceDisclaimer(settings.complianceDisclaimer || 'DSK TaskMarketer is an affiliate marketing platform that provides performance-based rewards for verified customer actions.');
    }
  }, [settings]);

  const handleLogoFileChange = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds 5MB limit. Please upload a smaller logo.', 'error');
      return;
    }

    try {
      const { dataUrl, sizeKb } = await processLogoFile(file);
      setLogoUrl(dataUrl);
      setLogoPreviewError(false);
      setUploadStatus(`${file.name} (${sizeKb} KB - Optimized)`);
      setStoredLogo(dataUrl);
      showToast('Business logo loaded and saved to browser cache! Click "Save Settings" to confirm.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to process logo image. Please try PNG or JPG.', 'error');
    }
  };

  const handleResetLogo = async () => {
    setLogoUrl('');
    setLogoPreviewError(false);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    removeStoredLogo();
    try {
      await onUpdateSettings({ logoUrl: '' });
    } catch {}
    showToast('Reset to default DSK logo badge', 'info');
  };

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const payload: Partial<PlatformSettings> = {
        platformName: platformName.trim(),
        companyName: companyName.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),
        primaryColor,
        accentColor,
        themePreset,
        borderRadius,
        minWithdrawal: Number(minWithdrawal),
        minimumWithdrawalLimit: Number(minWithdrawal),
        maxWithdrawal: Number(maxWithdrawal),
        payoutMode,
        autoPayoutEnabled: payoutMode === 'automatic',
        supportedPayoutMethods: {
          upi: upiEnabled,
          bankTransfer: bankEnabled,
        },
        manualPaymentInstructions: manualInstructions.trim(),
        referralRewardAmount: Number(referralBonus),
        defaultLanguage: 'en',
        enabledLanguages: ['en'],
        supportEmail: supportEmail.trim(),
        whatsappSupportNumber: whatsappNumber.trim(),
        whatsappNumber: whatsappNumber.trim(),
        whatsappSupportLink: whatsappLink.trim(),
        supportHours: supportHours.trim(),
        affiliateDisclosureText: affiliateDisclosure.trim(),
        affiliateDisclosure: affiliateDisclosure.trim(),
        complianceDisclaimer: complianceDisclaimer.trim(),
      };

      await onUpdateSettings(payload);
      applyBranding(payload);

      setStoredLogo(logoUrl.trim());

      showToast('Settings & Business Branding saved successfully!', 'success');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to update platform settings");
      showToast(err.message || "Failed to update settings", 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-md inline-block mb-1">
          System Administration
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Platform Settings & Control Center</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage payout rules, manual payment workflows, official DSK branding, support desk, and compliance disclaimers.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'financial'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Payouts & Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Branding & Logo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'support'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>WhatsApp & Support</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'compliance'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Compliance Disclaimers</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Settings saved and brand styling updated successfully!</span>
          </div>
        )}

        {/* TAB 1: Payouts & Rules */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Payout Mode & Execution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select between manual verification & bank transfer (standard fintech practice) or future automated payout API.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setPayoutMode('manual')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    payoutMode === 'manual'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Manual Mode (Default / Active)</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Admin audits member task submissions, authorizes payment, sends funds via UPI/IMPS NetBanking, and records the Bank UTR. Zero fake automatic payments.
                  </p>
                </div>

                <div 
                  onClick={() => setPayoutMode('automatic')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    payoutMode === 'automatic'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Automatic Mode (API Gateway)</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      Future Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Prepared for automated payout webhook integration (e.g. Cashfree Payouts / RazorpayX). Falls back gracefully when unconfigured.
                  </p>
                </div>
              </div>

              {/* Supported Payment Channels */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Supported Member Withdrawal Channels
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={upiEnabled}
                      onChange={(e) => setUpiEnabled(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Enable Instant UPI Transfers</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bankEnabled}
                      onChange={(e) => setBankEnabled(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Enable Bank Accounts (IMPS/NEFT)</span>
                  </label>
                </div>
              </div>

              {/* Thresholds */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Minimum Withdrawal Limit (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={minWithdrawal}
                    onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Min balance required to submit payout.</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Maximum Withdrawal Cap (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={minWithdrawal}
                    value={maxWithdrawal}
                    onChange={(e) => setMaxWithdrawal(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Maximum allowed per single request.</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Referral Reward Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={referralBonus}
                    onChange={(e) => setReferralBonus(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Credited upon qualifying completed task.</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Manual Payment Processing Checklist & Instructions
                </label>
                <textarea
                  rows={3}
                  value={manualInstructions}
                  onChange={(e) => setManualInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Branding & Logo */}
        {activeTab === 'branding' && (
          <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-600" />
                  DSK TaskMarketer Visual Identity & Branding
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure platform title, company name, primary brand colors, and upload your official business logo.
                </p>
              </div>

              {/* Status Indicator & Reset Button */}
              <div className="flex items-center gap-2 shrink-0">
                {logoUrl ? (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1.5 transition-colors shadow-2xs"
                    title="Reset to Default Logo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Default Logo</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Default "DSK" Emblem Active
                  </span>
                )}
              </div>
            </div>

            {/* BUSINESS LOGO UPLOAD SECTION */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Business Logo Upload
                      {logoUrl ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Custom Logo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Default Emblem
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload an official logo image (PNG, JPG, SVG, WEBP) or specify an image URL. Automatically scales in the header navbar (`max-height: 40px`, `object-fit: contain`).
                    </p>
                  </div>
                </div>

                {logoUrl && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 self-start sm:self-auto">
                    <Check className="w-3.5 h-3.5" />
                    Custom logo ready to save
                  </span>
                )}
              </div>

              {/* Upload Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: File Drag & Drop / File Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Option A: Upload Logo Image File
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleLogoFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                      isDraggingLogo 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png, .jpg, .jpeg, .svg, .webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLogoFileChange(e.target.files[0]);
                        }
                      }}
                    />
                    <UploadCloud className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Click to choose file or drag & drop here
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      PNG, JPG, SVG, or WEBP (Max 3MB • Transparent PNG or SVG recommended)
                    </p>
                    {uploadStatus && (
                      <span className="mt-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        ✓ {uploadStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Option 2: Image URL & Action Card */}
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Option B: Or Provide Direct Image URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLogoUrl(val);
                          setLogoPreviewError(false);
                          try {
                            if (val.trim()) {
                              localStorage.setItem('dsk_custom_logo', val.trim());
                            } else {
                              localStorage.removeItem('dsk_custom_logo');
                            }
                            window.dispatchEvent(new Event('dsk_logo_updated'));
                          } catch {}
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Enter any public image URL (CDN, Cloudinary, AWS S3, or self-hosted asset).
                    </p>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Session & Refresh Persistence
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        The uploaded logo automatically saves to browser storage and synchronizes with the server settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE NAVBAR PREVIEW */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Header Navbar Live Preview
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">CSS: max-height: 40px • object-fit: contain</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Light Header Navbar Simulation */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-between">
                      <span>Light Header Simulation</span>
                      <span className="text-emerald-600 font-semibold">Preview</span>
                    </div>
                    <div className="h-14 bg-white rounded-lg px-3 flex items-center gap-3 border border-slate-100">
                      {logoUrl && !logoPreviewError ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={logoUrl}
                            alt="Logo Preview"
                            className="max-h-[40px] h-9 w-auto object-contain shrink-0"
                            style={{ maxHeight: '40px', objectFit: 'contain' }}
                            onError={() => setLogoPreviewError(true)}
                          />
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 rounded-md">
                            Admin
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-700 flex items-center justify-center text-white font-black text-xs shrink-0"
                            style={{ maxHeight: '40px' }}
                          >
                            DSK
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 text-sm truncate">
                                {platformName || 'DSK TaskMarketer'}
                              </span>
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 rounded-md">
                                Admin
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {tagline || 'Complete Tasks • Earn Rewards'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dark Header Navbar Simulation */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-between">
                      <span>Dark Header Simulation</span>
                      <span className="text-emerald-400 font-semibold">Night Mode</span>
                    </div>
                    <div className="h-14 bg-slate-950 rounded-lg px-3 flex items-center gap-3 border border-slate-800">
                      {logoUrl && !logoPreviewError ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={logoUrl}
                            alt="Logo Preview"
                            className="max-h-[40px] h-9 w-auto object-contain shrink-0"
                            style={{ maxHeight: '40px', objectFit: 'contain' }}
                            onError={() => setLogoPreviewError(true)}
                          />
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 rounded-md">
                            Admin
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 flex items-center justify-center text-white font-black text-xs shrink-0"
                            style={{ maxHeight: '40px' }}
                          >
                            DSK
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-sm truncate">
                                {platformName || 'DSK TaskMarketer'}
                              </span>
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 rounded-md">
                                Admin
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">
                              {tagline || 'Complete Tasks • Earn Rewards'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {logoPreviewError && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Failed to render logo preview from current source. The header will use the default "DSK" emblem fallback.
                  </p>
                )}
              </div>
            </div>

            {/* Platform Text Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  required
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Operating Company Full Form</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Tagline</label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Color Pickers & Presets */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Primary Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Accent Highlight Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Component Corner Radius</label>
                <select
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="0.5rem">Subtle (8px)</option>
                  <option value="1rem">Modern Standard (16px)</option>
                  <option value="1.5rem">Soft Rounded (24px)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Support & WhatsApp */}
        {activeTab === 'support' && (
          <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                Customer Support & WhatsApp Desk
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Keep support channels updated so members can receive real-time assistance with submission audits and payouts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Official WhatsApp Support Number</label>
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">WhatsApp Direct Chat Link</label>
                <input
                  type="url"
                  required
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Support Email Address</label>
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Operational Support Hours</label>
                <input
                  type="text"
                  required
                  value={supportHours}
                  onChange={(e) => setSupportHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Compliance Disclaimers */}
        {activeTab === 'compliance' && (
          <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Compliance Disclaimers & Disclosures
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Maintain financial marketing regulatory compliance. No guaranteed approval and no banking credential collection.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Affiliate Revenue Disclosure Statement
              </label>
              <textarea
                rows={3}
                required
                value={affiliateDisclosure}
                onChange={(e) => setAffiliateDisclosure(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Partner Audit & No-Guaranteed-Approval Disclaimer
              </label>
              <textarea
                rows={4}
                required
                value={complianceDisclaimer}
                onChange={(e) => setComplianceDisclaimer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Action Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Configurations...' : 'Save All Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
