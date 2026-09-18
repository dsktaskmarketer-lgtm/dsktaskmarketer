import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Share2, 
  Copy, 
  Check, 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  Users, 
  Info, 
  Sparkles,
  ArrowRight,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Task, TaskCategory, User } from '../types';
import { getPublicTaskUrl, shareOrCopy, copyToClipboard } from '../utils/shareHelper';
import { useToast } from '../context/ToastContext';

interface PublicTaskPageViewProps {
  taskId: string;
  tasks: Task[];
  categories: TaskCategory[];
  user: User | null;
  onNavigate: (view: string, id?: string) => void;
  onStartTask: (task: Task) => void;
  onSubmitProof: (task: Task) => void;
}

export const PublicTaskPageView: React.FC<PublicTaskPageViewProps> = ({
  taskId,
  tasks,
  categories,
  user,
  onNavigate,
  onStartTask,
  onSubmitProof,
}) => {
  const { showToast } = useToast();
  const [linkCopied, setLinkCopied] = useState(false);

  const task = tasks.find(t => t.id === taskId);
  const category = categories.find(c => c.id === task?.categoryId);
  const publicUrl = getPublicTaskUrl(taskId);

  const handleShare = async () => {
    if (!task) return;
    await shareOrCopy(
      {
        title: `${task.title} - Earn ₹${task.rewardAmount}`,
        text: `Complete verified task "${task.title}" on DSK TaskMarketer and earn ₹${task.rewardAmount} reward:`,
        url: publicUrl
      },
      (msg, type) => showToast(msg, type)
    );
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      setLinkCopied(true);
      showToast('Task link copied to clipboard', 'success');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // If task is not found (e.g. invalid ID or still loading)
  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Task Offer Not Found
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            The requested task offer may have expired, reached its completion quota, or been moved.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate('available-tasks')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse All Available Tasks</span>
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-sm rounded-xl transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Breadcrumbs & Share Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => onNavigate('available-tasks')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group self-start"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Explore All Tasks</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Copy link"
          >
            {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{linkCopied ? 'Copied' : 'Copy Link'}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Share this task offer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Offer</span>
          </button>
        </div>
      </div>

      {/* Task Header & Identity */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            {category?.name || 'Financial Partner Offer'}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Verified Financial Affiliate
          </span>
          {task.completionsCount !== undefined && task.completionsCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {task.completionsCount} Verified Completions
            </span>
          )}
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {task.title}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300">
            Partner Institution: <strong className="text-slate-900 dark:text-white font-bold">{task.partnerName}</strong>
          </p>
        </div>
      </div>

      {/* Primary Action Hero Card (Reward & Actions) */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-48 h-48 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-emerald-100 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Verified Performance Reward
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                ₹{task.rewardAmount}
              </span>
              <span className="text-lg font-bold text-emerald-200">*</span>
              <span className="text-xs sm:text-sm text-emerald-100 font-medium ml-1">
                credited upon affiliate reconciliation audit
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed pt-1">
              Complete the required qualifying application steps through the official partner link below, save your Application Reference ID, and submit proof.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => onStartTask(task)}
              className="px-6 py-3.5 bg-white hover:bg-emerald-50 text-slate-950 font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Start Task Now</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-emerald-700" />
            </button>

            <button
              onClick={() => {
                if (!user) {
                  onNavigate('login');
                } else {
                  onSubmitProof(task);
                }
              }}
              className="px-6 py-3.5 bg-white/15 hover:bg-white/25 text-white font-bold text-sm rounded-2xl border border-white/30 backdrop-blur-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-emerald-200" />
              <span>Submit Proof / Claim Reward</span>
            </button>
          </div>
        </div>

        {!user && (
          <div className="mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-100">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <span>New to DSK TaskMarketer? Sign up in 30 seconds to track submissions and receive direct payouts.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('login')}
                className="underline hover:text-white font-bold"
              >
                Sign In
              </button>
              <span>•</span>
              <button
                onClick={() => onNavigate('register')}
                className="underline hover:text-white font-bold"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Advisory Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <Info className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Important Financial Product Notice:</strong> Approvals, credit limits, interest rates, and loan terms are determined solely by {task.partnerName} in accordance with applicable RBI / SEBI / financial regulations. DSK TaskMarketer does not guarantee approval. Reward payment is contingent on partner affiliate verification.
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Detailed Steps, Overview, Proof, Eligibility */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Overview Section */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              Task Overview & Benefits
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Required Steps (Numbered Walkthrough) */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Required Action Steps
              </h2>
              <span className="text-xs text-slate-400 font-semibold">
                {task.steps?.length || 0} Steps
              </span>
            </div>

            <ol className="space-y-3.5">
              {task.steps && task.steps.length > 0 ? (
                task.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200">
                    <span className="w-6 h-6 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{step}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">Follow the partner instructions on the official link.</li>
              )}
            </ol>
          </div>

          {/* Proof Requirements for Audit */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              Submission Proof Requirements
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When claiming your reward, provide the following details so our verification system can cross-check with partner reports:
            </p>

            <ul className="space-y-3">
              {task.proofRequirements && task.proofRequirements.length > 0 ? (
                task.proofRequirements.map((proof, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-sm text-slate-800 dark:text-slate-200">
                    <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{proof}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">Provide official Application Reference Number or screenshot proof.</li>
              )}
            </ul>
          </div>

          {/* Terms & Conditions */}
          {task.terms && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                Offer Terms & Partner Reconciliation
              </h3>
              <p className="leading-relaxed">
                {task.terms}
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Eligibility, Quick Summary, Support */}
        <div className="space-y-6">
          
          {/* Eligibility Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Eligibility Criteria
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {task.eligibility || 'Open to Indian citizens meeting partner income, age, and documentation criteria.'}
            </div>
          </div>

          {/* Security & Safe Practices */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Consumer Safety Notice
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Never share your NetBanking password, OTP, ATM PIN, or UPI MPIN.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>All applications happen exclusively on official partner secure HTTPS domains.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>DSK TaskMarketer never charges any fee to apply or receive rewards.</span>
              </li>
            </ul>
          </div>

          {/* Other Popular Tasks Quick Links */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
              <span>Other Verified Tasks</span>
              <button 
                onClick={() => onNavigate('available-tasks')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline capitalize"
              >
                View All
              </button>
            </h3>

            <div className="space-y-2.5">
              {tasks.filter(t => t.id !== task.id).slice(0, 3).map(other => (
                <div
                  key={other.id}
                  onClick={() => onNavigate('task-detail', other.id)}
                  className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {other.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {other.partnerName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                      ₹{other.rewardAmount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
