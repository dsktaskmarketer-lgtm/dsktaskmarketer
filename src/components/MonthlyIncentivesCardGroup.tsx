import React, { useEffect, useState } from 'react';
import { 
  Award, 
  Users, 
  CheckSquare, 
  TrendingUp, 
  ChevronRight, 
  Sparkles, 
  Gift, 
  ArrowRight,
  Crown
} from 'lucide-react';
import { UserIncentivesOverview, UserMonthlyPlanProgress } from '../types';
import { fetchUserIncentives } from '../services/api';
import duoBannerImg from '../assets/images/dsk_duo_banner_1790060259488.jpg';

interface MonthlyIncentivesCardGroupProps {
  userId?: string;
  onNavigate: (view: string) => void;
  showBannerHeader?: boolean;
  className?: string;
}

export const MonthlyIncentivesCardGroup: React.FC<MonthlyIncentivesCardGroupProps> = ({
  userId,
  onNavigate,
  showBannerHeader = true,
  className = ''
}) => {
  const [overview, setOverview] = useState<UserIncentivesOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    if (!userId) {
      setOverview(null);
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const data = await fetchUserIncentives(undefined, userId);
        if (isMounted && data) {
          setOverview(data);
        }
      } catch (err) {
        // Silently handle widget preview
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [userId]);

  const referralPlan = overview?.plans?.referral;
  const taskPlan = overview?.plans?.tasks;
  const earningPlan = overview?.plans?.earnings;

  // Real progress metrics from UserMonthlyPlanProgress
  const refProgress = referralPlan?.currentValue ?? 0;
  const refTarget = referralPlan?.nextMilestone?.target ?? 10;
  const refRemaining = referralPlan?.remainingForNext ?? Math.max(0, refTarget - refProgress);
  const refBonus = referralPlan?.nextMilestone?.bonusAmount ?? 150;
  const refPercent = referralPlan?.progressPercent ?? Math.min(100, Math.round((refProgress / Math.max(1, refTarget)) * 100));

  const taskProgress = taskPlan?.currentValue ?? 0;
  const taskTarget = taskPlan?.nextMilestone?.target ?? 20;
  const taskRemaining = taskPlan?.remainingForNext ?? Math.max(0, taskTarget - taskProgress);
  const taskBonus = taskPlan?.nextMilestone?.bonusAmount ?? 200;
  const taskPercent = taskPlan?.progressPercent ?? Math.min(100, Math.round((taskProgress / Math.max(1, taskTarget)) * 100));

  const earnProgress = earningPlan?.currentValue ?? 0;
  const earnTarget = earningPlan?.nextMilestone?.target ?? 2500;
  const earnRemaining = earningPlan?.remainingForNext ?? Math.max(0, earnTarget - earnProgress);
  const earnBonus = earningPlan?.nextMilestone?.bonusAmount ?? 200;
  const earnPercent = earningPlan?.progressPercent ?? Math.min(100, Math.round((earnProgress / Math.max(1, earnTarget)) * 100));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. TOP HERO BANNER (Matches Reference Image) */}
      {showBannerHeader && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/20 border border-blue-400/30">
          {/* Background Sparks & Glow */}
          <div className="absolute top-0 right-1/3 w-64 h-64 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[140px] sm:min-h-[160px] p-5 sm:p-7 relative z-10">
            {/* Left Content */}
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <Crown className="w-5 h-5 text-slate-950 fill-slate-950/20" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Your Monthly Incentives
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 font-medium max-w-md">
                Complete your goals and unlock extra cash rewards this month!
              </p>
            </div>

            {/* Right Action & Character Duo Preview */}
            <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-4 mt-3 md:mt-0">
              <button
                onClick={() => onNavigate('incentives')}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs sm:text-sm font-black rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Character Duo Image Strip on Right */}
          <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none overflow-hidden opacity-90">
            <img
              src={duoBannerImg}
              alt="DSK Anime Duo Characters"
              className="w-full h-full object-cover object-right"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-blue-600 to-transparent" />
          </div>
        </div>
      )}

      {/* 2. THREE INCENTIVE PLAN CARDS (Matches Reference Image) */}
      <div className="grid grid-cols-3 gap-1 xs:gap-1.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
        
        {/* CARD 1: Referral Target */}
        <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl p-1.5 xs:p-2.5 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group min-w-0">
          <div>
            <div className="flex items-center gap-1 sm:gap-3 mb-1 sm:mb-3 min-w-0">
              <div className="w-5 xs:w-6 sm:w-10 h-5 xs:h-6 sm:h-10 rounded-md sm:rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs shrink-0">
                <Users className="w-2.5 xs:w-3 sm:w-5 h-2.5 xs:h-3 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-[9px] xs:text-[10px] sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  Referral Target
                </h4>
                <p className="text-[7px] xs:text-[8px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Invite new users
                </p>
              </div>
            </div>

            {/* Dynamic Progress for Authenticated Users OR Tier Overview for Public Visitors */}
            {userId ? (
              <div className="space-y-0.5 sm:space-y-1.5 my-1 sm:my-3">
                <div className="flex items-baseline justify-between gap-0.5">
                  <span className="text-xs xs:text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                    {refProgress} <span className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-slate-400">/ {refTarget}</span>
                  </span>
                  <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {refRemaining > 0 ? `${refRemaining} more` : 'Achieved! 🎉'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 sm:h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${refPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-0.5 sm:space-y-1.5 my-1 sm:my-3 bg-slate-50 dark:bg-slate-800/50 p-1 sm:p-2.5 rounded-md sm:rounded-xl border border-slate-100 dark:border-slate-800 text-[8px] sm:text-xs">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>10 Ref</span>
                  <span className="text-amber-600 font-extrabold">+₹150</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>25 Ref</span>
                  <span className="text-amber-600 font-extrabold">+₹400</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>50 Ref</span>
                  <span className="text-amber-600 font-extrabold">+₹1,000</span>
                </div>
              </div>
            )}
          </div>

          {/* Next Milestone Bonus / Max Bonus */}
          <div className="pt-1 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between min-w-0">
            <span className="text-[7px] xs:text-[8px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              {userId ? 'Bonus:' : 'Max:'}
            </span>
            <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[7.5px] xs:text-[8.5px] sm:text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1 sm:px-2.5 py-0.5 rounded sm:rounded-lg border border-amber-200/60 dark:border-amber-900/40 truncate">
              <Gift className="w-2 xs:w-2.5 sm:w-3.5 h-2 xs:h-2.5 sm:h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{userId ? `₹${refBonus}` : '₹1,000'}</span>
            </span>
          </div>
        </div>

        {/* CARD 2: Task Completion */}
        <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl p-1.5 xs:p-2.5 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group min-w-0">
          <div>
            <div className="flex items-center gap-1 sm:gap-3 mb-1 sm:mb-3 min-w-0">
              <div className="w-5 xs:w-6 sm:w-10 h-5 xs:h-6 sm:h-10 rounded-md sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs shrink-0">
                <CheckSquare className="w-2.5 xs:w-3 sm:w-5 h-2.5 xs:h-3 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-[9px] xs:text-[10px] sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  Task Completion
                </h4>
                <p className="text-[7px] xs:text-[8px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Complete tasks
                </p>
              </div>
            </div>

            {/* Dynamic Progress for Authenticated Users OR Tier Overview for Public Visitors */}
            {userId ? (
              <div className="space-y-0.5 sm:space-y-1.5 my-1 sm:my-3">
                <div className="flex items-baseline justify-between gap-0.5">
                  <span className="text-xs xs:text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                    {taskProgress} <span className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-slate-400">/ {taskTarget}</span>
                  </span>
                  <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {taskRemaining > 0 ? `${taskRemaining} more` : 'Achieved! 🎉'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 sm:h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${taskPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-0.5 sm:space-y-1.5 my-1 sm:my-3 bg-slate-50 dark:bg-slate-800/50 p-1 sm:p-2.5 rounded-md sm:rounded-xl border border-slate-100 dark:border-slate-800 text-[8px] sm:text-xs">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>20 Tasks</span>
                  <span className="text-emerald-600 font-extrabold">+₹200</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>50 Tasks</span>
                  <span className="text-emerald-600 font-extrabold">+₹600</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>100 Tasks</span>
                  <span className="text-emerald-600 font-extrabold">+₹1,500</span>
                </div>
              </div>
            )}
          </div>

          {/* Next Milestone Bonus / Max Bonus */}
          <div className="pt-1 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between min-w-0">
            <span className="text-[7px] xs:text-[8px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              {userId ? 'Bonus:' : 'Max:'}
            </span>
            <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[7.5px] xs:text-[8.5px] sm:text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1 sm:px-2.5 py-0.5 rounded sm:rounded-lg border border-amber-200/60 dark:border-amber-900/40 truncate">
              <Gift className="w-2 xs:w-2.5 sm:w-3.5 h-2 xs:h-2.5 sm:h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{userId ? `₹${taskBonus}` : '₹1,500'}</span>
            </span>
          </div>
        </div>

        {/* CARD 3: Earning Milestone */}
        <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl p-1.5 xs:p-2.5 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group min-w-0">
          <div>
            <div className="flex items-center gap-1 sm:gap-3 mb-1 sm:mb-3 min-w-0">
              <div className="w-5 xs:w-6 sm:w-10 h-5 xs:h-6 sm:h-10 rounded-md sm:rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs shrink-0">
                <TrendingUp className="w-2.5 xs:w-3 sm:w-5 h-2.5 xs:h-3 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-[9px] xs:text-[10px] sm:text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                  Earning Milestone
                </h4>
                <p className="text-[7px] xs:text-[8px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Reach earning goals
                </p>
              </div>
            </div>

            {/* Dynamic Progress for Authenticated Users OR Tier Overview for Public Visitors */}
            {userId ? (
              <div className="space-y-0.5 sm:space-y-1.5 my-1 sm:my-3">
                <div className="flex items-baseline justify-between gap-0.5">
                  <span className="text-xs xs:text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                    ₹{earnProgress.toLocaleString('en-IN')} <span className="text-[8px] xs:text-[9px] sm:text-xs font-bold text-slate-400">/ ₹{earnTarget.toLocaleString('en-IN')}</span>
                  </span>
                  <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {earnRemaining > 0 ? `₹${earnRemaining.toLocaleString('en-IN')} left` : 'Achieved! 🎉'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 sm:h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${earnPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-0.5 sm:space-y-1.5 my-1 sm:my-3 bg-slate-50 dark:bg-slate-800/50 p-1 sm:p-2.5 rounded-md sm:rounded-xl border border-slate-100 dark:border-slate-800 text-[8px] sm:text-xs">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>₹2.5k</span>
                  <span className="text-purple-600 font-extrabold">+₹200</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>₹5k</span>
                  <span className="text-purple-600 font-extrabold">+₹500</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>₹10k</span>
                  <span className="text-purple-600 font-extrabold">+₹1.2k</span>
                </div>
              </div>
            )}
          </div>

          {/* Next Milestone Bonus / Max Bonus */}
          <div className="pt-1 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between min-w-0">
            <span className="text-[7px] xs:text-[8px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              {userId ? 'Bonus:' : 'Max:'}
            </span>
            <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[7.5px] xs:text-[8.5px] sm:text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1 sm:px-2.5 py-0.5 rounded sm:rounded-lg border border-amber-200/60 dark:border-amber-900/40 truncate">
              <Gift className="w-2 xs:w-2.5 sm:w-3.5 h-2 xs:h-2.5 sm:h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{userId ? `₹${earnBonus}` : '₹1,200'}</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
