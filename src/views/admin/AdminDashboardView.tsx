import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  FileCheck, 
  Wallet, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Settings,
  ShieldCheck,
  Eye,
  Smartphone,
  Building,
  UploadCloud,
  RotateCcw,
  Check,
  Image as ImageIcon,
  Save
} from 'lucide-react';
import { AdminMetrics, TaskSubmission, WithdrawalItem, Task, WithdrawalStatus, PlatformSettings } from '../../types';
import { WithdrawalDetailsDrawer } from '../../components/admin/WithdrawalDetailsDrawer';
import { useTranslation } from '../../locales';
import { useToast } from '../../context/ToastContext';
import { processLogoFile, getStoredLogo, setStoredLogo, removeStoredLogo } from '../../utils/logoHelper';

interface AdminDashboardViewProps {
  metrics: AdminMetrics;
  recentSubmissions: TaskSubmission[];
  recentWithdrawals: WithdrawalItem[];
  tasks: Task[];
  settings?: PlatformSettings;
  onNavigate: (view: string) => void;
  onUpdateSubmissionStatus: (submissionId: string, status: 'under_verification' | 'approved' | 'rejected', reason?: string) => Promise<void>;
  onProcessWithdrawal: (id: string, ref: string) => Promise<void>;
  onUpdateWithdrawalStatus?: (id: string, status: string, options?: any) => Promise<void>;
  onUpdateSettings?: (settings: Partial<PlatformSettings>) => Promise<void>;
  onRefresh?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  metrics,
  recentSubmissions,
  recentWithdrawals,
  tasks,
  settings,
  onNavigate,
  onUpdateSubmissionStatus,
  onProcessWithdrawal,
  onUpdateWithdrawalStatus,
  onUpdateSettings,
  onRefresh
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Business Logo Upload States
  const [logoInput, setLogoInput] = useState(() => {
    return settings?.logoUrl || getStoredLogo() || '';
  });
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const current = settings?.logoUrl || getStoredLogo() || '';
    setLogoInput(current);
  }, [settings?.logoUrl]);

  // Sync when logo is updated anywhere in app
  useEffect(() => {
    const handleLogoSync = () => {
      const stored = getStoredLogo();
      if (stored !== logoInput) {
        setLogoInput(stored);
        setLogoPreviewError(false);
      }
    };
    window.addEventListener('dsk_logo_updated', handleLogoSync);
    return () => window.removeEventListener('dsk_logo_updated', handleLogoSync);
  }, [logoInput]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('File exceeds 5MB limit. Please choose a smaller logo.', 'error');
      return;
    }

    try {
      const { dataUrl, sizeKb } = await processLogoFile(file);
      setLogoInput(dataUrl);
      setLogoPreviewError(false);
      setUploadStatus(`${file.name} (${sizeKb} KB - Optimized)`);
      setStoredLogo(dataUrl);
      if (onUpdateSettings) {
        await onUpdateSettings({ logoUrl: dataUrl });
      }
      showToast('Business logo uploaded & updated in top header!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload logo image', 'error');
    }
  };

  const handleSaveLogoUrl = async () => {
    try {
      setSavingLogo(true);
      const cleanUrl = logoInput.trim();
      setStoredLogo(cleanUrl);
      if (onUpdateSettings) {
        await onUpdateSettings({ logoUrl: cleanUrl });
      }
      showToast(cleanUrl ? 'Business logo saved & updated in top header!' : 'Logo cleared.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save logo', 'error');
    } finally {
      setSavingLogo(false);
    }
  };

  const handleResetToDefault = async () => {
    setLogoInput('');
    setLogoPreviewError(false);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    removeStoredLogo();
    if (onUpdateSettings) {
      try {
        await onUpdateSettings({ logoUrl: '' });
      } catch {}
    }
    showToast('Reset to default DSK emblem & logo in header', 'info');
  };

  const pendingSubmissions = recentSubmissions.filter(
    s => s.status === 'pending_review' || s.status === 'under_verification'
  );
  
  const normalizedWithdrawals = recentWithdrawals.map(w => {
    let normalizedStatus: WithdrawalStatus = w.status;
    if (w.status === 'requested' || w.status === 'processing') {
      normalizedStatus = 'pending';
    } else if (w.status === 'processed') {
      normalizedStatus = 'paid';
    }
    return {
      ...w,
      status: normalizedStatus,
      paymentMethod: w.paymentMethod || ((w as any).payoutMethod as any) || 'upi',
      upiId: w.upiId || (w as any).payoutDetails?.upiId,
      accountHolderName: w.accountHolderName || (w as any).payoutDetails?.accountHolderName,
      bankAccountNumber: w.bankAccountNumber || (w as any).payoutDetails?.bankAccount,
      bankIfsc: w.bankIfsc || (w as any).payoutDetails?.ifsc,
    };
  });

  const pendingWithdrawals = normalizedWithdrawals.filter(w => w.status === 'pending' || w.status === 'approved');

  const handleOpenWithdrawal = (w: WithdrawalItem) => {
    setSelectedWithdrawal(w);
    setIsDrawerOpen(true);
  };

  const handleApprove = async (id: string, note?: string) => {
    if (onUpdateWithdrawalStatus) {
      await onUpdateWithdrawalStatus(id, 'approved', { adminNote: note });
    }
    if (onRefresh) onRefresh();
  };

  const handleMarkAsPaid = async (id: string, data: {
    paymentReference: string;
    paidAmount: number;
    paidDate: string;
    paymentMethod: string;
    adminNote?: string;
  }) => {
    if (onUpdateWithdrawalStatus) {
      await onUpdateWithdrawalStatus(id, 'paid', data);
    } else if (onProcessWithdrawal) {
      await onProcessWithdrawal(id, data.paymentReference);
    }
    if (onRefresh) onRefresh();
  };

  const handleReject = async (id: string, reason: string, note?: string) => {
    if (onUpdateWithdrawalStatus) {
      await onUpdateWithdrawalStatus(id, 'rejected', { rejectionReason: reason, adminNote: note });
    }
    if (onRefresh) onRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Title Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white rounded-md">
              Executive Console
            </span>
            <span className="text-xs text-slate-400 font-mono">DSK TaskMarketer Core</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Platform Administration</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit submissions against affiliate reports, release verified rewards, and disburse withdrawals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('admin-submissions')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FileCheck className="w-4 h-4" />
            <span>Review Submissions ({metrics.pendingSubmissions})</span>
          </button>
          <button
            onClick={() => onNavigate('admin-tasks')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
          <button
            onClick={() => onNavigate('admin-settings')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            title="Upload Business Logo & Settings"
          >
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>Logo & Settings</span>
          </button>
        </div>
      </div>

      {/* 5 High-Level Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div 
          onClick={() => onNavigate('admin-users')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-slate-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Registered Users</span>
            <Users className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalUsers}</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Active platform members</p>
        </div>

        {/* Active Tasks */}
        <div 
          onClick={() => onNavigate('admin-tasks')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-slate-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Tasks</span>
            <Layers className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.activeTasks}</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Live affiliate offers</p>
        </div>

        {/* Pending Submissions */}
        <div 
          onClick={() => onNavigate('admin-submissions')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs hover:border-amber-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Audit</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-200">{metrics.pendingSubmissions}</div>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-1">Require verification</p>
        </div>

        {/* Distributed Rewards */}
        <div 
          onClick={() => onNavigate('admin-rewards')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs hover:border-emerald-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rewards Credited</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-950 dark:text-emerald-200">₹{metrics.totalRewardsPaid}</div>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">Approved payouts ledger</p>
        </div>

        {/* Pending Withdrawals */}
        <div 
          onClick={() => onNavigate('admin-withdrawals')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs hover:border-indigo-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Payouts</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-indigo-950 dark:text-indigo-200">{metrics.pendingWithdrawals}</div>
          <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold mt-1">UPI & Bank transfers</p>
        </div>
      </div>

      {/* ===================== BUSINESS LOGO UPLOAD SECTION ===================== */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Business Logo Upload
                </h2>
                {logoInput ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Custom Logo Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Default "DSK" Emblem
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize the top header logo displayed to all users. Upload a PNG, JPG, SVG, or provide an image URL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {logoInput && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Revert header to default DSK emblem"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Logo</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('admin-settings')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Full Branding Settings</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Drag & Drop File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Upload Logo File (PNG, JPG, SVG, WEBP)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png, .jpg, .jpeg, .svg, .webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drag & drop logo file here
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Optimized automatically for crisp 40px navbar display • Max 5MB
              </p>
              {uploadStatus && (
                <span className="mt-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {uploadStatus}
                </span>
              )}
            </div>
          </div>

          {/* Right: URL Input + Header Navbar Live Simulation */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Or Provide Direct Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoInput}
                  onChange={(e) => {
                    setLogoInput(e.target.value);
                    setLogoPreviewError(false);
                  }}
                  className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  disabled={savingLogo}
                  onClick={handleSaveLogoUrl}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingLogo ? 'Saving...' : 'Save Logo'}</span>
                </button>
              </div>
            </div>

            {/* Header Live Preview Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Top Header Live Simulation (max-height: 40px, object-fit: contain)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Reactive</span>
              </div>

              <div className="h-12 bg-white dark:bg-slate-950 rounded-xl px-3 flex items-center justify-between border border-slate-200 dark:border-slate-800 shadow-2xs">
                {logoInput && !logoPreviewError ? (
                  /* Custom Dynamic Image Component */
                  <div className="flex items-center gap-2 shrink-0">
                    <img
                      src={logoInput}
                      alt="Navbar Preview"
                      className="max-h-[40px] h-8 sm:h-9 w-auto object-contain shrink-0"
                      style={{ maxHeight: '40px', objectFit: 'contain' }}
                      onError={() => setLogoPreviewError(true)}
                    />
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-md shrink-0">
                      Admin
                    </span>
                  </div>
                ) : (
                  /* Fallback to Default "DSK" Logo/Text */
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div 
                      className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-700 dark:from-emerald-700 dark:to-teal-900 flex items-center justify-center text-white font-black text-xs shrink-0"
                      style={{ maxHeight: '40px' }}
                    >
                      DSK
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {settings?.platformName || 'DSK TaskMarketer'}
                        </span>
                        <span className="px-1.5 py-0.2 text-[8px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded shrink-0">
                          Admin
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-none">
                        {settings?.tagline || 'Complete Tasks • Earn Rewards'}
                      </p>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  {logoInput && !logoPreviewError ? '✓ Replaced static emblem with custom logo' : '• Using default DSK emblem'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Column: Submissions Awaiting Audit & Pending Withdrawals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submissions Action Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Task Submissions Awaiting Audit</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cross-check Application IDs with affiliate reports</p>
            </div>
            <button
              onClick={() => onNavigate('admin-submissions')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              View all ({pendingSubmissions.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              All submissions have been verified and processed!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.slice(0, 4).map(sub => (
                <div 
                  key={sub.id} 
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 max-w-[240px]">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{sub.taskTitle}</p>
                    <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300">Ref: {sub.proofApplicationId || 'N/A'}</p>
                    <span className="text-[10px] text-slate-400">User: {sub.userId} • ₹{sub.rewardAmount}*</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onUpdateSubmissionStatus(sub.id, 'approved')}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors"
                    >
                      Approve (₹{sub.rewardAmount})
                    </button>
                    <button
                      onClick={() => onUpdateSubmissionStatus(sub.id, 'rejected', 'Verification failed: Application ID not found in partner audit.')}
                      className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] rounded-lg border border-rose-200 dark:border-rose-800 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawals Action Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pending Withdrawals Queue</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Disburse funds to user-specified UPI/Bank</p>
            </div>
            <button
              onClick={() => onNavigate('admin-withdrawals')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              View all ({pendingWithdrawals.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingWithdrawals.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              No pending withdrawal requests in the queue.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.slice(0, 4).map(w => (
                <div 
                  key={w.id} 
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition-colors cursor-pointer"
                  onClick={() => handleOpenWithdrawal(w)}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">₹{w.amount}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        w.status === 'approved' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                      }`}>
                        {w.status === 'approved' ? 'Approved (Ready to Pay)' : 'Pending Review'}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {w.paymentMethod === 'upi' ? (
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-emerald-600" />
                          {w.upiId || 'UPI'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-blue-600" />
                          A/C: •••• {w.bankAccountNumber?.slice(-4) || '••••'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenWithdrawal(w)}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-[11px] rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Review</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shared Details & Action Drawer */}
      <WithdrawalDetailsDrawer
        withdrawal={selectedWithdrawal}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={handleApprove}
        onMarkAsPaid={handleMarkAsPaid}
        onReject={handleReject}
      />
    </div>
  );
};
