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
import { WalletSummary, RewardItem } from '../../types';

interface UserEarningsViewProps {
  wallet: WalletSummary;
  rewards: RewardItem[];
  onNavigate: (view: string) => void;
}

export const UserEarningsView: React.FC<UserEarningsViewProps> = ({
  wallet,
  rewards,
  onNavigate,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredRewards = rewards.filter(r => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task_reward': return 'Task Verified Reward';
      case 'referral_bonus': return 'Referral Growth Bonus';
      case 'bonus': return 'Promotional Bonus';
      default: return 'Transaction';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
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
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
            Cancelled / Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block mb-1">
            Financial Ledger
          </span>
          <h1 className="text-2xl font-black text-slate-900">Earnings & Wallet</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of your task earnings, referral bonuses, and payout history.
          </p>
        </div>

        <button
          onClick={() => onNavigate('withdrawals')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          Request Withdrawal
        </button>
      </div>

      {/* Wallet Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Available Balance</span>
          <div className="text-3xl font-black text-emerald-950">₹{wallet.availableBalance}</div>
          <p className="text-[11px] text-emerald-700 font-semibold pt-1">Unlocked for withdrawal</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Verification</span>
          <div className="text-3xl font-black text-amber-700">₹{wallet.pendingBalance}</div>
          <p className="text-[11px] text-slate-500 pt-1">Awaiting partner reconciliation</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Paid Out</span>
          <div className="text-3xl font-black text-slate-800">₹{wallet.totalWithdrawn}</div>
          <p className="text-[11px] text-slate-500 pt-1">Disbursed to UPI/Bank</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lifetime Earnings</span>
          <div className="text-3xl font-black text-indigo-950">₹{wallet.totalEarned}</div>
          <p className="text-[11px] text-indigo-700 font-semibold pt-1">Verified task & referral rewards</p>
        </div>
      </div>

      {/* Rewards Ledger Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Reward Transaction History</h2>
            <p className="text-xs text-slate-500">All credited rewards and pending audit line-items</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('task_reward')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                filterType === 'task_reward' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setFilterType('referral_bonus')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                filterType === 'referral_bonus' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Referrals
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
                  <th className="pb-3 pr-4">Category / Type</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRewards.map(rew => (
                  <tr key={rew.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-900">{rew.description}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">Ref: {rew.id}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="font-medium text-slate-600">
                        {getTypeLabel(rew.type)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500">
                      {new Date(rew.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 pr-4">
                      {getStatusBadge(rew.status)}
                    </td>
                    <td className="py-3.5 text-right font-black text-sm text-emerald-800">
                      +₹{rew.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
