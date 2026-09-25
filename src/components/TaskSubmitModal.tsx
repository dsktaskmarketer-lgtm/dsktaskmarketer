import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  ShieldAlert, 
  FileText, 
  CheckCircle, 
  Image as ImageIcon,
  AlertCircle,
  Calendar,
  Lock
} from 'lucide-react';
import { Task } from '../types';
import { TaskCompleteIllustration } from './illustrations';

interface TaskSubmitModalProps {
  task: Task | null;
  onClose: () => void;
  onSubmit: (data: {
    taskId: string;
    completedDate: string;
    proofApplicationId?: string;
    screenshotUrl?: string;
    userNote?: string;
  }) => Promise<void>;
}

export const TaskSubmitModal: React.FC<TaskSubmitModalProps> = ({
  task,
  onClose,
  onSubmit,
}) => {
  const [applicationId, setApplicationId] = useState('');
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!task) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setScreenshotPreview(result);
        setScreenshotUrl(result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId.trim()) {
      setError("Please provide the Application Reference ID / Confirmation Number");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        taskId: task.id,
        completedDate,
        proofApplicationId: applicationId.trim(),
        screenshotUrl: screenshotUrl || screenshotPreview || undefined,
        userNote: userNote.trim() || undefined
      });
      setSubmittedSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit task proof");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div 
          id="task-submit-success-modal"
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-200 flex flex-col items-center space-y-4"
        >
          <TaskCompleteIllustration size="md" />
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Proof Received
            </span>
            <h3 className="text-xl font-black text-slate-900 pt-1">Verification in Progress</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Your proof for <strong className="text-slate-800">{task.title}</strong> has been queued for verification.
            </p>
          </div>

          <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900">Estimated Reward:</span>
            <span className="font-black text-base text-amber-950">₹{task.rewardAmount}*</span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Done & View Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="task-submit-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Submit Task Proof</h3>
            <p className="text-xs text-slate-500 font-medium">Verify your qualifying action for rewards</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Auto Locked Task Info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target Task</span>
              <span className="text-[10px] font-mono text-slate-400">ID: {task.id}</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{task.title}</p>
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-600 font-medium">Partner: {task.partnerName}</span>
              <span className="text-amber-900 font-bold bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded">Reward: ₹{task.rewardAmount}*</span>
            </div>
          </div>

          {/* Compliance & Anti-Fraud Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Zero-Sensitive-Data Rule</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              NEVER submit passwords, OTPs, PINs, or CVV. Legitimate proof includes only the application reference number or submission confirmation screen.
            </p>
          </div>

          {/* Application Reference ID */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Application Reference / Confirmation ID <span className="text-rose-600">*</span>
            </label>
            <input
              id="input-proof-app-id"
              type="text"
              required
              value={applicationId || ''}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="e.g. AXIS-2026-9921 or UCC-77123"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The reference number issued by the partner on the final screen or via SMS.
            </p>
          </div>

          {/* Date of Completion */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Date of Action Completion
            </label>
            <input
              id="input-proof-date"
              type="date"
              value={completedDate || ''}
              onChange={(e) => setCompletedDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-800"
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Proof Screenshot (Confirmation Screen)
            </label>

            {screenshotPreview ? (
              <div className="relative rounded-xl border border-slate-200 p-2 bg-slate-50">
                <img
                  src={screenshotPreview}
                  alt="Proof preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setScreenshotPreview(null);
                    setScreenshotUrl('');
                  }}
                  className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md font-bold cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition-colors">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <span className="font-bold text-slate-700">Click to upload screenshot</span>
                <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, or WEBP (Max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* User Note */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Optional Note for Verifier
            </label>
            <textarea
              id="input-proof-note"
              rows={2}
              value={userNote || ''}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="e.g. Video KYC completed successfully on Feb 28. SMS confirmation received."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-800"
            />
          </div>

          {/* Terms footnote */}
          <div className="pt-2 text-[11px] text-slate-400 leading-normal border-t border-slate-100">
            Submitting proof places your task in <strong>Pending Review</strong>. Partner networks verify qualifying conversions during scheduled audit cycles.
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-task-form"
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting Proof...' : 'Submit For Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
