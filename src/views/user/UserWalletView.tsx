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
import { WalletSummary, WithdrawalItem, User, WithdrawalStatus, RewardItem } from '../../types';
import { useTranslation } from '../../locales';

interface UserWalletViewProps {
  user: User;
  wallet: WalletSummary;
  withdrawals: WithdrawalItem[];
  rewards?: RewardItem[];
  onRequestWithdrawal: (data: {
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
  withdrawals,
  rewards = [],
  onRequestWithdrawal,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [amount, setAmount] = useState<number>(wallet?.availableBalance ?? 0);
  const [upiId, setUpiId] = useState((user as any)?.upiId || user?.payoutDetails?.upiId || '');
  const [accountNumber, setAccountNumber] = useState((user as any)?.bankAccountNumber || user?.payoutDetails?.bankAccount || '');
  const [ifsc, setIfsc] = useState((user as any)?.bankIfsc || user?.payoutDetails?.ifsc || '');
  const [holderName, setHolderName] = useState((user as any)?.accountHolderName || user?.payoutDetails?.accountHolderName || user?.name || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'withdrawals' | 'earnings'>('withdrawals');

  useEffect(() => {
    if (user) {
      if (!upiId) setUpiId((user as any).upiId || user.payoutDetails?.upiId || '');
      if (!accountNumber) setAccountNumber((user as any).bankAccountNumber || user.payoutDetails?.bankAccount || '');
      if (!ifsc) setIfsc((user as any).bankIfsc || user.payoutDetails?.ifsc || '');
      if (!holderName) setHolderName((user as any).accountHolderName || user.payoutDetails?.accountHolderName || user.name || '');
    }
  }, [user]);

  // Sync default amount when wallet changes or modal opens
  useEffect(() => {
    if (wallet?.availableBalance !== undefined) {
      setAmount(wallet.availableBalance);
    }
  }, [wallet?.availableBalance, showWithdrawModal]);

  const minLimit = wallet?.minimumWithdrawalLimit ?? 200;
  const availableBal = wallet?.availableBalance ?? 0;
  const pendingBal = wallet?.pendingBalance ?? 0;
  const totalEarned = wallet?.totalEarned ?? 0;
  const totalWithdrawn = wallet?.totalWithdrawn ?? 0;

  // Filter withdrawals
  const pendingWithdrawals = withdrawals.filter(w => 
    w.status === 'pending' || w.status === 'processing' || (w.status as any) === 'requested' || w.status === 'approved'
  );
  const completedWithdrawals = withdrawals.filter(w => 
    w.status === 'paid' || (w.status as any) === 'processed' || (w.status as any) === 'completed'
  );
  const rejectedWithdrawals = withdrawals.filter(w => 
    w.status === 'rejected' || w.status === 'cancelled'
  );

  const filteredWithdrawals = withdrawals.filter(w => {
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

    if (numAmount < minLimit) {
      setError(`Minimum withdrawal amount is ₹${minLimit}`);
      return;
    }

    if (numAmount > availableBal) {
      setError(`Requested amount ₹${numAmount} exceeds your available unlocked balance of ₹${availableBal}`);
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
      setSuccessMsg(`Withdrawal request of ₹${numAmount} submitted successfully! Our automated ledger and accounts team will verify and credit your account.`);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setSuccessMsg(null);
      }, 3000);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
            <Wallet className="w-3.5 h-3.5" />
            <span>{t('wallet.title', 'Financial Account & Payouts')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {t('wallet.title', 'Wallet & Rewards')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Manage your verified campaign rewards, track real-time balances, and transfer funds securely to your UPI ID or Bank Account.
          </p>
        </div>

        <button
          id="btn-request-withdrawal-top"
          onClick={() => {
            setShowWithdrawModal(true);
            setError(null);
            setSuccessMsg(null);
          }}
          disabled={availableBal < minLimit}
          className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
            availableBal >= minLimit
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/25 active:scale-95 cursor-pointer'
              : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>{t('wallet.requestWithdrawal', 'Request Withdrawal')}</span>
        </button>
      </div>

      {/* Real-time Balances & Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Available Balance */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
            <span>{t('dashboard.availableBalance', 'Available Balance')}</span>
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            ₹{availableBal}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{t('dashboard.minWithdrawal', 'Min. Payout')}:</span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              ₹{minLimit}
            </span>
          </div>
        </div>

        {/* Card 2: Pending Verification */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
            <span>{t('dashboard.pendingBalance', 'Pending Balance')}</span>
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            ₹{pendingBal}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {t('wallet.unlockedUponAudit', 'Unlocked upon partner audit')}
          </div>
        </div>

        {/* Card 3: Total Earnings */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">
            <span>{t('dashboard.totalEarnings', 'Total Earnings')}</span>
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            ₹{totalEarned}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {t('wallet.lifetimeRewards', 'Lifetime tasks + referral rewards')}
          </div>
        </div>

        {/* Card 4: Total Withdrawn */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            <span>{t('dashboard.totalWithdrawn', 'Total Withdrawn')}</span>
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            ₹{totalWithdrawn}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">{t('wallet.completedPayouts', 'Completed payouts:')}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{completedWithdrawals.length}</span>
          </div>
        </div>
      </div>

      {/* Threshold Status Banner if below minimum limit */}
      {availableBal < minLimit && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start sm:items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-extrabold">Withdrawal Threshold:</span> You need at least ₹{minLimit} in unlocked balance to submit a payout request. You currently have ₹{availableBal}. Complete active partner tasks to reach the threshold!
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('tasks')}
              className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shrink-0 transition-colors"
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
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
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
                        {w.payoutReference ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
                              {w.payoutReference}
                            </span>
                            <button
                              onClick={() => copyUtr(w.payoutReference!)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                              title="Copy UTR"
                            >
                              {copiedUtr === w.payoutReference ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            {w.status === 'rejected' ? 'N/A' : 'Pending transfer'}
                          </span>
                        )}
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
                    className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-lg text-[11px] font-bold"
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
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      method === 'upi'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-extrabold text-xs">UPI Transfer</div>
                      <div className="text-[10px] text-slate-500">Instant VPA transfer</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('bank_transfer')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      method === 'bank_transfer'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-bold'
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-withdrawal-final"
                  type="submit"
                  disabled={loading || availableBal < minLimit}
                  className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all"
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
