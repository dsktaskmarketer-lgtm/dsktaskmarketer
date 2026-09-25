import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  Gift, 
  RotateCcw, 
  ArrowUpRight, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { fetchAdminReferrals } from '../../services/api';

interface AdminReferralsViewProps {
  onRefresh?: () => void;
}

export const AdminReferralsView: React.FC<AdminReferralsViewProps> = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReferrals();
      setReferrals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load admin referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const filteredReferrals = referrals.filter(r => {
    const term = search.toLowerCase();
    const matchesSearch = 
      (r.referrerName && r.referrerName.toLowerCase().includes(term)) ||
      (r.referrerEmail && r.referrerEmail.toLowerCase().includes(term)) ||
      (r.referredUserName && r.referredUserName.toLowerCase().includes(term)) ||
      (r.referredUserEmail && r.referredUserEmail.toLowerCase().includes(term)) ||
      (r.referralCode && r.referralCode.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalReferrals = referrals.length;
  const creditedReferrals = referrals.filter(r => r.status === 'reward_credited').length;
  const pendingReferrals = referrals.filter(r => r.status !== 'reward_credited').length;
  const totalCreditedAmount = creditedReferrals * 50;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Referrals & Affiliate Growth</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit affiliate invitations, verify qualified tasks, and inspect platform referral rewards.
          </p>
        </div>

        <button
          onClick={loadReferrals}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-fit"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Invitations</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalReferrals}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-emerald-500" />
            <span>Platform-wide member signups</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rewards Credited</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{creditedReferrals}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Completed qualifying task</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Qualification</div>
          <div className="text-2xl font-black text-amber-500 mt-1">{pendingReferrals}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Awaiting verified first task</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disbursed Affiliate Rewards</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{totalCreditedAmount.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Award className="w-3 h-3 text-emerald-500" />
            <span>₹50 incentive per valid user</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member, email, or code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses ({referrals.length})</option>
            <option value="reward_credited">Reward Credited ({creditedReferrals})</option>
            <option value="qualifying_action_pending">Pending Qualification</option>
            <option value="registered">Just Registered</option>
          </select>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RotateCcw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
            <span>Loading referral logs...</span>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Gift className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <p className="font-bold">No referral logs found</p>
            <p className="text-[11px] text-slate-400 mt-1">When users refer others through their link, invitations appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Referrer (Invited By)</th>
                  <th className="py-3.5 px-4">Referred Member</th>
                  <th className="py-3.5 px-4">Date Registered</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Affiliate Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredReferrals.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.referrerName || 'Member'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {r.referrerEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.referredUserName || 'Referred Member'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {r.referredUserEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      {r.status === 'reward_credited' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Reward Credited
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Pending Task
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      ₹{r.rewardAmount || 50}
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
