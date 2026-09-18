import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  CheckCircle2, 
  X, 
  AlertCircle 
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
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState('Top Performance Special Bonus');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await onGrantBonus(selectedUserId, Number(amount), description);
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to grant reward");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block mb-1">
            Accounting Ledger
          </span>
          <h1 className="text-2xl font-black text-slate-900">Platform Rewards Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full audit log of task verification rewards, referral rewards, and administrative incentives.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Grant Member Bonus</span>
        </button>
      </div>

      {/* Rewards Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3.5 px-6">Transaction ID</th>
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rewards.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-slate-700">
                    {r.id}
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-500">
                    {r.userId}
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-900">
                    {r.description}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {r.type}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-6 text-right font-black text-emerald-800 text-sm">
                    +₹{r.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Bonus Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Grant Promotional Bonus</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrant} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">Select Member</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900 bg-white"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Bonus Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Bonus Reason / Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Granting...' : 'Credit Bonus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
