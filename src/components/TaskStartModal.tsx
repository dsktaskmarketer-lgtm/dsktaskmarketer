import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { Task } from '../types';
import { validateAndNormalizeUrl, openExternalUrl } from '../utils/urlHelper';

interface TaskStartModalProps {
  task: Task | null;
  startData?: { referenceId: string; affiliateUrl: string; instructions?: string; trackingUrl?: string } | null;
  trackingId?: string;
  onClose: () => void;
  onProceedToSubmit?: (task: Task) => void;
  onSubmitProof?: (task?: Task) => void;
}

export const TaskStartModal: React.FC<TaskStartModalProps> = ({
  task,
  startData,
  trackingId,
  onClose,
  onProceedToSubmit,
  onSubmitProof,
}) => {
  const [copied, setCopied] = useState(false);

  if (!task) return null;

  const referenceId = startData?.referenceId || trackingId || `DSK-TRK-${Math.floor(10000 + Math.random() * 90000)}`;
  const rawDestination = startData?.affiliateUrl || task.affiliateUrl || '';
  const urlCheck = validateAndNormalizeUrl(rawDestination);
  const finalDestinationUrl = urlCheck.valid ? urlCheck.url : '';
  const trackingRedirectUrl = startData?.trackingUrl || `/track/${encodeURIComponent(task.id)}?ref=${encodeURIComponent(referenceId)}`;

  const handleCopyRef = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(referenceId);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!urlCheck.valid || !finalDestinationUrl) {
      e.preventDefault();
      alert('The partner destination URL for this task is currently unconfigured or invalid.');
      return;
    }
    // Mobile safety: try openExternalUrl to ensure maximum compatibility
    openExternalUrl(finalDestinationUrl, '_blank');
  };

  const handleProceed = () => {
    onClose();
    if (onProceedToSubmit) {
      onProceedToSubmit(task);
    } else if (onSubmitProof) {
      onSubmitProof(task);
    }
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
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">Task Activity Initialized</h3>
          </div>
          <button 
            id="btn-close-task-start-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Ready for Official Partner Portal
            </span>
            <h4 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
              {task.title}
            </h4>
            <p className="text-slate-500 font-medium mt-0.5">
              Facilitated for: <strong className="text-slate-700">{task.partnerName}</strong>
            </p>
          </div>

          {/* Destination URL Status Warning if invalid */}
          {!urlCheck.valid && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-xs">Destination Link Issue:</span>
                <p className="text-[11px] leading-relaxed">
                  {urlCheck.error || 'The partner destination URL is missing or invalid. Please notify support.'}
                </p>
              </div>
            </div>
          )}

          {/* Tracking Reference Pill */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Your Task Tracking Reference
              </span>
              <span id="task-tracking-reference-id" className="font-mono font-bold text-sm text-slate-900">
                {referenceId}
              </span>
            </div>
            <button
              id="btn-copy-tracking-ref"
              onClick={handleCopyRef}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Instructions checklist */}
          <div className="space-y-2.5">
            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">How to complete this task:</h5>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                <span>Click <strong>Open Partner Portal</strong> below to continue via the verified partner portal.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                <span>Complete the application or action using your genuine details.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                <span>Save your <strong>Application / Account Reference ID</strong> and take a screenshot of the submission confirmation.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">4</span>
                <span>Return here and click <strong>Submit Proof</strong> to record your submission.</span>
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
              Never share or submit confidential credentials such as passwords, OTPs, ATM PINs, or CVV numbers. DSK TaskMarketer will never request upfront payment to unlock rewards.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {urlCheck.valid && finalDestinationUrl ? (
            <a
              id="btn-open-partner-portal"
              href={finalDestinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className="w-full sm:w-auto py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer no-underline"
            >
              <span>Open Partner Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              id="btn-open-partner-portal-disabled"
              disabled
              className="w-full sm:w-auto py-2.5 px-4 bg-slate-300 text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
              title={urlCheck.error || 'Destination URL is not configured'}
            >
              <span>Link Unavailable</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id="btn-proceed-to-submit-proof"
            onClick={handleProceed}
            className="w-full sm:w-auto py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>I Completed It, Submit Proof</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
