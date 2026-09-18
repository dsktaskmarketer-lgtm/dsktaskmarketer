import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { Task } from '../types';

interface TaskStartModalProps {
  task: Task | null;
  startData: { referenceId: string; affiliateUrl: string; instructions: string } | null;
  onClose: () => void;
  onProceedToSubmit: (task: Task) => void;
}

export const TaskStartModal: React.FC<TaskStartModalProps> = ({
  task,
  startData,
  onClose,
  onProceedToSubmit,
}) => {
  const [copied, setCopied] = useState(false);

  if (!task || !startData) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(startData.referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPartnerLink = () => {
    window.open(startData.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="task-start-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Task Activity Initialized</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Ready for Partner Portal
            </span>
            <h4 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
              {task.title}
            </h4>
            <p className="text-slate-500 font-medium mt-0.5">
              Provider: {task.partnerName}
            </p>
          </div>

          {/* Tracking Reference Pill */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Your Task Tracking Reference
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {startData.referenceId}
              </span>
            </div>
            <button
              onClick={handleCopyRef}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Instructions checklist */}
          <div className="space-y-2.5">
            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">How to complete this task:</h5>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                <span>Click <strong>Open Partner Portal</strong> below to continue via approved partner link.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                <span>Complete the full application using your authentic details.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                <span>Save your <strong>Application ID</strong> and capture a screenshot of the submission confirmation screen.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">4</span>
                <span>Return here and click <strong>Submit Proof</strong>.</span>
              </div>
            </div>
          </div>

          {/* Security Compliance Box */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Strict Security & Anti-Fraud Policy</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-800">
              Never share or submit confidential information such as passwords, OTPs, ATM PINs, or CVV. We will never ask for payment to release rewards.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            onClick={handleOpenPartnerLink}
            className="w-full sm:w-auto py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Open Partner Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              onClose();
              onProceedToSubmit(task);
            }}
            className="w-full sm:w-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>I Completed It, Submit Proof</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
