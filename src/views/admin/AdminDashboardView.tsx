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
  const [processingSubId, setProcessingSubId] = useState<string | null>(null);

  const handleDashboardApprove = async (sub: TaskSubmission) => {
    try {
      setProcessingSubId(sub.id);
      await onUpdateSubmissionStatus(sub.id, 'approved');
      showToast(`Approved submission for "${sub.taskTitle}". ₹${sub.rewardAmount} credited!`, 'success');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve submission', 'error');
    } finally {
      setProcessingSubId(null);
    }
  };

  const handleDashboardReject = async (sub: TaskSubmission) => {
    try {
      setProcessingSubId(sub.id);
      await onUpdateSubmissionStatus(sub.id, 'rejected', 'Verification failed: Application ID not found in partner audit.');
      showToast('Submission marked as rejected.', 'info');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject submission', 'error');
    } finally {
      setProcessingSubId(null);
    }
  };

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
    <div className="w-full space-y-8 text-[#0B1F4D]">
      {/* Admin Title Banner */}
      <div className="bg-[#0B1F4D] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-900 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-600 text-white rounded-md">
              Executive Console
            </span>
            <span className="text-xs text-yellow-400 font-mono font-bold">DSK TaskMarketer Core</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 text-white">Platform Administration</h1>
          <p className="text-xs text-blue-200 mt-0.5">
            Audit submissions against affiliate reports, release verified rewards, and disburse withdrawals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('admin-submissions')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-yellow-300" />
            <span>Review Submissions ({metrics.pendingSubmissions})</span>
          </button>
          <button
            onClick={() => onNavigate('admin-tasks')}
            className="px-4 py-2.5 bg-[#07152F] hover:bg-blue-950 text-white font-bold text-xs rounded-xl border border-blue-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-yellow-300" />
            <span>Create Task</span>
          </button>
          <button
            onClick={() => onNavigate('admin-settings')}
            className="px-4 py-2.5 bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs rounded-xl border border-blue-600 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Upload Business Logo & Settings"
          >
            <UploadCloud className="w-4 h-4 text-yellow-300" />
            <span>Logo & Settings</span>
          </button>
        </div>
      </div>

      {/* 5 High-Level Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div 
          onClick={() => onNavigate('admin-users')}
          className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xs hover:border-blue-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#0B1F4D]/70 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B1F4D]">Registered Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1F4D]">{metrics.totalUsers}</div>
          <p className="text-[10px] text-[#0B1F4D]/70 mt-1">Active platform members</p>
        </div>

        {/* Active Tasks */}
        <div 
          onClick={() => onNavigate('admin-tasks')}
          className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xs hover:border-blue-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#0B1F4D]/70 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B1F4D]">Active Tasks</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1F4D]">{metrics.activeTasks}</div>
          <p className="text-[10px] text-[#0B1F4D]/70 mt-1">Live affiliate offers</p>
        </div>

        {/* Pending Submissions */}
        <div 
          onClick={() => onNavigate('admin-submissions')}
          className="bg-yellow-50 rounded-2xl p-5 border border-yellow-300 shadow-xs hover:border-yellow-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#0B1F4D] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B1F4D]">Pending Audit</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1F4D]">{metrics.pendingSubmissions}</div>
          <p className="text-[10px] text-[#0B1F4D] font-semibold mt-1">Require verification</p>
        </div>

        {/* Distributed Rewards */}
        <div 
          onClick={() => onNavigate('admin-rewards')}
          className="bg-blue-50 rounded-2xl p-5 border border-blue-200 shadow-xs hover:border-blue-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B1F4D]">Rewards Credited</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">₹{metrics.totalRewardsPaid}</div>
          <p className="text-[10px] text-blue-700 font-semibold mt-1">Approved payouts ledger</p>
        </div>

        {/* Pending Withdrawals */}
        <div 
          onClick={() => onNavigate('admin-withdrawals')}
          className="bg-yellow-50 rounded-2xl p-5 border border-yellow-300 shadow-xs hover:border-yellow-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#0B1F4D] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B1F4D]">Pending Payouts</span>
            <Wallet className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1F4D]">{metrics.pendingWithdrawals}</div>
          <p className="text-[10px] text-[#0B1F4D] font-semibold mt-1">UPI & Bank transfers</p>
        </div>
      </div>

      {/* ===================== BUSINESS LOGO UPLOAD SECTION ===================== */}
      <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
              <UploadCloud className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0B1F4D]">
                  Business Logo Upload
                </h2>
                {logoInput ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                    Custom Logo Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    Default "DSK" Emblem
                  </span>
                )}
              </div>
              <p className="text-xs text-[#0B1F4D]/70 mt-0.5">
                Customize the top header logo displayed to all users. Upload a PNG, JPG, SVG, or provide an image URL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {logoInput && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Revert header to default DSK emblem"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                <span>Reset to Default Logo</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('admin-settings')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Branding Settings</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Drag & Drop File Upload */}
          <div>
            <label className="block text-xs font-bold text-[#0B1F4D] mb-1.5">
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
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 bg-blue-50/20'
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
              <UploadCloud className="w-8 h-8 text-blue-600 mb-1.5" />
              <p className="text-xs font-bold text-[#0B1F4D]">
                Click to browse or drag & drop logo file here
              </p>
              <p className="text-[10px] text-[#0B1F4D]/70 mt-1">
                Optimized automatically for crisp 40px navbar display • Max 5MB
              </p>
              {uploadStatus && (
                <span className="mt-2 text-[10px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-200">
                  <Check className="w-3 h-3 text-blue-600" />
                  {uploadStatus}
                </span>
              )}
            </div>
          </div>

          {/* Right: URL Input + Header Navbar Live Simulation */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-[#0B1F4D] mb-1.5">
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
                  className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl border border-blue-200 bg-white text-[#0B1F4D] focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  disabled={savingLogo}
                  onClick={handleSaveLogoUrl}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingLogo ? 'Saving...' : 'Save Logo'}</span>
                </button>
              </div>
            </div>

            {/* Header Live Preview Bar */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#0B1F4D]/70">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  Top Header Live Simulation (max-height: 40px, object-fit: contain)
                </span>
                <span className="text-[10px] font-mono text-blue-700 font-bold">Reactive</span>
              </div>

              <div className="h-12 bg-white rounded-xl px-3 flex items-center justify-between border border-blue-200 shadow-2xs">
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
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-600 text-white rounded-md shrink-0">
                      Admin
                    </span>
                  </div>
                ) : (
                  /* Fallback to Default "DSK" Logo/Text */
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div 
                      className="w-8 h-8 rounded-lg bg-[#0B1F4D] text-white flex items-center justify-center font-black text-xs shrink-0 border border-blue-900"
                      style={{ maxHeight: '40px' }}
                    >
                      DSK
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-[#0B1F4D] text-xs">
                          {settings?.platformName || 'DSK TaskMarketer'}
                        </span>
                        <span className="px-1.5 py-0.2 text-[8px] font-black uppercase bg-red-600 text-white rounded shrink-0">
                          Admin
                        </span>
                      </div>
                      <p className="text-[9px] text-[#0B1F4D]/70 leading-none">
                        {settings?.tagline || 'Complete Tasks • Earn Rewards'}
                      </p>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-[#0B1F4D]/70 font-medium hidden sm:inline">
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
        <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B1F4D]">Task Submissions Awaiting Audit</h2>
              <p className="text-xs text-[#0B1F4D]/70">Cross-check Application IDs with affiliate reports</p>
            </div>
            <button
              onClick={() => onNavigate('admin-submissions')}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all ({pendingSubmissions.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#0B1F4D]/70 bg-blue-50/50 rounded-2xl border border-blue-200">
              All submissions have been verified and processed!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.slice(0, 4).map(sub => (
                <div 
                  key={sub.id} 
                  className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/30 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 max-w-[240px]">
                    <p className="font-bold text-[#0B1F4D] truncate">{sub.taskTitle}</p>
                    <p className="font-mono text-[11px] text-blue-700 font-semibold">Ref: {sub.proofApplicationId || 'N/A'}</p>
                    <span className="text-[10px] text-[#0B1F4D]/70">User: {sub.userId} • ₹{sub.rewardAmount}*</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDashboardApprove(sub)}
                      disabled={processingSubId === sub.id}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {processingSubId === sub.id ? 'Approving...' : `Approve (₹${sub.rewardAmount})`}
                    </button>
                    <button
                      onClick={() => handleDashboardReject(sub)}
                      disabled={processingSubId === sub.id}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg border border-red-300 transition-colors disabled:opacity-50 cursor-pointer"
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
        <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B1F4D]">Pending Withdrawals Queue</h2>
              <p className="text-xs text-[#0B1F4D]/70">Disburse funds to user-specified UPI/Bank</p>
            </div>
            <button
              onClick={() => onNavigate('admin-withdrawals')}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all ({pendingWithdrawals.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingWithdrawals.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#0B1F4D]/70 bg-blue-50/50 rounded-2xl border border-blue-200">
              No pending withdrawal requests in the queue.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.slice(0, 4).map(w => (
                <div 
                  key={w.id} 
                  className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/30 flex items-center justify-between gap-3 text-xs hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => handleOpenWithdrawal(w)}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0B1F4D] text-sm">₹{w.amount}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        w.status === 'approved' 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-yellow-100 text-[#0B1F4D] border-yellow-300'
                      }`}>
                        {w.status === 'approved' ? 'Approved (Ready to Pay)' : 'Pending Review'}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-[#0B1F4D]">
                      {w.paymentMethod === 'upi' ? (
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-blue-600" />
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
                      className="px-3 py-1.5 bg-[#0B1F4D] hover:bg-blue-900 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-yellow-300" />
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
