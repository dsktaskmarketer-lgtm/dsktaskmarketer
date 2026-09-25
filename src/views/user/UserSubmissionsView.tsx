import React, { useState } from 'react';
import { 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  Eye, 
  Plus, 
  Search,
  ShieldCheck,
  X
} from 'lucide-react';
import { TaskSubmission, Task } from '../../types';

interface UserSubmissionsViewProps {
  submissions: TaskSubmission[];
  tasks: Task[];
  onOpenSubmitModal: () => void;
}

export const UserSubmissionsView: React.FC<UserSubmissionsViewProps> = ({
  submissions,
  tasks,
  onOpenSubmitModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewingProof, setViewingProof] = useState<TaskSubmission | null>(null);

  const filtered = submissions.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'under_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Under Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="w-full px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-block mb-1 border border-blue-200">
            Verification Records
          </span>
          <h1 className="text-2xl font-black text-slate-900">My Submissions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed tracking of all your submitted task proofs and partner audit updates.
          </p>
        </div>

        <button
          onClick={onOpenSubmitModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md shadow-red-600/25 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Task Proof</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending_review')}
          className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition-colors cursor-pointer ${
            filterStatus === 'pending_review'
              ? 'bg-yellow-400 text-slate-950 shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Review ({submissions.filter(s => s.status === 'pending_review').length})
        </button>
        <button
          onClick={() => setFilterStatus('under_verification')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterStatus === 'under_verification'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Under Verification ({submissions.filter(s => s.status === 'under_verification').length})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterStatus === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Approved ({submissions.filter(s => s.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterStatus === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Rejected ({submissions.filter(s => s.status === 'rejected').length})
        </button>
      </div>

      {/* Submissions Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No submissions match this filter</p>
            <p>Start a task and submit your application reference to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3.5 px-6">Task & Provider</th>
                  <th className="py-3.5 px-4">Application Ref ID</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Reward Amount</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-4">Audit / Partner Note</th>
                  <th className="py-3.5 px-6 text-right">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{sub.taskTitle}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">Submission ID: {sub.id}</p>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-700 text-xs">
                      {sub.proofApplicationId || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      <div>{new Date(sub.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-400">Completed: {sub.completedDate}</div>
                    </td>
                    <td className="py-4 px-4 font-black text-blue-900 text-sm">
                      ₹{sub.rewardAmount}*
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="py-4 px-4 text-[11px] text-slate-600 max-w-[200px]">
                      {sub.rejectionReason ? (
                        <span className="text-rose-700 font-medium">{sub.rejectionReason}</span>
                      ) : sub.adminNote ? (
                        <span>{sub.adminNote}</span>
                      ) : (
                        <span className="text-slate-400">Awaiting partner reconciliation audit</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setViewingProof(sub)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Inspection Modal */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Submission Proof Details</h3>
              <button 
                onClick={() => setViewingProof(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Task Title</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{viewingProof.taskTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Reference ID</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{viewingProof.proofApplicationId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Reward</span>
                  <p className="font-bold text-emerald-700 mt-0.5">₹{viewingProof.rewardAmount}*</p>
                </div>
              </div>

              {viewingProof.screenshotUrl ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Attached Confirmation Screenshot</span>
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 p-1">
                    <img 
                      src={viewingProof.screenshotUrl} 
                      alt="Proof" 
                      referrerPolicy="no-referrer"
                      className="w-full max-h-60 object-contain rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-center">
                  No image attached. Reference number submitted.
                </div>
              )}

              {viewingProof.userNote && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">User Note</span>
                  <p className="p-2.5 bg-slate-50 rounded-xl text-slate-700 text-xs border border-slate-200/60">
                    {viewingProof.userNote}
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingProof(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
