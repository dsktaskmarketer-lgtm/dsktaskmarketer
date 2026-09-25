import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Users, 
  CheckSquare, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Gift, 
  ChevronDown, 
  ChevronUp, 
  History, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Wallet,
  Coins
} from 'lucide-react';
import { User, UserIncentivesOverview, UserMonthlyPlanProgress, IncentivePlanType, WalletSummary } from '../../types';
import { useToast } from '../../context/ToastContext';
import { fetchUserIncentives, claimUserIncentive } from '../../services/api';
import { DskDuoBannerIllustration, IncentivesSectionIllustration } from '../../components/illustrations';

interface UserIncentivesViewProps {
  user: User;
  wallet?: WalletSummary | null;
  onNavigate?: (view: string) => void;
}

export const UserIncentivesView: React.FC<UserIncentivesViewProps> = ({
  user,
  wallet,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<UserIncentivesOverview | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [claimingMilestone, setClaimingMilestone] = useState<string | null>(null);

  const loadIncentives = async (month?: string) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchUserIncentives(month, user.id);
      setOverview(data);
      if (!selectedMonth && data.currentMonth) {
        setSelectedMonth(data.currentMonth);
      }
    } catch (err: any) {
      console.error('Error fetching incentives:', err);
      showToast(err.message || 'Could not load incentives', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncentives(selectedMonth || undefined);
  }, [selectedMonth, user?.id]);

  const handleClaim = async (planType: IncentivePlanType, milestoneId: string) => {
    try {
      setClaimingMilestone(milestoneId);
      const result = await claimUserIncentive(
        planType,
        milestoneId,
        selectedMonth || overview?.currentMonth,
        user?.id
      );

      showToast(result.message || 'Bonus credited to your wallet!', 'success');
      // Refresh incentives data
      await loadIncentives(selectedMonth || undefined);
    } catch (err: any) {
      console.error('Error claiming milestone:', err);
      showToast(err.message || 'Failed to claim bonus', 'error');
    } finally {
      setClaimingMilestone(null);
    }
  };

  const toggleExpand = (planKey: string) => {
    setExpandedDetails(prev => ({ ...prev, [planKey]: !prev[planKey] }));
  };

  if (loading && !overview) {
    return (
      <div className="w-full px-4 md:px-6 py-12">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Loading Monthly Incentive Plans...</h3>
          <p className="text-sm text-slate-500 mt-1">Retrieving your verified tasks, referrals, and milestone progress...</p>
        </div>
      </div>
    );
  }

  const daysRemaining = overview?.daysRemainingInMonth ?? 0;
  const currentMonthName = overview?.currentMonthName || 'Current Month';

  return (
    <div className="w-full px-2 sm:px-6 py-3 sm:py-10 space-y-3 sm:space-y-8">
      
      {/* ============================================================ */}
      {/* 1. HERO & MONTH HEADER BANNER */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-3 sm:p-8 shadow-xl border border-blue-700/40 w-full">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-6">
          <div className="space-y-1 sm:space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[9px] sm:text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-400" />
              <span>DSK 3-Plan Monthly Incentive Engine</span>
            </div>
            <h1 className="text-lg sm:text-4xl font-black text-white tracking-tight">
              Monthly Incentive Rewards
            </h1>
            <p className="text-slate-300 text-[10px] sm:text-base max-w-2xl leading-relaxed">
              Earn generous additional cash bonuses on top of regular task payouts across 3 completely independent monthly milestone plans.
            </p>
          </div>

          {/* Character Duo Artwork & Month Control */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full lg:w-auto">
            <div className="w-52 sm:w-64 hidden md:block">
              <IncentivesSectionIllustration size="sm" />
            </div>

            {/* Quick Metrics & Month Selection */}
            <div className="flex flex-row items-center justify-between gap-2 bg-white/10 backdrop-blur-md p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/15 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 pr-2 border-r border-white/20 min-w-0">
                <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[7.5px] sm:text-[10px] text-slate-300 uppercase font-bold truncate">Selected Month</p>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-white font-black text-[10px] sm:text-sm focus:outline-none cursor-pointer truncate max-w-[100px] sm:max-w-none"
                  >
                    {overview?.historyMonths?.map(hm => (
                      <option key={hm.month} value={hm.month} className="bg-slate-900 text-white">
                        {hm.monthName}
                      </option>
                    )) || (
                      <option value={overview?.currentMonth} className="bg-slate-900 text-white">
                        {currentMonthName}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-1 min-w-0">
                <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[7.5px] sm:text-[10px] text-slate-300 uppercase font-bold truncate">Month Closes In</p>
                  <p className="text-[10px] sm:text-sm font-black text-white truncate">
                    {daysRemaining > 0 ? `${daysRemaining} Days` : 'Ended'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Stats Row (1x4 Horizontal Row on Mobile) */}
        {user ? (
          <div className="mt-3 sm:mt-6 pt-3 sm:pt-6 border-t border-white/15 grid grid-cols-4 gap-1 xs:gap-1.5 sm:gap-4 w-full">
            <div className="bg-white/5 rounded-lg sm:rounded-2xl p-1.5 xs:p-2 sm:p-3 border border-white/10 min-w-0">
              <p className="text-[7.5px] xs:text-[8.5px] sm:text-xs text-slate-300 truncate">Month Bonus</p>
              <p className="text-xs xs:text-sm sm:text-2xl font-black text-amber-400 mt-0.5 truncate">
                ₹{overview?.totalBonusEarnedThisMonth ?? 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg sm:rounded-2xl p-1.5 xs:p-2 sm:p-3 border border-white/10 min-w-0">
              <p className="text-[7.5px] xs:text-[8.5px] sm:text-xs text-slate-300 truncate">All-Time</p>
              <p className="text-xs xs:text-sm sm:text-2xl font-black text-emerald-400 mt-0.5 truncate">
                ₹{overview?.allTimeIncentiveBonus ?? 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg sm:rounded-2xl p-1.5 xs:p-2 sm:p-3 border border-white/10 min-w-0">
              <p className="text-[7.5px] xs:text-[8.5px] sm:text-xs text-slate-300 truncate">Balance</p>
              <p className="text-xs xs:text-sm sm:text-2xl font-black text-white mt-0.5 truncate">
                ₹{wallet?.availableBalance ?? 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg sm:rounded-2xl p-1.5 xs:p-2 sm:p-3 border border-white/10 min-w-0">
              <p className="text-[7.5px] xs:text-[8.5px] sm:text-xs text-slate-300 truncate">Status</p>
              <p className="text-[9px] xs:text-[10px] sm:text-sm font-black text-blue-300 mt-0.5 sm:mt-2 flex items-center gap-1 truncate">
                <CheckCircle2 className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4 text-emerald-400 shrink-0" />
                <span>Active</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Total Bonus Pool</span>
                <span className="text-base font-black text-amber-400">Up to ₹3,700+/mo</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Incentive Tracks</span>
                <span className="text-base font-black text-white">3 Plans Active</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Payout Mode</span>
                <span className="text-base font-black text-emerald-400">Instant Wallet Payout</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {onNavigate && (
                <>
                  <button
                    onClick={() => onNavigate('register')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Sign Up to Earn
                  </button>
                  <button
                    onClick={() => onNavigate('login')}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/30 backdrop-blur-md transition-all cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. THREE INDEPENDENT MONTHLY INCENTIVE PLANS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-6 sm:gap-8 w-full">
        
        {/* ------------------------------------------------------------ */}
        {/* PLAN 1: MONTHLY REFERRAL TARGET INCENTIVE */}
        {/* ------------------------------------------------------------ */}
        {overview?.plans.referral && (
          <PlanCard
            plan={overview.plans.referral}
            badgeColor="amber"
            icon={<Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
            unit="Referrals"
            expanded={Boolean(expandedDetails['referral'])}
            onToggleExpand={() => toggleExpand('referral')}
            onClaim={(milestoneId) => handleClaim('referral_target', milestoneId)}
            claimingMilestone={claimingMilestone}
          />
        )}

        {/* ------------------------------------------------------------ */}
        {/* PLAN 2: MONTHLY TASK COMPLETION INCENTIVE */}
        {/* ------------------------------------------------------------ */}
        {overview?.plans.tasks && (
          <PlanCard
            plan={overview.plans.tasks}
            badgeColor="blue"
            icon={<CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            unit="Tasks"
            expanded={Boolean(expandedDetails['tasks'])}
            onToggleExpand={() => toggleExpand('tasks')}
            onClaim={(milestoneId) => handleClaim('task_completion', milestoneId)}
            claimingMilestone={claimingMilestone}
          />
        )}

        {/* ------------------------------------------------------------ */}
        {/* PLAN 3: MONTHLY EARNING MILESTONE INCENTIVE */}
        {/* ------------------------------------------------------------ */}
        {overview?.plans.earnings && (
          <PlanCard
            plan={overview.plans.earnings}
            badgeColor="emerald"
            icon={<TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
            unit="₹ Earned"
            isCurrency={true}
            expanded={Boolean(expandedDetails['earnings'])}
            onToggleExpand={() => toggleExpand('earnings')}
            onClaim={(milestoneId) => handleClaim('earning_milestone', milestoneId)}
            claimingMilestone={claimingMilestone}
          />
        )}

      </div>

      {/* ============================================================ */}
      {/* 3. HISTORICAL MONTHS & BONUS RECEIPTS */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Incentive Claims & Monthly Records
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Permanent ledger of all unlocked, auto-credited, and claimed monthly bonuses.
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('wallet')}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>View in Wallet</span>
            </button>
          )}
        </div>

        {overview?.historyMonths && overview.historyMonths.length > 0 ? (
          <div className="space-y-4">
            {overview.historyMonths.map(monthData => (
              <div key={monthData.month} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/60 px-5 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {monthData.monthName}
                    </span>
                    {monthData.month === overview.currentMonth && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                        Current Month
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                    Total Bonus: ₹{monthData.totalBonus}
                  </span>
                </div>

                <div className="p-4 divide-y divide-slate-100 dark:divide-slate-700">
                  {monthData.claims.length > 0 ? (
                    monthData.claims.map(claim => (
                      <div key={claim.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span>{claim.planTitle}</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              (Target: {claim.targetValue})
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {claim.creditedAt ? `Credited on ${new Date(claim.creditedAt).toLocaleDateString()}` : `Unlocked on ${new Date(claim.createdAt).toLocaleDateString()}`}
                            {claim.rewardLedgerId && ` • Ref: ${claim.rewardLedgerId.slice(0, 14)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                            +₹{claim.bonusAmount}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {claim.status === 'credited' || claim.status === 'paid' ? 'Credited to Wallet' : 'Unlocked'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">
                      No milestone bonuses unlocked for this month yet. Complete qualifying actions to earn!
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No past incentive records found. Start completing tasks and referring friends today!
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. RULES & TRANSPARENCY CARD */}
      {/* ============================================================ */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>How DSK Monthly Incentive Plans Work</span>
        </h4>
        <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-4 text-[9px] xs:text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed w-full">
          <div className="bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 space-y-0.5 sm:space-y-1 min-w-0">
            <p className="font-extrabold text-slate-900 dark:text-white truncate">1. Independent</p>
            <p className="text-slate-500 line-clamp-3 sm:line-clamp-none">Each plan runs on its own criteria.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 space-y-0.5 sm:space-y-1 min-w-0">
            <p className="font-extrabold text-slate-900 dark:text-white truncate">2. Monthly Reset</p>
            <p className="text-slate-500 line-clamp-3 sm:line-clamp-none">Metrics reset on 1st of every month.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 space-y-0.5 sm:space-y-1 min-w-0">
            <p className="font-extrabold text-slate-900 dark:text-white truncate">3. Wallet Credit</p>
            <p className="text-slate-500 line-clamp-3 sm:line-clamp-none">Bonuses directly credited to wallet.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

// ============================================================
// SUB-COMPONENT: PLAN CARD
// ============================================================
interface PlanCardProps {
  plan: UserMonthlyPlanProgress;
  badgeColor: 'amber' | 'blue' | 'emerald';
  icon: React.ReactNode;
  unit: string;
  isCurrency?: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onClaim: (milestoneId: string) => void;
  claimingMilestone: string | null;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  badgeColor,
  icon,
  unit,
  isCurrency,
  expanded,
  onToggleExpand,
  onClaim,
  claimingMilestone
}) => {
  const { config, currentValue, currentMilestone, nextMilestone, progressPercent, remainingForNext, isMaxTierReached, totalBonusEarnedThisMonth, completedMilestones, upcomingMilestones, qualifyingItems } = plan;

  const colorStyles = {
    amber: {
      border: 'border-amber-200 dark:border-amber-800/60',
      bgHeader: 'bg-amber-50/70 dark:bg-amber-950/20',
      bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
      badge: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      accentText: 'text-amber-600 dark:text-amber-400',
      btn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
    },
    blue: {
      border: 'border-blue-200 dark:border-blue-800/60',
      bgHeader: 'bg-blue-50/70 dark:bg-blue-950/20',
      bar: 'bg-gradient-to-r from-blue-600 to-indigo-500',
      badge: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      accentText: 'text-blue-600 dark:text-blue-400',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
    },
    emerald: {
      border: 'border-emerald-200 dark:border-emerald-800/60',
      bgHeader: 'bg-emerald-50/70 dark:bg-emerald-950/20',
      bar: 'bg-gradient-to-r from-emerald-600 to-teal-500',
      badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
    }
  }[badgeColor];

  const formattedCurrent = isCurrency ? `₹${currentValue.toLocaleString()}` : currentValue;
  const formattedNextTarget = nextMilestone ? (isCurrency ? `₹${nextMilestone.target.toLocaleString()}` : nextMilestone.target) : '';
  const formattedRemaining = isCurrency ? `₹${remainingForNext.toLocaleString()}` : remainingForNext;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl sm:rounded-3xl border ${colorStyles.border} shadow-2xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-md min-w-0 w-full`}>
      
      {/* Top Header */}
      <div>
        <div className={`p-1.5 xs:p-2 sm:p-6 border-b border-slate-100 dark:border-slate-700/80 ${colorStyles.bgHeader} space-y-1 sm:space-y-4 min-w-0`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-3 min-w-0">
            <div className="flex items-start gap-1 sm:gap-3 min-w-0 w-full">
              <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-12 sm:h-12 rounded-md sm:rounded-2xl bg-white dark:bg-slate-800 p-0.5 sm:p-2.5 shadow-2xs border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 [&>svg]:w-2.5 [&>svg]:h-2.5 xs:[&>svg]:w-3 xs:[&>svg]:h-3 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[8px] xs:text-[9px] sm:text-lg font-black text-slate-900 dark:text-white leading-[1.15] sm:leading-snug break-words whitespace-normal text-left">
                  {config.title}
                </h3>
                <p className="text-[6.5px] xs:text-[7.5px] sm:text-xs text-slate-500 dark:text-slate-400 leading-[1.15] break-words whitespace-normal text-left mt-0.5">
                  {config.subtitle}
                </p>
              </div>
            </div>

            <span className={`hidden sm:inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${colorStyles.badge} shrink-0`}>
              {config.enabled ? 'Active Plan' : 'Inactive'}
            </span>
          </div>

          {/* Large Progress Indicator */}
          <div className="bg-white dark:bg-slate-800/90 rounded-lg sm:rounded-2xl p-1.5 xs:p-2 sm:p-4 border border-slate-200/80 dark:border-slate-700 space-y-1 sm:space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-1 min-w-0">
              <div className="min-w-0">
                <p className="text-[7px] xs:text-[8px] sm:text-[10px] text-slate-400 uppercase font-black tracking-tight truncate">Progress</p>
                <p className="text-[11px] xs:text-xs sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 truncate">
                  {formattedCurrent}{' '}
                  <span className="text-[7.5px] xs:text-[8.5px] sm:text-xs font-bold text-slate-400">
                    {nextMilestone ? `/ ${formattedNextTarget}` : `(Max)`}
                  </span>
                </p>
              </div>
              <div className="min-w-0 sm:text-right">
                <p className="text-[7px] xs:text-[8px] sm:text-[10px] text-slate-400 uppercase font-bold truncate">Bonus</p>
                <p className={`text-[11px] xs:text-xs sm:text-lg font-black ${colorStyles.accentText} truncate`}>
                  ₹{totalBonusEarnedThisMonth}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-0.5 sm:space-y-1.5 min-w-0">
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 sm:h-3 rounded-full overflow-hidden p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${colorStyles.bar}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[7px] xs:text-[8px] sm:text-[11px] font-bold min-w-0 leading-tight">
                <span className="text-slate-500 truncate">{progressPercent}%</span>
                {nextMilestone && (
                  <span className={`${colorStyles.accentText} truncate ml-1`}>
                    +{formattedRemaining}
                  </span>
                )}
                {isMaxTierReached && (
                  <span className="text-emerald-500 font-extrabold flex items-center gap-0.5 truncate">
                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" /> Max
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Ladder */}
        <div className="p-1.5 xs:p-2 sm:p-6 space-y-1 sm:space-y-4 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <h4 className="text-[7.5px] xs:text-[8.5px] sm:text-xs font-black uppercase tracking-tight text-slate-400 truncate">
              Ladder
            </h4>
            <span className="text-[7px] xs:text-[8px] sm:text-[10px] text-slate-400 shrink-0">
              {completedMilestones.length}/{config.milestones.length}
            </span>
          </div>

          <div className="space-y-1 sm:space-y-2.5 min-w-0">
            {config.milestones.map((ms) => {
              const isCompleted = currentValue >= ms.target;
              const claimRecord = completedMilestones.find(c => c.milestone.id === ms.id)?.claimRecord;
              const isClaimed = claimRecord?.status === 'credited' || claimRecord?.status === 'paid';
              const isNext = nextMilestone?.id === ms.id;

              return (
                <div 
                  key={ms.id}
                  className={`p-1 xs:p-1.5 sm:p-3 rounded-md sm:rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-3 min-w-0 ${
                    isClaimed
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : isCompleted
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                      : isNext
                      ? 'bg-slate-50 dark:bg-slate-900 border-blue-300 dark:border-blue-700 ring-1 sm:ring-2 ring-blue-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-3 min-w-0 w-full sm:w-auto">
                    <div className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-8 sm:h-8 rounded sm:rounded-xl flex items-center justify-center font-black text-[7px] xs:text-[8px] sm:text-xs shrink-0 ${
                      isClaimed 
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                        ? 'bg-amber-500 text-white'
                        : isNext
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isClaimed ? <CheckCircle2 className="w-2.5 h-2.5 sm:w-4 sm:h-4" /> : `₹${ms.bonusAmount}`}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] xs:text-[9px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                        {isCurrency ? `₹${ms.target.toLocaleString()}` : `${ms.target} ${unit}`}
                      </p>
                      <p className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {ms.description || ms.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end">
                    {isClaimed ? (
                      <span className="text-[6.5px] xs:text-[7.5px] sm:text-[10px] font-black px-1 sm:px-2 py-0.5 rounded sm:rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 truncate">
                        Credited
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => onClaim(ms.id)}
                        disabled={claimingMilestone === ms.id}
                        className={`text-[7px] xs:text-[8px] sm:text-xs font-black px-1 sm:px-3 py-0.5 sm:py-1.5 rounded sm:rounded-xl ${colorStyles.btn} transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer shrink-0`}
                      >
                        {claimingMilestone === ms.id ? (
                          <RefreshCw className="w-2 h-2 sm:w-3.5 sm:h-3.5 animate-spin" />
                        ) : (
                          <Gift className="w-2 h-2 sm:w-3.5 sm:h-3.5" />
                        )}
                        <span>Claim</span>
                      </button>
                    ) : isNext ? (
                      <span className="text-[6.5px] xs:text-[7.5px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1 sm:px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 truncate">
                        Next
                      </span>
                    ) : (
                      <span className="text-[6.5px] xs:text-[7.5px] sm:text-[10px] font-bold text-slate-400 truncate">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Qualifying condition explanation */}
          <div className="pt-1 hidden sm:block">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{config.qualifyingCondition}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Qualifying Activity Toggle */}
      {qualifyingItems && qualifyingItems.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700/80 p-1 xs:p-1.5 sm:p-4 bg-slate-50/60 dark:bg-slate-900/40 min-w-0">
          <button
            onClick={onToggleExpand}
            className="w-full flex items-center justify-between text-[7px] xs:text-[8px] sm:text-xs font-black text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer min-w-0"
          >
            <span className="truncate">{qualifyingItems.length} Actions</span>
            {expanded ? <ChevronUp className="w-2.5 h-2.5 sm:w-4 sm:h-4 shrink-0" /> : <ChevronDown className="w-2.5 h-2.5 sm:w-4 sm:h-4 shrink-0" />}
          </button>

          {expanded && (
            <div className="mt-1 space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {qualifyingItems.map(item => (
                <div key={item.id} className="p-0.5 sm:p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[7px] sm:text-[11px] min-w-0">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                    <p className="text-[6.5px] text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-extrabold text-emerald-600 shrink-0">{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
