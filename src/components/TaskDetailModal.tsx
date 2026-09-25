import React from 'react';
import { 
  X, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Layers,
  FileCheck,
  Gift,
  Share2,
  ExternalLink,
  Sparkles,
  Users
} from 'lucide-react';
import { Task, TaskCategory, PlatformSettings, User } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  category?: TaskCategory;
  settings?: PlatformSettings;
  currentUser?: User | null;
  onClose: () => void;
  onStartTask: (task: Task) => void;
  onSubmitProof: (task: Task) => void;
  isStarted?: boolean;
  isLoggedIn?: boolean;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  category,
  settings,
  currentUser,
  onClose,
  onStartTask,
  onSubmitProof,
  isStarted = false,
  isLoggedIn = false,
}) => {
  if (!task) return null;

  const referralBonus = settings?.referralBonus || 50;

  const handleShareTask = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: task.title,
        text: `Complete "${task.title}" on ${settings?.platformName || 'DSK TaskMarketer'} and earn ₹${task.rewardAmount}!`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Task link copied to clipboard!');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id={`task-detail-popup-${task.id}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Mobile Pull/Grab Bar Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 truncate">
              {category?.name || 'Task Offer'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 px-2 py-0.5 rounded shrink-0">
              Verified Partner
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareTask}
              title="Share task"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              title="Close modal"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-700 dark:text-slate-300 overscroll-contain">
          {/* Title & Partner */}
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Provider: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{task.partnerName}</strong></span>
              <span>•</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{task.completionsCount || 0} completed</span>
            </div>
          </div>

          {/* Reward & Earning Box - Yellow for rewards/earnings */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                Verified Action Reward
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-200">
                  ₹{task.rewardAmount}
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  credited directly upon verification audit
                </span>
              </div>
            </div>

            <div className="shrink-0">
              {isStarted ? (
                <button
                  onClick={() => {
                    onClose();
                    onSubmitProof(task);
                  }}
                  className="w-full sm:w-auto py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Submit Task Proof</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onStartTask(task);
                  }}
                  className="w-full sm:w-auto py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Start Task</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Referral / Earning Booster Box (Dynamic from DB / Settings) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Gift className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 dark:text-amber-200">Referral & Team Earnings</span>
                <span className="font-black text-amber-700 dark:text-amber-400">Bonus: ₹{referralBonus}</span>
              </div>
              <p className="text-amber-900/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                Invite friends with your referral link! When they complete qualifying tasks, you earn an instant ₹{referralBonus} referral bonus in your wallet.
              </p>
            </div>
          </div>

          {/* Compliance Disclaimer Banner */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Notice:</strong> Product approval is determined solely by the partner financial institution. DSK TaskMarketer does not guarantee approval, interest rates, or card issuance.
            </p>
          </div>

          {/* Overview / Description */}
          {task.description && (
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1.5">
                Task Overview
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {task.description}
              </p>
            </div>
          )}

          {/* Eligibility Criteria */}
          {task.eligibility && (
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1.5">
                Eligibility Criteria
              </h4>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>{task.eligibility}</span>
              </div>
            </div>
          )}

          {/* Required Steps / Instructions */}
          {Array.isArray(task.steps) && task.steps.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Step-by-Step Instructions</span>
              </h4>
              <ol className="space-y-2">
                {task.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-normal flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Proof Requirements */}
          {Array.isArray(task.proofRequirements) && task.proofRequirements.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Proof Requirements for Audit</span>
              </h4>
              <ul className="space-y-2">
                {task.proofRequirements.map((proof, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span className="flex-1">{proof}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Terms & Conditions */}
          {task.terms && (
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1.5">
                Terms & Conditions
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 leading-relaxed">
                {task.terms}
              </p>
            </div>
          )}

          {/* Affiliate Disclosure */}
          {task.affiliateDisclosure && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                <strong>Affiliate Disclosure:</strong> {task.affiliateDisclosure}
              </p>
            </div>
          )}
        </div>

        {/* Sticky Footer Bar */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {isStarted ? (
              <button
                onClick={() => {
                  onClose();
                  onSubmitProof(task);
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit Task Proof</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onStartTask(task);
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Start Task (₹{task.rewardAmount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
