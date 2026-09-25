import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowDownToLine, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building, 
  Smartphone,
  Copy,
  Check,
  TrendingUp,
  History,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { WalletSummary, WithdrawalItem, User, WithdrawalStatus, RewardItem, PlatformSettings } from '../../types';
import { useTranslation } from '../../locales';
import { WalletRewardIllustration, WalletSectionIllustration } from '../../components/illustrations';

interface UserWalletViewProps {
  user?: User | null;
  wallet?: WalletSummary | null;
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
  onNavigate?: (view: string) => void;
}

export const UserWalletView: React.FC<UserWalletViewProps> = ({
  user,
  wallet,
  withdrawals = [],
  rewards = [],
  settings,
  onRequestWithdrawal,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [amount, setAmount] = useState<number>(wallet?.minimumWithdrawalLimit ?? 200);
  const [upiId, setUpiId] = useState((user as any)?.upiId || user?.payoutDetails?.upiId || '');
  const [accountNumber, setAccountNumber] = useState((user as any)?.bankAccountNumber || user?.payoutDetails?.bankAccount || '');
  const [ifsc, setIfsc] = useState((user as any)?.bankIfsc || user?.payoutDetails?.ifsc || '');
  const [holderName, setHolderName] = useState((user as any)?.accountHolderName || user?.payoutDetails?.accountHolderName || user?.name || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'withdrawals' | 'earnings'>('withdrawals');

  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
  const safeRewards = Array.isArray(rewards) ? rewards : [];

  useEffect(() => {
    if (user) {
      if (!upiId) setUpiId((user as any).upiId || user.payoutDetails?.upiId || '');
      if (!accountNumber) setAccountNumber((user as any).bankAccountNumber || user.payoutDetails?.bankAccount || '');
      if (!ifsc) setIfsc((user as any).bankIfsc || user.payoutDetails?.ifsc || '');
      if (!holderName) setHolderName((user as any).accountHolderName || user.payoutDetails?.accountHolderName || user.name || '');
    }
  }, [user]);

  // If user is unauthenticated, render a clean styled gateway instead of a blank screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Wallet className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">DSK Member Wallet</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Sign in to track your task balances, view referral earnings, and request instant payouts directly to your UPI ID or bank account.
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => onNavigate?.('login')}
              className="w-full py-3.5 px-4 rounded-xl font-black text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
            >
              Sign In to Your Wallet
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate?.('register')}
              className="w-full py-3 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Create Free Account
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <WalletRewardIllustration size="sm" />
          </div>
        </div>
      </div>
    );
  }

  const minLimit = wallet?.minimumWithdrawalLimit ?? 200;
  const availableBal = wallet?.availableBalance ?? 0;
  const pendingBal = wallet?.pendingBalance ?? 0;
  const totalEarned = wallet?.totalEarned ?? 0;
  const totalWithdrawn = wallet?.totalWithdrawn ?? 0;

  // Requirement 5 & 7: Task Earnings, Referral Earnings, Total Earnings and Formula Display
  const taskRewardsList = safeRewards.filter(r => r.type === 'task_reward' && (r.status === 'credited' || r.status === 'approved'));
  const taskEarnings = (wallet as any)?.taskEarnings !== undefined
    ? (wallet as any).taskEarnings
    : taskRewardsList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const referralRewardsList = safeRewards.filter(r => (r.type === 'referral_reward' || r.type === 'referral_bonus') && (r.status === 'credited' || r.status === 'approved'));
  const referralEarnings = (wallet as any)?.referralRewards !== undefined
    ? (wallet as any).referralRewards
    : referralRewardsList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const totalEarningsCalculated = taskEarnings + referralEarnings;

  // Reset modal state when opened
  useEffect(() => {
    if (showWithdrawModal) {
      setError(null);
      setSuccessMsg(null);
      if (!amount || amount > availableBal) {
        setAmount(minLimit);
      }
    }
  }, [showWithdrawModal, minLimit, availableBal]);

  // Filter withdrawals safely
  const pendingWithdrawals = safeWithdrawals.filter(w => 
    w.status === 'pending' || w.status === 'processing' || (w.status as any) === 'requested' || w.status === 'approved'
  );
  const completedWithdrawals = safeWithdrawals.filter(w => 
    w.status === 'paid' || (w.status as any) === 'processed' || (w.status as any) === 'completed'
  );
  const rejectedWithdrawals = safeWithdrawals.filter(w => 
    w.status === 'rejected' || w.status === 'cancelled'
  );

  const filteredWithdrawals = safeWithdrawals.filter(w => {
    if (activeTab === 'pending') {
      return w.status === 'pending' || w.status === 'processing' || (w.status as any) === 'requested' || w.status === 'approved';
    }
    if (activeTab === 'completed') {
      return w.status === 'paid' || (w.status as any) === 'processed' || (w.status as any) === 'completed';
    }
    if (activeTab === 'rejected') {
      return w.status === 'rejected' || w.status === 'cancelled';
    }
    return true;
  });

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid withdrawal amount");
      return;
    }

    if (numAmount > availableBal) {
      setError("Insufficient balance.");
      return;
    }

    if (numAmount < minLimit) {
      setError(`Minimum withdrawal amount is ₹${minLimit}`);
      return;
    }

    if (method === 'upi' && !upiId.trim()) {
      setError("Please enter a valid UPI ID (e.g. yourname@okhdfcbank)");
      return;
    }

    if (method === 'bank_transfer' && (!accountNumber.trim() || !ifsc.trim() || !holderName.trim())) {
      setError("Please fill in Account Holder Name, Bank Account Number, and IFSC code");
      return;
    }

    try {
      setLoading(true);
      await onRequestWithdrawal({
        amount: numAmount,
        paymentMethod: method,
        upiId: method === 'upi' ? upiId.trim() : undefined,
        bankAccountNumber: method === 'bank_transfer' ? accountNumber.trim() : undefined,
        bankIfsc: method === 'bank_transfer' ? ifsc.trim().toUpperCase() : undefined,
        accountHolderName: method === 'bank_transfer' ? holderName.trim() : undefined,
      });
      setSuccessMsg("Withdrawal request submitted successfully.");
      setTimeout(() => {
        setShowWithdrawModal(false);
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const renderStatusBadge = (status: WithdrawalStatus | string) => {
    switch (status) {
      case 'paid':
      case 'processed':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Paid & Credited
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Approved (Processing Transfer)
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Rejected & Refunded
          </span>
        );
      case 'pending':
      case 'requested':
      case 'processing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="w-full px-2.5 sm:px-6 py-3 sm:py-8 space-y-3 sm:space-y-8">
      
      {/* Header & Primary Action (Matches Reference Design Available Balance Card) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 rounded-xl sm:rounded-3xl p-3 sm:p-8 text-white shadow-xl border border-blue-500/30 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6 items-center relative z-10">
          <div className="md:col-span-8 space-y-1.5 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-white/15 border border-white/25 text-yellow-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Wallet className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span>{t('wallet.title', 'Available Balance & Payouts')}</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <div className="text-2xl sm:text-5xl font-black text-white tracking-tight">
                ₹ {availableBal}
              </div>
              <span className="text-[10px] sm:text-xs font-extrabold text-blue-100 bg-white/15 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                Instant UPI / Bank Transfer
              </span>
            </div>

            <p className="text-[10px] sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              Fast, audited payouts directly to your verified UPI ID or Bank Account with zero deductions.
            </p>

            <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                id="btn-request-withdrawal-top"
                onClick={() => {
                  setShowWithdrawModal(true);
                  setError(null);
                  setSuccessMsg(null);
                }}
                disabled={availableBal < minLimit}
                className={`px-4 sm:px-8 py-2 sm:py-3.5 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl transition-all ${
                  availableBal >= minLimit
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-yellow-400/30 active:scale-95 cursor-pointer'
                    : 'bg-slate-700 text-slate-400 border border-slate-600 cursor-not-allowed'
                }`}
              >
                <ArrowDownToLine className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-950" />
                <span>Withdraw Funds</span>
              </button>

              <span className="text-[10px] sm:text-xs text-blue-200">
                Min. Payout: <strong className="text-yellow-300">₹{minLimit}</strong>
              </span>
            </div>
          </div>

          <div className="md:col-span-4 hidden md:flex justify-end">
            <WalletSectionIllustration size="sm" />
          </div>
        </div>
      </div>

      {/* Real-time Balances & Stats Grid (1x4 Compact Horizontal Row on Mobile) */}
      <div className="space-y-2 sm:space-y-4 w-full">
        <div className="grid grid-cols-4 gap-1 xs:gap-1.5 sm:gap-4 lg:gap-5 w-full">
          {/* Card 1: Available Balance */}
          <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-3xl p-1.5 xs:p-2 sm:p-6 border-2 border-blue-500/40 dark:border-blue-500/30 shadow-2xs relative overflow-hidden group min-w-0">
            <div className="flex items-center justify-between text-[7.5px] xs:text-[8.5px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider text-blue-700 dark:text-blue-400 mb-0.5 sm:mb-2 min-w-0">
              <span className="truncate">Available</span>
              <span className="p-0.5 sm:p-2 rounded-md sm:rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 shrink-0">
                <Wallet className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4" />
              </span>
            </div>
            <div className="text-xs xs:text-sm sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              ₹{availableBal}
            </div>
            <div className="mt-1 sm:mt-3 pt-1 sm:pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[7px] xs:text-[8px] sm:text-[11px] min-w-0">
              <span className="text-slate-500 dark:text-slate-400 font-medium truncate">Min:</span>
              <span className="font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded border border-blue-200 dark:border-blue-800 shrink-0">
                ₹{minLimit}
              </span>
            </div>
          </div>

          {/* Card 2: Task Earnings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-3xl p-1.5 xs:p-2 sm:p-6 border border-slate-200/90 dark:border-slate-700 shadow-2xs relative overflow-hidden min-w-0">
            <div className="flex items-center justify-between text-[7.5px] xs:text-[8.5px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider text-blue-700 dark:text-blue-400 mb-0.5 sm:mb-2 min-w-0">
              <span className="truncate">Tasks</span>
              <span className="p-0.5 sm:p-2 rounded-md sm:rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 shrink-0">
                <CheckCircle2 className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4" />
              </span>
            </div>
            <div className="text-xs xs:text-sm sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              ₹{taskEarnings}
            </div>
            <div className="mt-1 sm:mt-3 pt-1 sm:pt-3 border-t border-slate-100 dark:border-slate-700 text-[7px] xs:text-[8px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate">
              Task rewards
            </div>
          </div>

          {/* Card 3: Referral Earnings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-3xl p-1.5 xs:p-2 sm:p-6 border border-yellow-200/90 dark:border-slate-700 shadow-2xs relative overflow-hidden min-w-0">
            <div className="flex items-center justify-between text-[7.5px] xs:text-[8.5px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider text-yellow-700 dark:text-yellow-400 mb-0.5 sm:mb-2 min-w-0">
              <span className="truncate">Referrals</span>
              <span className="p-0.5 sm:p-2 rounded-md sm:rounded-xl bg-yellow-50 dark:bg-yellow-950/70 text-yellow-700 dark:text-yellow-300 shrink-0">
                <TrendingUp className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4" />
              </span>
            </div>
            <div className="text-xs xs:text-sm sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              ₹{referralEarnings}
            </div>
            <div className="mt-1 sm:mt-3 pt-1 sm:pt-3 border-t border-slate-100 dark:border-slate-700 text-[7px] xs:text-[8px] sm:text-[11px] text-yellow-700 dark:text-yellow-400 font-medium truncate">
              Invite rewards
            </div>
          </div>

          {/* Card 4: Total Earnings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-3xl p-1.5 xs:p-2 sm:p-6 border-2 border-red-500/30 dark:border-red-900/60 shadow-2xs relative overflow-hidden min-w-0">
            <div className="flex items-center justify-between text-[7.5px] xs:text-[8.5px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider text-red-600 dark:text-red-400 mb-0.5 sm:mb-2 min-w-0">
              <span className="truncate">Total</span>
              <span className="p-0.5 sm:p-2 rounded-md sm:rounded-xl bg-red-50 dark:bg-red-950/70 text-red-600 dark:text-red-300 shrink-0">
                <TrendingUp className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4" />
              </span>
            </div>
            <div className="text-xs xs:text-sm sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              ₹{totalEarningsCalculated}
            </div>
            <div className="mt-1 sm:mt-3 pt-1 sm:pt-3 border-t border-slate-100 dark:border-slate-700 text-[7px] xs:text-[8px] sm:text-[11px] text-red-600 dark:text-red-400 font-medium truncate">
              All earnings
            </div>
          </div>
        </div>

        {/* Sub-bar: Pending Balance & Total Withdrawn (1x2 Compact Row) */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-4 w-full">
          <div className="p-2 sm:p-4 bg-yellow-50/80 dark:bg-yellow-950/40 border border-yellow-200/80 dark:border-yellow-800/80 rounded-xl sm:rounded-2xl flex items-center justify-between min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-yellow-900 dark:text-yellow-200 truncate">
                Pending: <strong className="text-xs sm:text-sm font-black text-yellow-900">₹{pendingBal}</strong>
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-yellow-700 dark:text-yellow-400 font-medium shrink-0">Unlocked upon audit</span>
          </div>

          <div className="p-2 sm:p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl sm:rounded-2xl flex items-center justify-between min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <CheckCircle2 className="w-3 sm:w-4 h-3 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-blue-950 dark:text-blue-200 truncate">
                Withdrawn: <strong className="text-xs sm:text-sm font-black text-blue-800">₹{totalWithdrawn}</strong>
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-blue-700 dark:text-blue-400 font-medium shrink-0">Disbursed to UPI</span>
          </div>
        </div>
      </div>

      {/* Threshold Status Banner if below minimum limit */}
      {availableBal < minLimit && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800/80 rounded-2xl flex items-start sm:items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 text-xs text-yellow-900 dark:text-yellow-200">
            <span className="font-extrabold">Withdrawal Threshold:</span> You need at least ₹{minLimit} in unlocked balance to submit a payout request. You currently have ₹{availableBal}. Complete active partner tasks to reach the threshold!
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('tasks')}
              className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shrink-0 transition-colors cursor-pointer"
            >
              Explore Tasks
            </button>
          )}
        </div>
      )}

      {/* Main Section: Withdrawal Management & History */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {/* Navigation Tabs Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Withdrawal History & Requests
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl text-xs font-bold">
              <button
                id="tab-all-withdrawals"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t('wallet.all', 'All')} ({withdrawals.length})
              </button>
              <button
                id="tab-pending-withdrawals"
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t('wallet.pending', 'Pending')} ({pendingWithdrawals.length})
              </button>
              <button
                id="tab-completed-withdrawals"
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'completed'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t('wallet.completed', 'Completed')} ({completedWithdrawals.length})
              </button>
              <button
                id="tab-rejected-withdrawals"
                onClick={() => setActiveTab('rejected')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'rejected'
                    ? 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t('wallet.rejected', 'Rejected')} ({rejectedWithdrawals.length})
              </button>
            </div>

            <button
              id="btn-trigger-withdraw-form"
              onClick={() => {
                setShowWithdrawModal(true);
                setError(null);
                setSuccessMsg(null);
              }}
              className="px-4 py-1.5 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-red-600/20 cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{t('wallet.requestWithdrawal', 'New Request')}</span>
            </button>
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {filteredWithdrawals.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No {activeTab !== 'all' ? activeTab : ''} withdrawals found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {activeTab === 'all'
                  ? 'You have not submitted any payout requests yet. Once you complete tasks and earn rewards, request your withdrawal here.'
                  : `You do not have any ${activeTab} withdrawal requests at this moment.`}
              </p>
              {availableBal >= minLimit && (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Request ₹{availableBal} Withdrawal</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[11px]">
                  <tr>
                    <th className="py-3.5 px-6">ID & Date</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Method & Details</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Reference / UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredWithdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          #{w.id.replace('wth_', '').substring(0, 10)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(w.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-base font-black text-slate-900 dark:text-white">
                          ₹{w.amount}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {w.paymentMethod === 'upi' ? (
                            <span className="p-1 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              <Smartphone className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                              <Building className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                            {w.paymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-xs font-mono">
                          {w.paymentMethod === 'upi'
                            ? (w.payoutDetails?.upiId || (w as any).upiId || 'Verified UPI')
                            : `${w.payoutDetails?.bankAccount || (w as any).bankAccountNumber || 'Account'} (${w.payoutDetails?.ifsc || (w as any).bankIfsc || ''})`}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {renderStatusBadge(w.status)}
                        {w.rejectionReason && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-xs leading-tight">
                            Reason: {w.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {(() => {
                          const utrVal = w.paymentReference || w.payoutReference || (w as any).utrNumber || (w as any).transactionReference;
                          if (utrVal) {
                            return (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
                                  {utrVal}
                                </span>
                                <button
                                  onClick={() => copyUtr(utrVal)}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                                  title="Copy UTR / Reference"
                                >
                                  {copiedUtr === utrVal ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            );
                          }
                          return (
                            <span className="text-slate-400 text-[11px] italic">
                              {w.status === 'rejected' || w.status === 'cancelled' ? 'N/A' : 'Pending transfer'}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Request Withdrawal Drawer/Popup */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Request Payout
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Available balance: <span className="font-bold text-emerald-600">₹{availableBal}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-5 text-xs">
              
              {/* Amount Input & Shortcut Pills */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Withdrawal Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min={minLimit}
                    max={availableBal}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                
                {/* Quick select pills */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setAmount(minLimit)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold"
                  >
                    Min: ₹{minLimit}
                  </button>
                  {availableBal >= 500 && (
                    <button
                      type="button"
                      onClick={() => setAmount(500)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold"
                    >
                      ₹500
                    </button>
                  )}
                  {availableBal >= 1000 && (
                    <button
                      type="button"
                      onClick={() => setAmount(1000)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold"
                    >
                      ₹1000
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAmount(availableBal)}
                    className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-500 text-slate-950 rounded-lg text-[11px] font-black cursor-pointer shadow-xs"
                  >
                    All Available (₹{availableBal})
                  </button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Payout Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('upi')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      method === 'upi'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-extrabold text-xs">UPI Transfer</div>
                      <div className="text-[10px] text-slate-500">Instant VPA transfer</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('bank_transfer')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      method === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Building className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-extrabold text-xs">Bank Transfer</div>
                      <div className="text-[10px] text-slate-500">NEFT / IMPS Account</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs based on Method */}
              {method === 'upi' ? (
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@oksbi / yourname@paytm"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ensure your UPI ID is active and linked to your bank account.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="Name as registered with Bank"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Bank IFSC Code
                    </label>
                    <input
                      type="text"
                      required
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-withdrawal-final"
                  type="submit"
                  disabled={loading || availableBal < minLimit}
                  className="w-2/3 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-md shadow-red-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {loading ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Confirm Withdrawal (₹{amount})</span>
                    </>
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
