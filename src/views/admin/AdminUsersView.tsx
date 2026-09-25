import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  UserCheck,
  Smartphone,
  Mail,
  PlusCircle,
  Gift,
  X,
  AlertCircle,
  Loader2,
  TrendingUp,
  Award,
  Trash2
} from 'lucide-react';
import { User } from '../../types';
import { cleanupAdminAccounts } from '../../services/api';

export type ManualRewardType = 'task_reward' | 'referral_reward' | 'manual_reward';

interface AdminUsersViewProps {
  users: User[];
  onToggleUserStatus: (userId: string) => Promise<void>;
  onAddManualReward?: (
    userId: string, 
    amount: number, 
    type: ManualRewardType, 
    reason: string
  ) => Promise<void>;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  onToggleUserStatus,
  onAddManualReward
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Manual Reward Modal State
  const [rewardModalUser, setRewardModalUser] = useState<User | null>(null);
  const [rewardType, setRewardType] = useState<ManualRewardType>('task_reward');
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Admin Account Cleanup Modal State
  const [showCleanupModal, setShowCleanupModal] = useState<boolean>(false);
  const [cleaningUp, setCleaningUp] = useState<boolean>(false);
  const [cleanupResult, setCleanupResult] = useState<{ success: boolean; message: string } | null>(null);

  // Guarantee uniqueness and prevent duplicate key warnings
  const uniqueUsers = React.useMemo(() => {
    const seen = new Set<string>();
    return users.filter(u => {
      const key = u.id || u.email;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [users]);

  const filtered = uniqueUsers.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.referralCode.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleCleanupConfirm = async () => {
    try {
      setCleaningUp(true);
      setCleanupResult(null);
      const res = await cleanupAdminAccounts();
      setCleanupResult({
        success: true,
        message: res.message || "Successfully cleaned up extra admin accounts. dsktaskmarketer@gmail.com is the sole retained administrator."
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setCleanupResult({
        success: false,
        message: err.message || "Failed to purge admin accounts."
      });
    } finally {
      setCleaningUp(false);
    }
  };

  const handleOpenRewardModal = (user: User) => {
    setRewardModalUser(user);
    setRewardType('task_reward');
    setAmount('');
    setReason('');
    setModalError(null);
    setModalSuccess(null);
  };

  const handleCloseRewardModal = () => {
    if (submitting) return;
    setRewardModalUser(null);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardModalUser) return;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setModalError('Amount must be greater than ₹0.');
      return;
    }

    if (!reason.trim()) {
      setModalError('Reason / Note is required before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);

      if (onAddManualReward) {
        await onAddManualReward(rewardModalUser.id, numAmount, rewardType, reason.trim());
      } else {
        // Direct API Fallback
        const token = localStorage.getItem('dsk_auth_token');
        const res = await fetch('/api/admin/rewards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            userId: rewardModalUser.id,
            amount: numAmount,
            rewardType: rewardType,
            reason: reason.trim(),
            idempotencyKey: `idemp_${Date.now()}_${Math.random()}`
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to credit manual reward');
        }
      }

      setModalSuccess(`Successfully credited ₹${numAmount} to ${rewardModalUser.name}!`);
      setTimeout(() => {
        handleCloseRewardModal();
      }, 1200);
    } catch (err: any) {
      setModalError(err.message || 'Error crediting reward. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block mb-1">
          Membership
        </span>
        <h1 className="text-2xl font-black text-slate-900">User Account Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View member registration data, active wallets, referral codes, and securely grant manual wallet rewards.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or referral code..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              roleFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Roles ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('user')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              roleFilter === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Members ({users.filter(u => u.role === 'user').length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              roleFilter === 'admin' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Admins ({uniqueUsers.filter(u => u.role === 'admin').length})
          </button>

          <button
            onClick={() => setShowCleanupModal(true)}
            className="px-3 py-1.5 rounded-xl font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Permanently remove all other admin accounts and keep only dsktaskmarketer@gmail.com"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Purge Extra Admins</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">First Name</th>
                <th className="py-3.5 px-4">Last Name</th>
                <th className="py-3.5 px-4">Mobile Number</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Referral Code</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const nameParts = (u.name || '').trim().split(' ');
                const firstName = nameParts[0] || '-';
                const lastName = nameParts.slice(1).join(' ') || '-';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-blue-900">
                      {u.id}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {firstName}
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      {lastName}
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {u.mobile || (u as any).phone || (u as any).phoneNumber || '—'}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {u.email}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-800">
                      {u.referralCode || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Add Manual Reward Button */}
                        <button
                          onClick={() => handleOpenRewardModal(u)}
                          className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Add manual wallet reward for this user"
                        >
                          <Gift className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Add Reward</span>
                        </button>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual User Reward Modal */}
      {rewardModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Add Manual Reward</h3>
                  <p className="text-xs text-slate-500">
                    Crediting wallet for <strong className="text-slate-800">{rewardModalUser.name}</strong> ({rewardModalUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseRewardModal}
                disabled={submitting}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Messages */}
            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {/* Reward Form */}
            <form onSubmit={handleRewardSubmit} className="space-y-4 text-xs">
              {/* Reward Type Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Reward Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRewardType('task_reward')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      rewardType === 'task_reward'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Task Reward
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Adds to wallet & records as Task Earnings
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRewardType('referral_reward')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      rewardType === 'referral_reward'
                        ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-bold ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1 text-teal-800">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                      Referral Reward
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Adds to wallet & records as Referral Earnings
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRewardType('manual_reward')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      rewardType === 'manual_reward'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1 text-purple-800">
                      <Award className="w-3.5 h-3.5 text-purple-600" />
                      Other / Manual
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Adds to wallet & records as Manual Reward
                    </p>
                  </button>
                </div>
              </div>

              {/* Amount (₹) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 200"
                    disabled={submitting}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-black text-slate-900 text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Amount must be greater than ₹0.</p>
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason / Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Manual task verification payout, campaign special bonus, referral dispute resolution"
                  disabled={submitting}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Required. This reason will appear in the user's financial ledger.</p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseRewardModal}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !amount || Number(amount) <= 0 || !reason.trim()}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm & Add Reward</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Accounts Cleanup Confirmation Modal */}
      {showCleanupModal && (
        <div id="admin-cleanup-confirmation-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Purge Extra Admin Accounts</h3>
                  <p className="text-[11px] text-slate-500">Security & Access Management</p>
                </div>
              </div>
              <button 
                onClick={() => { if (!cleaningUp) { setShowCleanupModal(false); setCleanupResult(null); } }}
                disabled={cleaningUp}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Permanent Action</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Permanently delete all other admin accounts and keep only <strong className="font-black underline">dsktaskmarketer@gmail.com</strong>?
                </p>
              </div>

              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <p className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>dsktaskmarketer@gmail.com</strong> will remain the sole authorized administrator.</span>
                </p>
                <p className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Normal users, client accounts, tasks, rewards, and wallets will NOT be touched.</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Enforced permanently: Deleted accounts cannot be recreated or restored as admins.</span>
                </p>
              </div>

              {cleanupResult && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  cleanupResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {cleanupResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{cleanupResult.message}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowCleanupModal(false); setCleanupResult(null); }}
                disabled={cleaningUp}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCleanupConfirm}
                disabled={cleaningUp}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-black text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {cleaningUp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{cleaningUp ? 'Purging...' : 'Yes, Delete Other Admins'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
