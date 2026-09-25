import React, { useState } from 'react';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  Users, 
  PlusCircle, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  FileCheck,
  User as UserIcon,
  CheckSquare,
  Gift,
  ArrowDownToLine,
  Building,
  Smartphone,
  Copy,
  Check,
  X,
  RefreshCw,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { 
  User, 
  WalletSummary, 
  Task, 
  TaskSubmission, 
  TaskCategory, 
  WithdrawalItem, 
  RewardItem,
  PlatformSettings 
} from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { useTranslation } from '../../locales';
import { EmptyStateIllustration } from '../../components/illustrations';
import { MonthlyIncentivesCardGroup } from '../../components/MonthlyIncentivesCardGroup';

interface UserDashboardViewProps {
  user: User;
  wallet: WalletSummary;
  tasks: Task[];
  categories: TaskCategory[];
  submissions: TaskSubmission[];
  withdrawals?: WithdrawalItem[];
  rewards?: RewardItem[];
  settings?: PlatformSettings;
  onRequestWithdrawal?: (data: {
    amount: number;
    paymentMethod: 'upi' | 'bank_transfer';
    upiId?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    accountHolderName?: string;
  }) => Promise<void>;
  onNavigate: (view: string) => void;
  onViewTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
  onSubmitProof: (task: Task) => void;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  user,
  wallet,
  tasks,
  categories,
  submissions,
  withdrawals = [],
  rewards = [],
  settings,
  onRequestWithdrawal,
  onNavigate,
  onViewTask,
  onStartTask,
  onSubmitProof,
}) => {
  const { t } = useTranslation();

  // Activity filter state
  const [activityTab, setActivityTab] = useState<'all' | 'submissions' | 'withdrawals'>('all');
  const [copiedCode, setCopiedCode] = useState(false);

  // Quick Withdrawal Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [withdrawAmount, setWithdrawAmount] = useState<number>((wallet as any)?.minimumWithdrawalLimit ?? 200);
  const [upiId, setUpiId] = useState((user as any)?.upiId || user?.payoutDetails?.upiId || '');
  const [accountNumber, setAccountNumber] = useState((user as any)?.bankAccountNumber || user?.payoutDetails?.bankAccount || '');
  const [ifsc, setIfsc] = useState((user as any)?.bankIfsc || user?.payoutDetails?.ifsc || '');
  const [holderName, setHolderName] = useState((user as any)?.accountHolderName || user?.payoutDetails?.accountHolderName || user?.name || '');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // Real Database Balances & Earnings Breakdown (Requirement 5 & 7)
  const availableBal = wallet?.availableBalance ?? 0;
  const pendingBal = (wallet as any)?.pendingBalance ?? wallet?.pendingRewards ?? 0;

  // Requirement 5: Dedicated Task Earnings, Referral Earnings, and Total Earnings
  // Task Earnings must come only from actual task reward transactions.
  // Referral Earnings must come only from actual referral reward transactions.
  // Formula: Total Earnings = Task Earnings + Referral Earnings
  const taskRewardsList = rewards.filter(r => r.type === 'task_reward' && (r.status === 'credited' || r.status === 'approved'));
  const taskEarnings = (wallet as any)?.taskEarnings !== undefined 
    ? (wallet as any).taskEarnings 
    : taskRewardsList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const referralRewardsList = rewards.filter(r => (r.type === 'referral_reward' || r.type === 'referral_bonus') && (r.status === 'credited' || r.status === 'approved'));
  const referralEarnings = (wallet as any)?.referralRewards !== undefined
    ? (wallet as any).referralRewards
    : referralRewardsList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const referralRewardAmount = settings?.referralRewardAmount ?? 50;

  const totalEarnings = taskEarnings + referralEarnings;
  
  // Calculate total successfully withdrawn from real withdrawals if not in wallet
  const totalWithdrawnFromList = withdrawals
    .filter(w => w.status === 'paid' || (w.status as any) === 'completed' || (w.status as any) === 'processed')
    .reduce((sum, w) => sum + (Number(w.paidAmount) || Number(w.amount) || 0), 0);
  const totalWithdrawn = (wallet as any)?.totalWithdrawn !== undefined && (wallet as any)?.totalWithdrawn > 0
    ? (wallet as any).totalWithdrawn
    : totalWithdrawnFromList;

  const minLimit = (wallet as any)?.minimumWithdrawalLimit ?? 200;

  // Requirement 6: Recent Activity with explicitly defined transaction types
  const getTransactionTypeInfo = (item: any) => {
    const rawType = item.type || (item.payoutMethod ? 'withdrawal' : '');
    const desc = (item.description || item.taskTitle || item.rejectionReason || item.note || '').toLowerCase();

    if (rawType === 'manual_reward' || desc.includes('manual')) {
      return {
        label: 'Manual Reward',
        color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
        sign: '+',
        isCredit: true
      };
    }
    if (rawType === 'task_reward' || desc.includes('task')) {
      return {
        label: 'Task Reward',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
        sign: '+',
        isCredit: true
      };
    }
    if (rawType === 'referral_reward' || rawType === 'referral_bonus' || desc.includes('referral')) {
      return {
        label: 'Referral Reward',
        color: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800',
        sign: '+',
        isCredit: true
      };
    }
    if (rawType === 'admin_reward' || (rawType === 'bonus' && !desc.includes('refund')) || desc.includes('admin')) {
      return {
        label: 'Admin Reward',
        color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
        sign: '+',
        isCredit: true
      };
    }
    if (rawType === 'withdrawal_refund' || desc.includes('refund')) {
      return {
        label: 'Withdrawal Refund',
        color: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
        sign: '+',
        isCredit: true
      };
    }
    if (rawType === 'withdrawal' || item.payoutMethod) {
      return {
        label: 'Withdrawal',
        color: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        sign: '-',
        isCredit: false
      };
    }
    return {
      label: 'Task Reward',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
      sign: '+',
      isCredit: true
    };
  };

  const handleCopyReferral = () => {
    if (!user.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const num = Number(withdrawAmount);
    if (isNaN(num) || num <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }
    if (num > availableBal) {
      setWithdrawError("Insufficient balance.");
      return;
    }
    if (num < minLimit) {
      setWithdrawError(`Minimum withdrawal amount is ₹${minLimit}`);
      return;
    }

    if (withdrawMethod === 'upi' && !upiId.trim()) {
      setWithdrawError("Please enter a valid UPI ID (e.g. name@bank)");
      return;
    }

    if (withdrawMethod === 'bank_transfer' && (!accountNumber.trim() || !ifsc.trim() || !holderName.trim())) {
      setWithdrawError("Please provide Account Holder Name, Bank Account Number, and IFSC code");
      return;
    }

    if (!onRequestWithdrawal) {
      // Direct to wallet page if handler not bound
      setShowWithdrawModal(false);
      onNavigate('wallet');
      return;
    }

    try {
      setWithdrawLoading(true);
      await onRequestWithdrawal({
        amount: num,
        paymentMethod: withdrawMethod,
        upiId: withdrawMethod === 'upi' ? upiId.trim() : undefined,
        bankAccountNumber: withdrawMethod === 'bank_transfer' ? accountNumber.trim() : undefined,
        bankIfsc: withdrawMethod === 'bank_transfer' ? ifsc.trim().toUpperCase() : undefined,
        accountHolderName: withdrawMethod === 'bank_transfer' ? holderName.trim() : undefined,
      });
      setWithdrawSuccess("Withdrawal request submitted successfully.");
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(null);
      }, 2000);
    } catch (err: any) {
      setWithdrawError(err.message || "Failed to submit withdrawal request");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const getSubmissionBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'under_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock className="w-3 h-3" />
            Under Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
    }
  };

  const getWithdrawalBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'processed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Paid Out
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
    }
  };

  return (
    <div className="w-full px-2.5 sm:px-6 py-3 sm:py-8 space-y-3 sm:space-y-8">
      
      {/* ========================================================
          1. WELCOME & USER GREETING BANNER (Matches Reference Image)
          ======================================================== */}
      <div className="flex flex-row items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Dashboard</span>
          </h1>
          <p className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track progress & earn rewards!
          </p>
        </div>

        {/* User Profile Pill on Right */}
        <div className="flex items-center gap-2 shrink-0">
          <div 
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-1.5 sm:gap-2.5 bg-white dark:bg-slate-900 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400 transition-all cursor-pointer"
          >
            <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs overflow-hidden shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="text-left pr-0.5">
              <p className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight truncate max-w-[80px] sm:max-w-none">
                {user.name}
              </p>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                {user.role === 'admin' ? 'Admin' : 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. THREE CORE METRIC CARDS IN 1x3 HORIZONTAL ROW
          ======================================================== */}
      <div className="grid grid-cols-3 gap-1 sm:gap-4 w-full">
        
        {/* Card 1: Total Tasks */}
        <div 
          id="card-total-tasks"
          onClick={() => onNavigate('tasks')}
          className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl p-1.5 xs:p-2 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between group min-w-0"
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block truncate">
              Total Tasks
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm xs:text-base sm:text-3xl font-black text-slate-900 dark:text-white truncate">
                {submissions.filter(s => s.status === 'approved').length || tasks.filter(t => t.status === 'active').length}
              </span>
            </div>
            <span className="text-[7px] xs:text-[8px] sm:text-[11px] text-slate-400 dark:text-slate-500 block truncate">
              This Month
            </span>
          </div>
          <div className="w-6 xs:w-7 sm:w-12 h-6 xs:h-7 sm:h-12 rounded-md sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <CheckSquare className="w-3 sm:w-6 h-3 sm:h-6" />
          </div>
        </div>

        {/* Card 2: Total Earnings */}
        <div 
          id="card-total-earnings"
          onClick={() => onNavigate('earnings')}
          className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl p-1.5 xs:p-2 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between group min-w-0"
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block truncate">
              Total Earnings
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm xs:text-base sm:text-3xl font-black text-slate-900 dark:text-white truncate">
                ₹{totalEarnings.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[7px] xs:text-[8px] sm:text-[11px] text-slate-400 dark:text-slate-500 block truncate">
              This Month
            </span>
          </div>
          <div className="w-6 xs:w-7 sm:w-12 h-6 xs:h-7 sm:h-12 rounded-md sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <UserIcon className="w-3 sm:w-6 h-3 sm:h-6" />
          </div>
        </div>

        {/* Card 3: Wallet Balance */}
        <div 
          id="card-available-balance"
          onClick={() => {
            setWithdrawAmount(prev => prev > 0 && prev <= availableBal ? prev : Math.min(minLimit, availableBal));
            setShowWithdrawModal(true);
          }}
          className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl p-1.5 xs:p-2 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between group min-w-0"
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block truncate">
              Wallet Balance
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm xs:text-base sm:text-3xl font-black text-slate-900 dark:text-white truncate">
                ₹{availableBal.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[7px] xs:text-[8px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block truncate">
              Available
            </span>
          </div>
          <div className="w-6 xs:w-7 sm:w-12 h-6 xs:h-7 sm:h-12 rounded-md sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <Wallet className="w-3 sm:w-6 h-3 sm:h-6" />
          </div>
        </div>

      </div>

      {/* ========================================================
          3. YOUR MONTHLY INCENTIVES (Matches Reference Image)
          ======================================================== */}
      <MonthlyIncentivesCardGroup
        userId={user.id}
        onNavigate={onNavigate}
        showBannerHeader={true}
      />

      {/* Refer & Earn Banner Card */}
      <div 
        id="dash-refer-earn-banner"
        onClick={() => onNavigate('referrals')}
        className="rounded-xl sm:rounded-3xl p-2.5 sm:p-6 bg-gradient-to-r from-yellow-400/15 via-white to-blue-50/50 dark:from-yellow-950/20 dark:via-slate-900 dark:to-blue-950/20 border border-yellow-300/80 dark:border-yellow-900/40 flex flex-row items-center justify-between gap-2 cursor-pointer hover:border-yellow-400 transition-all shadow-2xs w-full"
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-7 sm:w-12 h-7 sm:h-12 rounded-lg sm:rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
            <Gift className="w-3.5 sm:w-6 h-3.5 sm:h-6 text-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                Refer & Earn ₹{referralRewardAmount}
              </span>
              <span className="text-[9px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 rounded-full font-black bg-yellow-100 dark:bg-yellow-950 text-yellow-950 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800">
                ₹{referralEarnings} Earned
              </span>
            </div>
            <p className="text-[9px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
              Earn ₹{referralRewardAmount} per verified friend referral!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-400 shrink-0">
          <span className="hidden sm:inline">{t('nav.referrals', 'Invite Friends')}</span>
          <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4" />
        </div>
      </div>

      {/* ========================================================
          3. DASHBOARD QUICK ACTIONS (1x5 Compact Horizontal Row on Mobile)
          ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>{t('dashboard.quickActions', 'Quick Actions')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-5 gap-1 sm:gap-3.5 w-full">
          {/* Action 1: Wallet */}
          <button
            id="dash-action-wallet"
            onClick={() => onNavigate('wallet')}
            className="flex flex-col items-center justify-center p-1 sm:p-4 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-all group cursor-pointer text-center w-full min-w-0"
          >
            <div className="w-6 sm:w-11 h-6 sm:h-11 rounded-md sm:rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-0.5 sm:mb-2.5 group-hover:scale-110 transition-transform shrink-0">
              <Wallet className="w-3 sm:w-5 h-3 sm:h-5" />
            </div>
            <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate w-full">
              Wallet
            </span>
            <span className="text-[6.5px] xs:text-[7.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">
              Payouts
            </span>
          </button>

          {/* Action 2: Request Withdrawal */}
          <button
            id="dash-action-withdraw"
            onClick={() => {
              setWithdrawAmount(prev => prev > 0 && prev <= availableBal ? prev : Math.min(minLimit, availableBal));
              setShowWithdrawModal(true);
            }}
            className="flex flex-col items-center justify-center p-1 sm:p-4 bg-white dark:bg-slate-900 hover:bg-red-50/50 dark:hover:bg-slate-800 rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-red-400 dark:hover:border-red-600 transition-all group cursor-pointer text-center w-full min-w-0"
          >
            <div className="w-6 sm:w-11 h-6 sm:h-11 rounded-md sm:rounded-2xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mb-0.5 sm:mb-2.5 group-hover:scale-110 transition-transform shrink-0">
              <ArrowDownToLine className="w-3 sm:w-5 h-3 sm:h-5" />
            </div>
            <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 truncate w-full">
              Withdraw
            </span>
            <span className="text-[6.5px] xs:text-[7.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">
              UPI/Bank
            </span>
          </button>

          {/* Action 3: My Tasks */}
          <button
            id="dash-action-tasks"
            onClick={() => onNavigate('tasks')}
            className="flex flex-col items-center justify-center p-1 sm:p-4 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-all group cursor-pointer text-center w-full min-w-0"
          >
            <div className="w-6 sm:w-11 h-6 sm:h-11 rounded-md sm:rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-0.5 sm:mb-2.5 group-hover:scale-110 transition-transform shrink-0">
              <CheckSquare className="w-3 sm:w-5 h-3 sm:h-5" />
            </div>
            <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate w-full">
              My Tasks
            </span>
            <span className="text-[6.5px] xs:text-[7.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">
              Submissions
            </span>
          </button>

          {/* Action 4: Refer & Earn */}
          <button
            id="dash-action-referrals"
            onClick={() => onNavigate('referrals')}
            className="flex flex-col items-center justify-center p-1 sm:p-4 bg-white dark:bg-slate-900 hover:bg-yellow-50/40 dark:hover:bg-slate-800 rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-yellow-400 dark:hover:border-yellow-600 transition-all group cursor-pointer text-center w-full min-w-0"
          >
            <div className="w-6 sm:w-11 h-6 sm:h-11 rounded-md sm:rounded-2xl bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-400 flex items-center justify-center mb-0.5 sm:mb-2.5 group-hover:scale-110 transition-transform shrink-0">
              <Gift className="w-3 sm:w-5 h-3 sm:h-5" />
            </div>
            <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-slate-900 dark:text-white group-hover:text-yellow-700 dark:group-hover:text-yellow-400 truncate w-full">
              Refer & Earn
            </span>
            <span className="text-[6.5px] xs:text-[7.5px] sm:text-[10px] font-bold text-yellow-800 dark:text-yellow-400 truncate w-full">
              ₹{referralRewardAmount} Bonus
            </span>
          </button>

          {/* Action 5: Profile */}
          <button
            id="dash-action-profile"
            onClick={() => onNavigate('profile')}
            className="flex flex-col items-center justify-center p-1 sm:p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 transition-all group cursor-pointer text-center w-full min-w-0"
          >
            <div className="w-6 sm:w-11 h-6 sm:h-11 rounded-md sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-0.5 sm:mb-2.5 group-hover:scale-110 transition-transform shrink-0">
              <UserIcon className="w-3 sm:w-5 h-3 sm:h-5" />
            </div>
            <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate w-full">
              {t('nav.profile', 'Profile')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Account & Payout Info
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================
          4. DASHBOARD RECENT ACTIVITY (Requirement 6 & 11)
          Includes real existing user data:
          - Recent task submissions
          - Task approval/rejection status
          - Reward earned / pending rewards
          - Withdrawal requests & status
          Purely uses existing database records. No dummy data!
          ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {t('dashboard.recentActivity', 'Recent Activity')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live updates on your task submissions and withdrawal transactions
            </p>
          </div>

          {/* Activity Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActivityTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activityTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t('wallet.all', 'All')}
            </button>
            <button
              onClick={() => setActivityTab('submissions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activityTab === 'submissions'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t('dashboard.submissions', 'Submissions')} ({submissions.length})
            </button>
            <button
              onClick={() => setActivityTab('withdrawals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activityTab === 'withdrawals'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t('dashboard.withdrawals', 'Withdrawals')} ({withdrawals.length})
            </button>
          </div>
        </div>

        {/* Activity Content (Requirement 6) */}
        {activityTab === 'all' && (
          <div className="space-y-3">
            {rewards.length === 0 && withdrawals.length === 0 && submissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3 flex flex-col items-center">
                <EmptyStateIllustration size="sm" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No activity recorded yet.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Browse available financial tasks below to start earning verified rewards!
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => onNavigate('available-tasks')}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {t('nav.exploreTasks', 'Explore Available Tasks')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Unified Recent Financial Activities with explicit Transaction Types */}
                {(() => {
                  // Build combined activity list
                  const combined: Array<{
                    id: string;
                    transactionType: 'Task Reward' | 'Referral Reward' | 'Admin Reward' | 'Manual Reward' | 'Withdrawal' | 'Withdrawal Refund';
                    badgeClass: string;
                    sign: '+' | '-';
                    title: string;
                    amount: number;
                    date: string;
                    refId: string;
                    status?: string;
                    utr?: string;
                    note?: string;
                  }> = [];

                  // Rewards Ledger items
                  rewards.forEach(r => {
                    const info = getTransactionTypeInfo(r);
                    const adminAuthor = (r as any).addedByAdmin;
                    const reasonText = r.description || r.note || (r as any).reason || '';
                    const displayNote = adminAuthor 
                      ? `Admin: ${adminAuthor}${reasonText ? ` • Reason: ${reasonText}` : ''}`
                      : (r.note || (r as any).adminNote || (r as any).reason);

                    combined.push({
                      id: `rew-${r.id}`,
                      transactionType: info.label as any,
                      badgeClass: info.color,
                      sign: (info.sign === '-' ? '-' : '+') as '+' | '-',
                      title: r.taskTitle || r.description || info.label,
                      amount: Number(r.amount) || 0,
                      date: r.createdAt || (r as any).date || (r as any).awardedAt || new Date().toISOString(),
                      refId: r.referenceId || (r as any).proofApplicationId || `REF-${r.id.slice(-6)}`,
                      status: r.status,
                      note: displayNote,
                      utr: (r as any).paymentReference || (r as any).utrNumber
                    });
                  });

                  // Withdrawals
                  withdrawals.forEach(w => {
                    const isRefunded = w.status === 'rejected' || w.status === 'cancelled';
                    combined.push({
                      id: `wth-${w.id}`,
                      transactionType: 'Withdrawal',
                      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                      sign: '-',
                      title: `Payout Request (${w.paymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'})`,
                      amount: Number(w.amount) || 0,
                      date: w.requestedAt || (w as any).createdAt || new Date().toISOString(),
                      refId: w.referenceId || `DSK-WTH-${w.id.replace('wth_', '')}`,
                      status: w.status,
                      utr: w.paymentReference || (w as any).utrNumber || (w as any).transactionReference,
                      note: isRefunded ? (w.rejectionReason || 'Rejected & refunded to wallet') : undefined
                    });
                  });

                  // Sort descending by date
                  const sorted = combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  return sorted.slice(0, 8).map(act => (
                    <div
                      key={act.id}
                      className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Guaranteed Transaction Type Badge (Requirement 6) */}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide border shadow-2xs ${act.badgeClass}`}>
                              {act.transactionType}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {act.title}
                            </span>
                            {act.status && (
                              <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">
                                {act.status}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                            <span>Ref: <strong className="font-mono text-slate-700 dark:text-slate-300">{act.refId}</strong></span>
                            <span>•</span>
                            <span>{new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {act.utr && (
                              <>
                                <span>•</span>
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                  UTR: {act.utr}
                                </span>
                              </>
                            )}
                            {act.note && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 dark:text-slate-300 italic">{act.note}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className={`text-base font-black ${act.sign === '+' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {act.sign}₹{act.amount}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {activityTab === 'submissions' && (
          <div>
            {submissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                You haven't submitted any task proofs yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {submissions.map(sub => (
                  <div
                    key={sub.id}
                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {sub.taskTitle}
                        </p>
                        {getSubmissionBadge(sub.status)}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Application ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{sub.proofApplicationId || 'N/A'}</span> • Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                      {sub.adminNote && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">
                          Audit Note: {sub.adminNote}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{sub.rewardAmount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activityTab === 'withdrawals' && (
          <div>
            {withdrawals.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No withdrawal requests on record yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {withdrawals.map(wth => (
                  <div
                    key={wth.id}
                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          ₹{wth.amount} via {wth.paymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}
                        </p>
                        {getWithdrawalBadge(wth.status)}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Requested: {new Date(wth.requestedAt).toLocaleDateString()}
                        {wth.upiId && ` • UPI: ${wth.upiId}`}
                        {wth.paymentReference && ` • Ref: ${wth.paymentReference}`}
                      </p>
                      {wth.adminNote && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">
                          Note: {wth.adminNote}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        ₹{wth.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          5. RECOMMENDED TASKS SECTION
          ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {t('dashboard.recommendedTasks', 'Recommended Tasks for You')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified financial offers with guaranteed payout on qualified actions
            </p>
          </div>
          <button
            onClick={() => onNavigate('available-tasks')}
            className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{t('common.viewAll', 'Explore All')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clean responsive task grid: 1x4 horizontal layout across Desktop, Tablet and Mobile */}
        <div className="grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 w-full items-stretch">
          {tasks.slice(0, 8).map(task => (
            <TaskCard
              key={task.id}
              task={task}
              category={categories.find(c => c.id === task.categoryId)}
              onViewDetails={onViewTask}
              onStartTask={onStartTask}
              onSubmitProof={onSubmitProof}
            />
          ))}
        </div>
      </div>

      {/* ========================================================
          6. QUICK WITHDRAWAL MODAL
          ======================================================== */}
      {showWithdrawModal && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Request Payout
                  </h3>
                  <p className="text-[11px] text-slate-500">Direct to your bank account or UPI ID</p>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Available Balance Box */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  Available to Withdraw
                </span>
                <p className="text-xl font-black text-emerald-900 dark:text-emerald-200">
                  ₹{availableBal}
                </p>
              </div>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                Min: ₹{minLimit}
              </span>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  min={minLimit}
                  max={availableBal}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Payout Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('upi')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      withdrawMethod === 'upi'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('bank_transfer')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      withdrawMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Bank Transfer</span>
                  </button>
                </div>
              </div>

              {withdrawMethod === 'upi' ? (
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    UPI ID (e.g. name@okhdfcbank)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="yourname@bank"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Full Name as in Bank"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Bank Account Number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="HDFC0001234"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    onNavigate('wallet');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Full Wallet Page
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading || availableBal < minLimit}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black text-xs shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {withdrawLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
