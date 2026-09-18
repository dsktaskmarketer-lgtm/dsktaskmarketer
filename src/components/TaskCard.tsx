import React from 'react';
import { 
  CreditCard, 
  Landmark, 
  Banknote, 
  ShieldCheck, 
  TrendingUp, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Task, TaskCategory } from '../types';
import { useTranslation } from '../locales';

interface TaskCardProps {
  task: Task;
  category?: TaskCategory;
  onViewDetails: (task: Task) => void;
  onStartTask: (task: Task) => void;
  onSubmitProof?: (task: Task) => void;
  isStarted?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  onViewDetails,
  onStartTask,
  onSubmitProof,
  isStarted = false,
}) => {
  const { t } = useTranslation();

  const getCategoryIcon = (slug?: string) => {
    switch (slug) {
      case 'credit-cards': return <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      case 'banking': return <Landmark className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-600 dark:text-blue-400 shrink-0" />;
      case 'loans': return <Banknote className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'insurance': return <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'demat-investment': return <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-purple-600 dark:text-purple-400 shrink-0" />;
      case 'financial-apps': return <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-teal-600 dark:text-teal-400 shrink-0" />;
      default: return <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-slate-600 dark:text-slate-400 shrink-0" />;
    }
  };

  return (
    <div 
      id={`task-card-${task.id}`}
      className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-4 md:p-5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between group h-full w-full"
    >
      <div>
        {/* Category & Status Bar */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3 min-h-[22px] sm:min-h-[28px]">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0 max-w-[70%] truncate">
            {getCategoryIcon(category?.slug)}
            <span className="truncate">{category?.name || t('tasks.financialTask', 'Financial Task')}</span>
          </span>

          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-1 sm:px-1.5 md:px-2 py-0.5 rounded shrink-0 whitespace-nowrap">
            {t('common.verified', 'Verified Offer')}
          </span>
        </div>

        {/* Task Title */}
        <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-base leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
          {task.title}
        </h3>

        {/* Partner Name */}
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 sm:mt-1 truncate">
          {t('tasks.provider', 'Provider')}: <span className="text-slate-700 dark:text-slate-200 font-semibold">{task.partnerName}</span>
        </p>

        {/* Reward Box */}
        <div className="mt-2 sm:mt-3.5 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 flex items-baseline justify-between gap-1">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-400 block whitespace-nowrap leading-tight">
              {t('tasks.verifiedReward', 'Verified Reward')}
            </span>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className="text-base sm:text-xl md:text-2xl font-black text-emerald-900 dark:text-emerald-300">
                ₹{task.rewardAmount}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400">*</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[8px] sm:text-[9px] md:text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium whitespace-nowrap leading-tight">
              {t('tasks.afterVerification', 'After verification')}
            </span>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
              {task.completionsCount} {t('tasks.completedCount', 'completed')}
            </span>
          </div>
        </div>

        {/* Description / Application Details */}
        <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 mt-2 sm:mt-3 line-clamp-2 leading-relaxed min-h-[1.75rem] sm:min-h-[2.5rem]">
          {task.description}
        </p>

        {/* Eligibility Snippet */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400">
          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span className="line-clamp-1">
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">{t('tasks.eligibility', 'Eligibility')}:</strong> {task.eligibility}
          </span>
        </div>
      </div>

      {/* Action Buttons & Asterisk Footnote */}
      <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 sm:space-y-2">
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            id={`btn-view-details-${task.id}`}
            onClick={() => onViewDetails(task)}
            className="w-full py-1.5 sm:py-2 px-1 sm:px-2.5 md:px-3 text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-center truncate"
          >
            {t('tasks.viewDetails', 'View Details')}
          </button>

          {isStarted && onSubmitProof ? (
            <button
              id={`btn-submit-proof-${task.id}`}
              onClick={() => onSubmitProof(task)}
              className="w-full py-1.5 sm:py-2 px-1 sm:px-2.5 md:px-3 text-[10px] sm:text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg sm:rounded-xl shadow-xs transition-colors flex items-center justify-center gap-0.5 sm:gap-1 truncate"
            >
              {t('tasks.submitProof', 'Submit Proof')}
            </button>
          ) : (
            <button
              id={`btn-start-task-${task.id}`}
              onClick={() => onStartTask(task)}
              className="w-full py-1.5 sm:py-2 px-1 sm:px-2.5 md:px-3 text-[10px] sm:text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg sm:rounded-xl shadow-xs transition-colors flex items-center justify-center gap-0.5 sm:gap-1 truncate"
            >
              <span>{t('tasks.startTask', 'Start Task')}</span>
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 shrink-0" />
            </button>
          )}
        </div>

        <p className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight">
          {t('tasks.rewardSubjectNotice', '*Reward is subject to applicable partner terms and successful verification.')}
        </p>
      </div>
    </div>
  );
};
