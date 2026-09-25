import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { WalletSummary, RewardItem, PlatformSettings } from '../../types';

interface UserEarningsViewProps {
  wallet: WalletSummary;
  rewards: RewardItem[];
  settings?: PlatformSettings;
  onNavigate: (view: string) => void;
}

export const UserEarningsView: React.FC<UserEarningsViewProps> = ({
  wallet,
  rewards,
  settings,
  onNavigate,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  // Requirement 5: Dashboard & Ledger Earnings Breakdown
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

  const totalEarnings = taskEarnings + referralEarnings;

  const filteredRewards = rewards.filter(r => {
    if (filterType === 'all') return true;
    if (filterType === 'task_reward') return r.type === 'task_reward';
    if (filterType === 'referral_bonus') return r.type === 'referral_bonus' || r.type === 'referral_reward';
    if (filterType === 'admin_reward') return r.type === 'admin_reward' || r.type === 'manual_reward' || (r.type === 'bonus' && !r.description?.toLowerCase().includes('refund'));
    if (filterType === 'withdrawal_refund') return r.type === 'withdrawal_refund' || r.description?.toLowerCase().includes('refund');
    return r.type === filterType;
  });

  const getTypeLabel = (type: string, description?: string) => {
    const desc = (description || '').toLowerCase();
    switch (type) {
      case 'task_reward':
        return 'Task Reward';
      case 'referral_reward':
      case 'referral_bonus':
        return 'Referral Reward';
      case 'manual_reward':
        return 'Manual Reward';
      case 'admin_reward':
        return 'Manual Reward';
      case 'withdrawal_refund':
        return 'Withdrawal Refund';
      case 'withdrawal':
        return 'Withdrawal';
      case 'bonus':
        return desc.includes('refund') ? 'Withdrawal Refund' : 'Manual Reward';
      default:
        if (desc.includes('refund')) return 'Withdrawal Refund';
        if (desc.includes('referral')) return 'Referral Reward';
        if (desc.includes('task')) return 'Task Reward';
        if (desc.includes('admin') || desc.includes('manual')) return 'Manual Reward';
        return 'Reward';
    }
  };

  const getTypeBadgeClass = (label: string) => {
    switch (label) {
      case 'Task Reward':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Referral Reward':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Manual Reward':
      case 'Admin Reward':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Withdrawal Refund':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Withdrawal':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'credited':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Available / Credited
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
            Audit Pending
          </span>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
            Cancelled / Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full px-2.5 sm:px-6 py-3 sm:py-8 space-y-3 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2">
        <div>
          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 sm:py-1 rounded-md inline-block mb-0.5 border border-blue-200">
            Financial Ledger & Payouts
          </span>
          <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">Earnings & Financial Wallet</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent breakdown of task earnings, referral bonuses, and payouts.
          </p>
        </div>

        <button
          onClick={() => onNavigate('withdrawals')}
          className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] sm:text-xs rounded-lg sm:rounded-xl shadow-md shadow-red-600/20 transition-all shrink-0 cursor-pointer"
        >
          Request Withdrawal
        </button>
      </div>

      {/* Wallet Metric Cards (1x4 Compact Horizontal Row on Mobile) */}
      <div className="space-y-2 sm:space-y-4 w-full">
        <div className="grid grid-cols-4 gap-1 xs:gap-1.5 sm:gap-4 lg:gap-5 w-full">
          {/* Card 1: Available Balance */}
          <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-3xl p-1.5 xs:p-2 sm:p-6 border-2 border-blue-500/40 dark:border-blue-500/30 shadow-2xs space-y-0.5 min-w-0">
            <div className="flex items-center justify-between gap-0.5 min-w-0">
              <span className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-black uppercase tracking-tight text-blue-700 dark:text-blue-400 truncate">Available</span>
              <span className="hidden sm:inline-block text-[10px] font-black bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-md shadow-2xs">Active</span>
            </div>
            <div className="text-xs xs:text-sm sm:text-3xl font-black text-slate-900 dark:text-white truncate">₹{wallet?.availableBalance ?? 0}</div>
            <p className="text-[7px] xs:text-[8px] sm:text-[11px] text-blue-700 dark:text-blue-400 font-semibold pt-0.5 truncate">Unlocked</p>
          </div>

          {/* Card 2: Task Earnings (Requirement 5) */}
          <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-3xl p-1.5 xs:p-2 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-0.5 min-w-0">
            <span className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-black uppercase tracking-tight text-blue-700 dark:text-blue-400 block truncate">Tasks</span>
            <div className="text-xs xs:text-sm sm:text-3xl font-black text-slate-900 dark:text-white truncate">₹{taskEarnings}</div>
            <p className="text-[7px] xs:text-[8px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-semibold pt-0.5 truncate">Task rewards</p>
          </div>

          {/* Card 3: Referral Earnings (Requirement 5) */}
          <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-3xl p-1.5 xs:p-2 sm:p-6 border border-yellow-200/90 dark:border-slate-800 shadow-2xs space-y-0.5 min-w-0">
            <span className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-black uppercase tracking-tight text-yellow-800 dark:text-yellow-400 block truncate">Referrals</span>
            <div className="text-xs xs:text-sm sm:text-3xl font-black text-yellow-900 dark:text-yellow-300 truncate">₹{referralEarnings}</div>
            <p className="text-[7px] xs:text-[8px] sm:text-[11px] text-yellow-700 dark:text-yellow-400 font-semibold pt-0.5 truncate">Invite rewards</p>
          </div>

          {/* Card 4: Total Earnings (Requirement 5 Formula) */}
          <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-3xl p-1.5 xs:p-2 sm:p-6 border-2 border-red-500/30 dark:border-red-900/60 shadow-2xs space-y-0.5 min-w-0">
            <span className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-black uppercase tracking-tight text-red-600 dark:text-red-400 block truncate">Total</span>
            <div className="text-xs xs:text-sm sm:text-3xl font-black text-slate-900 dark:text-white truncate">₹{totalEarnings}</div>
            <p className="text-[7px] xs:text-[8px] sm:text-[11px] text-red-600 dark:text-red-400 font-semibold pt-0.5 truncate">All earnings</p>
          </div>
        </div>
      </div>

        {/* Secondary Info Bar: Pending Verification & Total Withdrawn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50/70 border border-yellow-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-bold text-yellow-900">
                Pending Verification: <strong className="text-sm font-black text-yellow-900">₹{wallet?.pendingBalance ?? wallet?.pendingRewards ?? 0}</strong>
              </span>
            </div>
            <span className="text-[11px] text-yellow-700 font-medium">Unlocked upon partner reconciliation</span>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-950">
                Total Withdrawn: <strong className="text-sm font-black text-blue-800">₹{wallet?.totalWithdrawn ?? 0}</strong>
              </span>
            </div>
            <span className="text-[11px] text-blue-700 font-medium">Disbursed to UPI / Bank Account</span>
          </div>
        </div>

      {/* Rewards Ledger Table (Requirement 6) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Reward Transaction History</h2>
            <p className="text-xs text-slate-500">All credited rewards, refunds, and line-items</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('task_reward')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterType === 'task_reward' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Task Rewards
            </button>
            <button
              onClick={() => setFilterType('referral_bonus')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterType === 'referral_bonus' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Referral Rewards
            </button>
            <button
              onClick={() => setFilterType('admin_reward')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterType === 'admin_reward' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Admin Rewards
            </button>
            <button
              onClick={() => setFilterType('withdrawal_refund')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterType === 'withdrawal_refund' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Withdrawal Refunds
            </button>
          </div>
        </div>

        {filteredRewards.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
            No reward transactions recorded under this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4">Transaction Type</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRewards.map(rew => {
                  const typeLabel = getTypeLabel(rew.type, rew.description);
                  const badgeClass = getTypeBadgeClass(typeLabel);
                  const isDebit = rew.type === 'withdrawal';

                  return (
                    <tr key={rew.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 pr-4">
                        <p className="font-bold text-slate-900">{rew.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            Ref: {rew.referenceId || rew.id}
                          </span>
                          {rew.addedByAdmin && (
                            <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60">
                              Admin: {rew.addedByAdmin}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badgeClass}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500">
                        {new Date(rew.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 pr-4">
                        {getStatusBadge(rew.status)}
                      </td>
                      <td className={`py-3.5 text-right font-black text-sm ${isDebit ? 'text-slate-900' : 'text-emerald-800'}`}>
                        {isDebit ? '-' : '+'}₹{rew.amount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
