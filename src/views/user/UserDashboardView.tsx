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
  RewardItem 
} from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { useTranslation } from '../../locales';

interface UserDashboardViewProps {
  user: User;
  wallet: WalletSummary;
  tasks: Task[];
  categories: TaskCategory[];
  submissions: TaskSubmission[];
  withdrawals?: WithdrawalItem[];
  rewards?: RewardItem[];
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
  const [withdrawAmount, setWithdrawAmount] = useState<number>(wallet?.availableBalance ?? 0);
  const [upiId, setUpiId] = useState((user as any)?.upiId || user?.payoutDetails?.upiId || '');
  const [accountNumber, setAccountNumber] = useState((user as any)?.bankAccountNumber || user?.payoutDetails?.bankAccount || '');
  const [ifsc, setIfsc] = useState((user as any)?.bankIfsc || user?.payoutDetails?.ifsc || '');
  const [holderName, setHolderName] = useState((user as any)?.accountHolderName || user?.payoutDetails?.accountHolderName || user?.name || '');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // Real Database Balances
  const availableBal = wallet?.availableBalance ?? 0;
  const pendingBal = (wallet as any)?.pendingBalance ?? wallet?.pendingRewards ?? 0;
  const totalEarnings = (wallet as any)?.totalEarned ?? wallet?.totalEarnings ?? 0;
  
  // Calculate total successfully withdrawn from real withdrawals if not in wallet
  const totalWithdrawnFromList = withdrawals
    .filter(w => w.status === 'paid' || (w.status as any) === 'completed' || (w.status as any) === 'processed')
    .reduce((sum, w) => sum + (Number(w.paidAmount) || Number(w.amount) || 0), 0);
  const totalWithdrawn = (wallet as any)?.totalWithdrawn !== undefined && (wallet as any)?.totalWithdrawn > 0
    ? (wallet as any).totalWithdrawn
    : totalWithdrawnFromList;

