import React, { useState } from 'react';
import { 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Search, 
  X, 
  Filter, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { TaskSubmission } from '../../types';

interface AdminSubmissionsViewProps {
  submissions: TaskSubmission[];
  onUpdateStatus: (id: string, status: 'pending_review' | 'under_verification' | 'approved' | 'rejected', rejectionReason?: string, adminNote?: string) => Promise<void>;
}

export const AdminSubmissionsView: React.FC<AdminSubmissionsViewProps> = ({
  submissions,
  onUpdateStatus,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [inspectModal, setInspectModal] = useState<TaskSubmission | null>(null);
  const [rejectModal, setRejectModal] = useState<TaskSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Application ID was not confirmed in partner affiliate reconciliation.');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const filtered = submissions.filter(s => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch = !search ||
      s.taskTitle.toLowerCase().includes(search.toLowerCase()) ||
      (s.proofApplicationId && s.proofApplicationId.toLowerCase().includes(search.toLowerCase())) ||
      s.userId.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = async (sub: TaskSubmission) => {
    if (confirm(`Approve submission for "${sub.taskTitle}" and credit ₹${sub.rewardAmount} to user ${sub.userId}?`)) {
      setProcessing(true);
      await onUpdateStatus(sub.id, 'approved', undefined, 'Verified against partner affiliate audit report.');
      setProcessing(false);
      if (inspectModal?.id === sub.id) setInspectModal(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    setProcessing(true);
    await onUpdateStatus(rejectModal.id, 'rejected', rejectionReason, adminNote);
    setProcessing(false);
    setRejectModal(null);
    if (inspectModal?.id === rejectModal.id) setInspectModal(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Approved & Credited
          </span>
        );
      case 'under_verification':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            Under Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block mb-1">
          Audit Desk
        </span>
        <h1 className="text-2xl font-black text-slate-900">Task Submissions Verification</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audit member applications against partner affiliate tracking logs and authorize reward disbursements.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search || ''}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task title, application reference ID, or user ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setFilter('pending_review')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'pending_review' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Review ({submissions.filter(s => s.status === 'pending_review').length})
          </button>
          <button
            onClick={() => setFilter('under_verification')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'under_verification' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Under Verification ({submissions.filter(s => s.status === 'under_verification').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Approved ({submissions.filter(s => s.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'rejected' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rejected ({submissions.filter(s => s.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No submissions found under this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3.5 px-6">Task & User ID</th>
                  <th className="py-3.5 px-4">Application Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Reward</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{sub.taskTitle}</p>
                      <p className="text-[10px] text-slate-400 font-mono">User: {sub.userId} • Sub ID: {sub.id}</p>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-700 text-xs">
                      {sub.proofApplicationId || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      <div>{new Date(sub.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </td>
                    <td className="py-4 px-4 font-black text-emerald-800 text-sm">
                      ₹{sub.rewardAmount}*
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectModal(sub)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
                          title="View Proof & Notes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {sub.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(sub)}
                            disabled={processing}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}

                        {sub.status !== 'rejected' && (
                          <button
                            onClick={() => setRejectModal(sub)}
                            disabled={processing}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Submission Audit Details</h3>
                <span className="text-[10px] font-mono text-slate-500">ID: {inspectModal.id}</span>
              </div>
              <button onClick={() => setInspectModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm">{inspectModal.taskTitle}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>User ID: {inspectModal.userId}</span>
                  <span className="font-bold text-emerald-800">Reward: ₹{inspectModal.rewardAmount}*</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl border border-slate-200 bg-white">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Application Ref</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{inspectModal.proofApplicationId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Completed Date</span>
                  <p className="font-bold text-slate-800 mt-0.5">{inspectModal.completedDate}</p>
                </div>
              </div>

              {inspectModal.userNote && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">User Note</span>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-700 text-xs border border-slate-200">
                    {inspectModal.userNote}
                  </p>
                </div>
              )}

              {inspectModal.screenshotUrl ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Submitted Screenshot</span>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 p-1">
                    <img 
                      src={inspectModal.screenshotUrl} 
                      alt="Proof" 
                      referrerPolicy="no-referrer"
                      className="w-full max-h-72 object-contain rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-center">
                  No image attached. Member provided application reference ID only.
                </div>
              )}

              {inspectModal.adminNote && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Internal Audit Note</span>
                  <p className="p-3 bg-amber-50 rounded-xl text-amber-900 text-xs border border-amber-200">
                    {inspectModal.adminNote}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                {inspectModal.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      setRejectModal(inspectModal);
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 hover:bg-rose-100"
                  >
                    Reject Submission
                  </button>
                )}
                {inspectModal.status !== 'approved' && (
                  <button
                    onClick={() => handleApprove(inspectModal)}
                    className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700"
                  >
                    Approve & Disburse Reward
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <h3 className="font-bold text-rose-900 text-sm">Reject Submission</h3>
              <button onClick={() => setRejectModal(null)} className="p-1 rounded-lg text-rose-400 hover:text-rose-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                State the reason for rejecting submission for <strong>{rejectModal.taskTitle}</strong>. This feedback will be displayed to the user.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Select Preset Reason</label>
                <select
                  value={rejectionReason || ''}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900 bg-white"
                >
                  <option value="Application ID was not confirmed in partner affiliate reconciliation.">Application ID not found in partner audit.</option>
                  <option value="Screenshot does not clearly show completed application confirmation.">Screenshot unclear or missing reference number.</option>
                  <option value="Partner reported application was cancelled, incomplete, or duplicate.">Partner reported duplicate or incomplete KYC.</option>
                  <option value="Task was completed outside the approved affiliate tracking session.">Tracking session mismatch or direct organic visit.</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Custom Note / Explanation</label>
                <textarea
                  rows={3}
                  value={adminNote || ''}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Additional context for member or audit records..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
