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

  // Dynamic Brand Color / Style based on partner name or category
  const getBrandBadge = () => {
    const p = (task.partnerName || '').toLowerCase();
    let bg = 'bg-blue-600 text-white';
    let label = task.partnerName?.slice(0, 2).toUpperCase() || 'TK';

    if (p.includes('kotak')) {
      bg = 'bg-red-600 text-white';
      label = '811';
    } else if (p.includes('upstox')) {
      bg = 'bg-purple-700 text-white';
      label = 'UP';
    } else if (p.includes('angel')) {
      bg = 'bg-blue-700 text-white';
      label = 'AO';
    } else if (p.includes('hdfc')) {
      bg = 'bg-blue-900 text-white';
      label = 'HD';
    } else if (p.includes('axis')) {
      bg = 'bg-rose-800 text-white';
      label = 'AX';
    } else if (p.includes('icici')) {
      bg = 'bg-amber-600 text-white';
      label = 'IC';
    } else if (p.includes('sbi')) {
      bg = 'bg-sky-600 text-white';
      label = 'SB';
    } else if (p.includes('groww')) {
      bg = 'bg-teal-600 text-white';
      label = 'GW';
    }

    return (
      <div className={`w-6 xs:w-7 sm:w-9 md:w-11 h-6 xs:h-7 sm:h-9 md:h-11 rounded-md xs:rounded-lg sm:rounded-2xl ${bg} flex items-center justify-center font-black text-[8px] xs:text-[9px] sm:text-xs md:text-sm shadow-xs shrink-0 tracking-wider`}>
        {label}
      </div>
    );
  };

  return (
    <div 
      id={`task-card-${task.id}`}
      onClick={() => onViewDetails(task)}
      className="bg-white dark:bg-slate-900 rounded-lg xs:rounded-xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-1.5 xs:p-2 sm:p-3.5 md:p-5 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-lg transition-all flex flex-col justify-between group h-full w-full cursor-pointer min-w-0"
    >
      <div className="space-y-1 xs:space-y-1.5 sm:space-y-3">
        
        {/* Top Row: Brand Icon on Left + "Up to ₹Amount" Pill on Right (Matches Reference Screen 2) */}
        <div className="flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0">
            {getBrandBadge()}
            <div className="min-w-0">
              <span className="text-[7px] xs:text-[8px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block truncate">
                {task.partnerName}
              </span>
              <span className="text-[6.5px] xs:text-[7.5px] sm:text-[11px] font-extrabold text-blue-600 dark:text-blue-400 block truncate leading-none">
                {category?.name || 'Task Offer'}
              </span>
            </div>
          </div>

          {/* Yellow/Amber Reward Pill */}
          <div className="bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/80 px-1 xs:px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-right shrink-0">
            <span className="text-[6.5px] xs:text-[8px] sm:text-xs font-black text-amber-950 dark:text-amber-300 whitespace-nowrap">
              Up to ₹{task.rewardAmount}
            </span>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="font-black text-slate-900 dark:text-white text-[8.5px] xs:text-[10px] sm:text-sm md:text-base leading-tight sm:leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 sm:line-clamp-2">
          {task.title}
        </h3>

        {/* Subtitle / Category metadata */}
        <p className="text-[7px] xs:text-[8px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
          {category?.name || 'Finance'} • <span className="text-slate-700 dark:text-slate-300 font-semibold">{task.eligibility?.includes('New') ? 'New Users' : 'Instant'}</span>
        </p>

        {/* Meta badges row: Duration + Requirement (Matches Reference Screen 2) */}
        <div className="flex flex-wrap items-center gap-0.5 xs:gap-1 sm:gap-2 pt-0.5">
          <div className="inline-flex items-center gap-0.5 sm:gap-1 px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-sm xs:rounded-md sm:rounded-lg bg-slate-100 dark:bg-slate-800 text-[6px] xs:text-[7.5px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <Clock className="w-2 xs:w-2.5 sm:w-3.5 h-2 xs:h-2.5 sm:h-3.5 text-slate-500 dark:text-slate-400" />
            <span>15-20m</span>
          </div>

          <div className="inline-flex items-center gap-0.5 sm:gap-1 px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-sm xs:rounded-md sm:rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-[6px] xs:text-[7.5px] sm:text-[11px] font-bold text-blue-700 dark:text-blue-300">
            <ShieldCheck className="w-2 xs:w-2.5 sm:w-3.5 h-2 xs:h-2.5 sm:h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Free</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[7px] xs:text-[8px] sm:text-xs text-slate-600 dark:text-slate-300 line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed">
          {task.description}
        </p>

      </div>

      {/* Action Buttons & Asterisk Footnote (Matches Reference Screen 2) */}
      <div className="mt-1.5 xs:mt-2 sm:mt-4 pt-1 xs:pt-1.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5 xs:space-y-1 sm:space-y-2">
        <div className="grid grid-cols-2 gap-0.5 xs:gap-1 sm:gap-2.5">
          <button
            id={`btn-view-details-${task.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(task);
            }}
            className="w-full py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-3 text-[6.5px] xs:text-[8px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md sm:rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-center truncate cursor-pointer"
          >
            {t('tasks.viewDetails', 'Details')}
          </button>

          {isStarted && onSubmitProof ? (
            <button
              id={`btn-submit-proof-${task.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSubmitProof(task);
              }}
              className="w-full py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-3 text-[6.5px] xs:text-[8px] sm:text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-md sm:rounded-xl shadow-xs transition-colors flex items-center justify-center gap-0.5 xs:gap-1 truncate cursor-pointer"
            >
              {t('tasks.submitProof', 'Proof')}
            </button>
          ) : (
            <button
              id={`btn-start-task-${task.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onStartTask(task);
              }}
              className="w-full py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-3 text-[6.5px] xs:text-[8px] sm:text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-md sm:rounded-xl shadow-xs shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-0.5 xs:gap-1 truncate cursor-pointer"
            >
              <span>{t('tasks.startTask', 'Start')}</span>
              <ArrowRight className="w-2 xs:w-2.5 sm:w-3.5 h-2 xs:h-2.5 sm:h-3.5 shrink-0" />
            </button>
          )}
        </div>

        <p className="text-[6px] xs:text-[7px] sm:text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight truncate">
          {t('tasks.rewardSubjectNotice', '*Reward terms apply')}
        </p>
      </div>
    </div>
  );
};