  const minLimit = (wallet as any)?.minimumWithdrawalLimit ?? 200;

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
    if (num < minLimit) {
      setWithdrawError(`Minimum withdrawal amount is ₹${minLimit}`);
      return;
    }
    if (num > availableBal) {
      setWithdrawError(`Amount ₹${num} exceeds available balance of ₹${availableBal}`);
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
      setWithdrawSuccess(`Payout request of ₹${num} submitted successfully!`);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(null);
      }, 2500);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* ========================================================
          1. WELCOME & USER GREETING BANNER
          ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              {t('nav.dashboard', 'User Dashboard')}
            </span>
            {user.referralCode && (
              <button
                onClick={handleCopyReferral}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Click to copy your referral code"
              >
                <span>Code: {user.referralCode}</span>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
            {t('dashboard.welcome', 'Welcome')}, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('dashboard.overview', 'Overview of your verified earnings, pending task audits, and account balance.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            id="dash-cta-explore-tasks"
            onClick={() => onNavigate('available-tasks')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('nav.exploreTasks', 'Explore Tasks')}</span>
          </button>
          <button
            id="dash-cta-withdraw"
            onClick={() => {
              setWithdrawAmount(availableBal);
              setShowWithdrawModal(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors border border-slate-800 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            <span>{t('dashboard.requestPayout', 'Request Payout')}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. SUMMARY CARDS (Requirement 4 & 11)
          Must show:
          - Available Balance
          - Pending Balance
          - Total Earnings
          - Total Withdrawn
          Using actual authenticated user database values.
          Clean vertical cards on mobile, 4-col on desktop.
          Zero horizontal overflow!
          ======================================================== */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Available Balance */}
          <div 
            id="card-available-balance"
            onClick={() => {
              setWithdrawAmount(availableBal);
              setShowWithdrawModal(true);
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('dashboard.availableBalance', 'Available Balance')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ₹{availableBal}
              </span>
              <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                {t('dashboard.readyToWithdraw', 'Ready to withdraw')}
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{t('dashboard.minWithdrawal', 'Min withdrawal')}: ₹{minLimit}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                {t('wallet.requestWithdrawal', 'Withdraw')} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Card 2: Pending Balance */}
          <div 
            id="card-pending-balance"
            onClick={() => onNavigate('tasks')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('dashboard.pendingBalance', 'Pending Balance')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ₹{pendingBal}
              </span>
              <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                {t('dashboard.auditInProgress', 'Audit in progress')}
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{t('wallet.unlockedUponAudit', 'Subject to partner audit')}</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                {t('nav.tasks', 'View Tasks')} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Card 3: Total Earnings */}
          <div 
            id="card-total-earnings"
            onClick={() => onNavigate('wallet')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('dashboard.totalEarnings', 'Total Earnings')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ₹{totalEarnings}
              </span>
              <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                {t('wallet.lifetimeRewards', 'Lifetime earned')}
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{t('wallet.lifetimeRewards', 'Tasks & referral bonuses')}</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                {t('dashboard.history', 'History')} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Card 4: Total Withdrawn */}
          <div 
            id="card-total-withdrawn"
            onClick={() => onNavigate('wallet')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('dashboard.totalWithdrawn', 'Total Withdrawn')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowDownToLine className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ₹{totalWithdrawn}
              </span>
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {t('wallet.completedPayouts', 'Processed payouts')}
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{t('wallet.guidelines', 'UPI & bank transfers')}</span>
              <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                {t('nav.wallet', 'Wallet')} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          3. DASHBOARD QUICK ACTIONS (Requirement 5 & 11)
          Clear buttons/cards:
          - 💰 Wallet (Open complete Wallet page)
          - 💸 Request Withdrawal (Open withdrawal flow)
          - 📋 My Tasks (Show tasks/submissions belonging to user)
          - 🎁 Refer & Earn (Open user's referral section)
          - 👤 Profile (Open user's profile/account page)
          ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span>{t('dashboard.quickActions', 'Quick Actions')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {/* Action 1: Wallet */}
          <button
            id="dash-action-wallet"
            onClick={() => onNavigate('wallet')}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group cursor-pointer text-center"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {t('nav.wallet', 'Wallet')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('dashboard.availableBalance', 'Balance & Payouts')}
            </span>
          </button>

          {/* Action 2: Request Withdrawal */}
          <button
            id="dash-action-withdraw"
            onClick={() => {
              setWithdrawAmount(availableBal);
              setShowWithdrawModal(true);
            }}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group cursor-pointer text-center"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              {t('wallet.requestWithdrawal', 'Request Withdrawal')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              UPI / Bank Payout
            </span>
          </button>

          {/* Action 3: My Tasks */}
          <button
            id="dash-action-tasks"
            onClick={() => onNavigate('tasks')}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group cursor-pointer text-center"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
              {t('dashboard.myTasks', 'My Tasks')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Active & Submissions
            </span>
          </button>

          {/* Action 4: Refer & Earn */}
          <button
            id="dash-action-referrals"
            onClick={() => onNavigate('referrals')}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group cursor-pointer text-center"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
              {t('nav.referEarn', 'Refer & Earn')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              ₹50 per invite
            </span>
          </button>

          {/* Action 5: Profile */}
          <button
            id="dash-action-profile"
            onClick={() => onNavigate('profile')}
            className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group cursor-pointer text-center"
          >
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
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

        {/* Activity Content */}
        {activityTab === 'all' && (
          <div className="space-y-3">
            {submissions.length === 0 && withdrawals.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No activity recorded yet.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Browse available financial tasks below to start earning verified rewards!
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('available-tasks')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {t('nav.exploreTasks', 'Explore Available Tasks')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Recent Submissions */}
                {submissions.slice(0, 4).map(sub => (
                  <div
                    key={`act-sub-${sub.id}`}
                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {sub.taskTitle}
                          </p>
                          {getSubmissionBadge(sub.status)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                          <span>Ref: {sub.proofApplicationId || sub.referenceId}</span>
                          <span>•</span>
                          <span>{new Date(sub.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {sub.adminNote && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 dark:text-slate-300 italic">{sub.adminNote}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        +₹{sub.rewardAmount}
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {sub.status === 'approved' ? 'Credited to balance' : 'Pending partner audit'}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Recent Withdrawals */}
                {withdrawals.slice(0, 3).map(wth => (
                  <div
                    key={`act-wth-${wth.id}`}
                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <ArrowDownToLine className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Payout via {wth.paymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}
                          </p>
                          {getWithdrawalBadge(wth.status)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                          <span>Req on: {new Date(wth.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {wth.upiId && <span>• UPI: {wth.upiId}</span>}
                          {wth.paymentReference && <span className="font-mono">• UTR: {wth.paymentReference}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        ₹{wth.amount}
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {wth.status === 'paid' ? 'Processed' : 'In review'}
                      </p>
                    </div>
                  </div>
                ))}
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

        {/* Clean responsive task grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {tasks.slice(0, 6).map(task => (
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
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
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
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
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
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
