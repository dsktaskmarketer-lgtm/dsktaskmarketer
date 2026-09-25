import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  CheckCircle2, 
  X, 
  AlertCircle,
  ShieldCheck,
  Award,
  Filter,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { RewardItem, User } from '../../types';

interface AdminRewardsViewProps {
  rewards: RewardItem[];
  users: User[];
  onGrantBonus: (userId: string, amount: number, description: string) => Promise<void>;
}

export const AdminRewardsView: React.FC<AdminRewardsViewProps> = ({
  rewards,
  users,
  onGrantBonus,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const [amount, setAmount] = useState<number | ''>(200);
  const [reason, setReason] = useState('Admin Performance Bonus');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTable, setSearchTable] = useState('');

  const uniqueUsers = React.useMemo(() => {
    const seen = new Set<string>();
    return users.filter(u => {
      const key = u.id || u.email;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [users]);

  const filteredUsers = uniqueUsers.filter(u => 
    !userSearch ||
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError("Please select a valid user.");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason or note for the reward.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onGrantBonus(selectedUserId, numAmount, reason.trim());
      setSuccessMsg(`₹${numAmount} reward added successfully!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setModalOpen(false);
        setAmount(200);
        setReason('Admin Performance Bonus');
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to add wallet reward.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRewards = rewards.filter(r => {
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesSearch = !searchTable ||
      r.id.toLowerCase().includes(searchTable.toLowerCase()) ||
      r.userId.toLowerCase().includes(searchTable.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTable.toLowerCase())) ||
      ((r as any).referenceId && (r as any).referenceId.toLowerCase().includes(searchTable.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'admin_reward':
      case 'bonus':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <Award className="w-3 h-3" />
            Admin Reward
          </span>
        );
      case 'withdrawal_refund':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
            Withdrawal Refund
          </span>
        );
      case 'task_reward':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Task Reward
          </span>
        );
      case 'referral_reward':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
            Referral Reward
          </span>
        );
      case 'withdrawal':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
            Withdrawal Debit
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block mb-1">
            Accounting Ledger
          </span>
          <h1 className="text-2xl font-black text-slate-900">Platform Rewards & Wallet Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full audit log of task verification rewards, referral rewards, withdrawal refunds, and admin wallet credits.
          </p>
        </div>

        <button
          id="btn-add-wallet-reward"
          onClick={() => {
            setModalOpen(true);
            setError(null);
            setSuccessMsg(null);
          }}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Wallet Reward</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            placeholder="Search by transaction ID, user, or reason..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({rewards.length})
          </button>
          <button
            onClick={() => setFilterType('admin_reward')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterType === 'admin_reward' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Admin Rewards ({rewards.filter(r => r.type === 'admin_reward' || r.type === 'bonus').length})
          </button>
          <button
            onClick={() => setFilterType('task_reward')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterType === 'task_reward' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tasks ({rewards.filter(r => r.type === 'task_reward').length})
          </button>
          <button
            onClick={() => setFilterType('referral_reward')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterType === 'referral_reward' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Referrals ({rewards.filter(r => r.type === 'referral_reward').length})
          </button>
          <button
            onClick={() => setFilterType('withdrawal_refund')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterType === 'withdrawal_refund' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Refunds ({rewards.filter(r => r.type === 'withdrawal_refund').length})
          </button>
        </div>
      </div>

      {/* Rewards Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3.5 px-6">Transaction ID</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Reason / Description</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date/Time</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRewards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredRewards.map(r => {
                  const targetUser = users.find(u => u.id === r.userId || (u.email && u.email.toLowerCase() === r.userId.toLowerCase()));
                  const isNegative = r.type === 'withdrawal' && r.amount > 0 ? false : r.amount < 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-700">
                        {r.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">
                          {targetUser ? targetUser.name : r.userId}
                        </div>
                        {targetUser && (
                          <div className="text-[10px] text-slate-500">{targetUser.email}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {getTypeBadge(r.type)}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-800 max-w-xs">
                        {r.description}
                        {(r as any).addedByAdmin && (
                          <div className="text-[10px] text-slate-400">
                            By: {(r as any).addedByAdmin}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {new Date(r.createdAt).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className={`py-4 px-6 text-right font-black text-sm ${
                        isNegative ? 'text-rose-700' : 'text-emerald-700'
                      }`}>
                        {isNegative ? `-₹${Math.abs(r.amount)}` : `+₹${r.amount}`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Wallet Reward Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Add Wallet Reward</h3>
                  <p className="text-[10px] text-slate-500">Credit verified balance directly to user wallet</p>
                </div>
              </div>
              <button 
                onClick={() => !submitting && setModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrant} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-bold">{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Search & Select User
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search member by name or email..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 mb-1"
                  />
                  <select
                    id="select-user-wallet-reward"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900 bg-white font-medium"
                  >
                    {filteredUsers.length === 0 ? (
                      <option value="">No matching users found</option>
                    ) : (
                      filteredUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.email} ({u.role})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Reward Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                    ₹
                  </span>
                  <input
                    id="input-reward-amount"
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 200"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900 font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {[50, 100, 200, 500].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                    >
                      +₹{val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Reason / Note
                </label>
                <input
                  id="input-reward-reason"
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Top Performance Special Bonus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Permanent Ledger Record:</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Transaction type: <span className="font-bold text-purple-700">Admin Reward</span></li>
                  <li>Balance will immediately credit to selected user</li>
                  <li>Record is permanently saved and audited</li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-add-reward"
                  type="submit"
                  disabled={submitting || !selectedUserId}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Crediting...' : 'Confirm Add Reward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
