import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Users, 
  CheckSquare, 
  TrendingUp, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  CheckCircle2, 
  Clock, 
  Search, 
  Calendar, 
  RefreshCw, 
  Sliders, 
  FileText, 
  AlertCircle,
  Coins
} from 'lucide-react';
import { 
  AdminIncentivesOverview, 
  IncentivePlanType, 
  IncentivePlanConfig, 
  IncentiveMilestone,
  IncentiveClaimRecord,
  AdminIncentiveUserItem
} from '../../types';
import { useToast } from '../../context/ToastContext';
import {
  fetchAdminIncentives,
  updateAdminIncentivePlan,
  createAdminIncentiveMilestone,
  updateAdminIncentiveMilestone,
  deleteAdminIncentiveMilestone,
  updateAdminIncentiveClaim
} from '../../services/api';

export const AdminIncentivesView: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminIncentivesOverview | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'plans' | 'users' | 'claims'>('plans');

  // Plan editing modal / state
  const [editingPlanType, setEditingPlanType] = useState<IncentivePlanType | null>(null);
  const [planForm, setPlanForm] = useState<Partial<IncentivePlanConfig>>({});
  const [savingPlan, setSavingPlan] = useState(false);

  // Milestone editing modal / state
  const [milestoneModal, setMilestoneModal] = useState<{
    isOpen: boolean;
    planType: IncentivePlanType;
    milestone?: IncentiveMilestone;
    target: number;
    bonusAmount: number;
    title: string;
    description: string;
  }>({
    isOpen: false,
    planType: 'referral_target',
    target: 5,
    bonusAmount: 50,
    title: '',
    description: ''
  });

  // User search & claim filters
  const [userSearch, setUserSearch] = useState('');
  const [claimSearch, setClaimSearch] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('all');

  const loadData = async (month?: string) => {
    setLoading(true);
    try {
      const data = await fetchAdminIncentives(month);
      setOverview(data);
      if (!selectedMonth && data.selectedMonth) {
        setSelectedMonth(data.selectedMonth);
      }
    } catch (err: any) {
      console.error('Error loading admin incentives:', err);
      showToast(err.message || 'Failed to load incentives', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMonth || undefined);
  }, [selectedMonth]);

  // Plan toggling & saving
  const handleTogglePlan = async (planType: IncentivePlanType, currentEnabled: boolean) => {
    try {
      await updateAdminIncentivePlan(planType, { enabled: !currentEnabled });
      showToast(`Plan ${!currentEnabled ? 'Enabled' : 'Disabled'} successfully`, 'success');
      loadData(selectedMonth);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenEditPlan = (plan: IncentivePlanConfig) => {
    setEditingPlanType(plan.planType);
    setPlanForm({
      title: plan.title,
      subtitle: plan.subtitle,
      shortDescription: plan.shortDescription,
      qualifyingCondition: plan.qualifyingCondition,
      autoCreditOnUnlock: plan.autoCreditOnUnlock !== false
    });
  };

  const handleSavePlanConfig = async () => {
    if (!editingPlanType) return;
    setSavingPlan(true);
    try {
      await updateAdminIncentivePlan(editingPlanType, planForm);
      showToast('Plan configuration updated!', 'success');
      setEditingPlanType(null);
      loadData(selectedMonth);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  // Milestone creation / editing
  const handleOpenMilestoneModal = (planType: IncentivePlanType, milestone?: IncentiveMilestone) => {
    if (milestone) {
      setMilestoneModal({
        isOpen: true,
        planType,
        milestone,
        target: milestone.target,
        bonusAmount: milestone.bonusAmount,
        title: milestone.title || '',
        description: milestone.description || ''
      });
    } else {
      setMilestoneModal({
        isOpen: true,
        planType,
        target: 10,
        bonusAmount: 100,
        title: '',
        description: ''
      });
    }
  };

  const handleSaveMilestone = async () => {
    try {
      const { planType, milestone, target, bonusAmount, title, description } = milestoneModal;
      if (milestone) {
        // Edit existing
        await updateAdminIncentiveMilestone(planType, milestone.id, { target, bonusAmount, title, description });
        showToast('Milestone updated successfully', 'success');
      } else {
        // Create new
        await createAdminIncentiveMilestone(planType, { target, bonusAmount, title, description });
        showToast('New milestone tier added!', 'success');
      }

      setMilestoneModal(prev => ({ ...prev, isOpen: false }));
      loadData(selectedMonth);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteMilestone = async (planType: IncentivePlanType, milestoneId: string) => {
    if (!window.confirm('Are you sure you want to delete this milestone tier?')) return;
    try {
      await deleteAdminIncentiveMilestone(planType, milestoneId);
      showToast('Milestone tier deleted', 'success');
      loadData(selectedMonth);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Claim status manual approval
  const handleUpdateClaimStatus = async (claimId: string, status: 'credited' | 'paid') => {
    try {
      await updateAdminIncentiveClaim(claimId, status, 'Approved via Admin Panel');
      showToast('Claim approved and bonus credited to user wallet!', 'success');
      loadData(selectedMonth);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (loading && !overview) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading Monthly Incentive Management...</p>
      </div>
    );
  }

  const stats = overview?.stats;

  // Filtered users
  const filteredUsers = (overview?.users || []).filter(u => {
    const term = userSearch.toLowerCase();
    return u.userName.toLowerCase().includes(term) || u.userEmail.toLowerCase().includes(term);
  });

  // Filtered claims
  const filteredClaims = (overview?.claims || []).filter(c => {
    const term = claimSearch.toLowerCase();
    const matchSearch = c.userName.toLowerCase().includes(term) || c.userEmail.toLowerCase().includes(term) || c.planTitle.toLowerCase().includes(term);
    const matchStatus = claimStatusFilter === 'all' || c.status === claimStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>3-Plan Monthly Incentive Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure independent milestone plans, adjust targets & bonus amounts, and monitor user progress.
          </p>
        </div>

        {/* Month Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              {overview?.availableMonths?.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {m === overview.currentMonth ? `${m} (Current)` : m}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => loadData(selectedMonth)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Active Participants</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats?.totalParticipants ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Bonuses Credited</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{stats?.totalBonusesCredited ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Referral Bonuses</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{stats?.referralBonusesPaid ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Task Count Bonuses</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">₹{stats?.taskBonusesPaid ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Earning Milestones</p>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{stats?.earningBonusesPaid ?? 0}</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-white dark:bg-slate-800 text-blue-600 border-t-2 border-blue-600 border-x border-slate-200 dark:border-slate-700 -mb-px'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Plan Configurations & Milestones</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-800 text-blue-600 border-t-2 border-blue-600 border-x border-slate-200 dark:border-slate-700 -mb-px'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Monthly Progress ({filteredUsers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'claims'
              ? 'bg-white dark:bg-slate-800 text-blue-600 border-t-2 border-blue-600 border-x border-slate-200 dark:border-slate-700 -mb-px'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Claims & Payout Receipts ({filteredClaims.length})</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PLAN CONFIGURATIONS & MILESTONES */}
      {/* ============================================================ */}
      {activeTab === 'plans' && overview?.plans && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.keys(overview.plans) as IncentivePlanType[]).map((planType) => {
            const plan = overview.plans[planType];
            const isRef = planType === 'referral_target';
            const isEarn = planType === 'earning_milestone';

            return (
              <div key={planType} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between overflow-hidden">
                <div className="p-5 space-y-4">
                  {/* Plan Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isRef ? 'bg-amber-100 text-amber-700' : isEarn ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isRef ? <Users className="w-5 h-5" /> : isEarn ? <TrendingUp className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{plan.title}</h4>
                        <p className="text-[11px] text-slate-400">{plan.subtitle}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePlan(planType, plan.enabled)}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        plan.enabled
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800'
                      }`}
                    >
                      {plan.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* Plan Details & Qualifying Rule */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 text-xs">
                    <p className="text-slate-600 dark:text-slate-300">{plan.shortDescription}</p>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <strong>Qualifying Rule:</strong> {plan.qualifyingCondition}
                    </p>
                  </div>

                  {/* Milestones Header */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Milestone Tiers ({plan.milestones.length})
                    </span>
                    <button
                      onClick={() => handleOpenMilestoneModal(planType)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tier</span>
                    </button>
                  </div>

                  {/* Milestones List */}
                  <div className="space-y-2">
                    {plan.milestones.map((ms) => (
                      <div key={ms.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            Target: {isEarn ? `₹${ms.target}` : ms.target} {isRef ? 'Referrals' : isEarn ? 'Earnings' : 'Tasks'}
                          </p>
                          <p className="text-[10px] text-slate-400">{ms.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            +₹{ms.bonusAmount}
                          </span>
                          <button
                            onClick={() => handleOpenMilestoneModal(planType, ms)}
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="Edit Tier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(planType, ms.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete Tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit Plan Button */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => handleOpenEditPlan(plan)}
                    className="w-full py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configure Plan Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: USER MONTHLY PROGRESS TABLE */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold">
              Showing {filteredUsers.length} Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3 text-center">Month Qualifying Referrals</th>
                  <th className="px-4 py-3 text-center">Month Tasks Completed</th>
                  <th className="px-4 py-3 text-center">Month Task Earnings</th>
                  <th className="px-4 py-3 text-center">Total Credited Bonuses</th>
                  <th className="px-4 py-3 text-center">Claims</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <p className="font-extrabold text-slate-900 dark:text-white">{u.userName}</p>
                        <p className="text-[10px] text-slate-400">{u.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-amber-600 dark:text-amber-400">
                        {u.referralCount}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                        {u.taskCount}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{u.taskEarnings}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-slate-900 dark:text-white">
                        ₹{u.creditedBonuses}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {u.claimsCount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs italic">
                      No user activity found for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: CLAIMS & PAYOUTS LEDGER */}
      {/* ============================================================ */}
      {activeTab === 'claims' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={claimSearch}
                onChange={(e) => setClaimSearch(e.target.value)}
                placeholder="Search by user or plan..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={claimStatusFilter}
              onChange={(e) => setClaimStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="credited">Credited to Wallet</option>
              <option value="unlocked">Unlocked (Pending)</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Claim Date</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3 text-center">Target</th>
                  <th className="px-4 py-3 text-center">Bonus</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredClaims.length > 0 ? (
                  filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-extrabold text-slate-900 dark:text-white">{claim.userName}</p>
                        <p className="text-[10px] text-slate-400">{claim.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {claim.planTitle}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-300">
                        {claim.targetValue}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-amber-600 dark:text-amber-400">
                        ₹{claim.bonusAmount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          claim.status === 'credited' || claim.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {claim.status === 'credited' ? 'Credited' : claim.status === 'unlocked' ? 'Unlocked' : 'Paid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {claim.status === 'unlocked' && (
                          <button
                            onClick={() => handleUpdateClaimStatus(claim.id, 'credited')}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
                          >
                            Credit Wallet
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 text-xs italic">
                      No claim receipts found for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT PLAN DETAILS */}
      {/* ============================================================ */}
      {editingPlanType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Configure Incentive Plan
              </h3>
              <button onClick={() => setEditingPlanType(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Plan Title</label>
                <input
                  type="text"
                  value={planForm.title || ''}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Subtitle</label>
                <input
                  type="text"
                  value={planForm.subtitle || ''}
                  onChange={(e) => setPlanForm({ ...planForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={planForm.shortDescription || ''}
                  onChange={(e) => setPlanForm({ ...planForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Qualifying Condition (Displayed to Users)</label>
                <textarea
                  rows={2}
                  value={planForm.qualifyingCondition || ''}
                  onChange={(e) => setPlanForm({ ...planForm, qualifyingCondition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoCreditCheck"
                  checked={planForm.autoCreditOnUnlock !== false}
                  onChange={(e) => setPlanForm({ ...planForm, autoCreditOnUnlock: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="autoCreditCheck" className="text-slate-700 dark:text-slate-300 font-bold">
                  Auto-credit cash bonus to user wallet upon unlocking milestone
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setEditingPlanType(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlanConfig}
                disabled={savingPlan}
                className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT MILESTONE TIER */}
      {/* ============================================================ */}
      {milestoneModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {milestoneModal.milestone ? 'Edit Milestone Tier' : 'Add Milestone Tier'}
              </h3>
              <button onClick={() => setMilestoneModal(prev => ({ ...prev, isOpen: false }))} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Requirement ({milestoneModal.planType === 'referral_target' ? 'Referrals' : milestoneModal.planType === 'earning_milestone' ? '₹ Earnings' : 'Tasks'})
                </label>
                <input
                  type="number"
                  min="1"
                  value={milestoneModal.target}
                  onChange={(e) => setMilestoneModal({ ...milestoneModal, target: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cash Bonus Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={milestoneModal.bonusAmount}
                  onChange={(e) => setMilestoneModal({ ...milestoneModal, bonusAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tier Title (e.g. Bronze Milestone)</label>
                <input
                  type="text"
                  value={milestoneModal.title}
                  onChange={(e) => setMilestoneModal({ ...milestoneModal, title: e.target.value })}
                  placeholder="Optional custom title"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tier Description</label>
                <input
                  type="text"
                  value={milestoneModal.description}
                  onChange={(e) => setMilestoneModal({ ...milestoneModal, description: e.target.value })}
                  placeholder="e.g. 5 verified tasks completed"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setMilestoneModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilestone}
                className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Milestone</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
