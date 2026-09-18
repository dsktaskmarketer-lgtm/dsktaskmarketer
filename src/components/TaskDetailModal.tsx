import React from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  Info,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { Task, TaskCategory } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  category?: TaskCategory;
  onClose: () => void;
  onStartTask: (task: Task) => void;
  onSubmitProof: (task: Task) => void;
  isStarted?: boolean;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  category,
  onClose,
  onStartTask,
  onSubmitProof,
  isStarted = false,
}) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="task-detail-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {category?.name || 'Task Details'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              Verified Partner
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {task.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Facilitated for: <strong className="text-slate-800">{task.partnerName}</strong>
            </p>
          </div>

          {/* Reward Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Qualifying Action Reward</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-emerald-950">₹{task.rewardAmount}</span>
                <span className="text-sm font-bold text-emerald-700">*</span>
                <span className="text-xs text-emerald-800 font-medium ml-2">credited upon audit verification</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onStartTask(task);
                }}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                Start Task Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mandatory Compliance Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Notice:</strong> Financial-product eligibility and approval are determined solely by the relevant financial institution/affiliate partner. DSK TaskMarketer does not guarantee approval, interest rates, or card issuance.
            </p>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Overview</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Eligibility */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Eligibility Criteria</h4>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{task.eligibility}</span>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Required Steps</h4>
            <ol className="space-y-2.5">
              {task.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-normal">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Proof Requirements */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Proof Requirements for Submission</h4>
            <ul className="space-y-2">
              {task.proofRequirements.map((proof, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                  <FileCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{proof}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms & Conditions */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Terms & Conditions</h4>
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
              {task.terms}
            </p>
          </div>

          {/* Affiliate Disclosure */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 leading-normal">
              <strong>Affiliate Disclosure:</strong> {task.affiliateDisclosure}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            *Reward subject to partner audit confirmation.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Close
            </button>
            {isStarted ? (
              <button
                onClick={() => {
                  onClose();
                  onSubmitProof(task);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                Submit Task Proof
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onStartTask(task);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                Start Task
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
