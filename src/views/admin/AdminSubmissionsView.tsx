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
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { TaskSubmission } from '../../types';
import { useToast } from '../../context/ToastContext';

interface AdminSubmissionsViewProps {
  submissions: TaskSubmission[];
  tasks?: any[];
  onUpdateStatus: (id: string, status: 'pending_review' | 'under_verification' | 'approved' | 'rejected', rejectionReason?: string, adminNote?: string) => Promise<void>;
  onRefresh?: () => void;
}

export const AdminSubmissionsView: React.FC<AdminSubmissionsViewProps> = ({
  submissions,
  onUpdateStatus,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [inspectModal, setInspectModal] = useState<TaskSubmission | null>(null);
  const [rejectModal, setRejectModal] = useState<TaskSubmission | null>(null);
  const [approveModal, setApproveModal] = useState<TaskSubmission | null>(null);
  const [approveAdminNote, setApproveAdminNote] = useState('Verified against partner affiliate audit report.');
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

  const handleOpenApproveModal = (sub: TaskSubmission) => {
    setApproveModal(sub);
    setApproveAdminNote('Verified against partner affiliate audit report.');
  };

  const handleConfirmApprove = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!approveModal) return;
    try {
      setProcessing(true);
      await onUpdateStatus(
        approveModal.id, 
        'approved', 
        undefined, 
        approveAdminNote || 'Verified against partner affiliate audit report.'
      );
      showToast(`Submission approved! ₹${approveModal.rewardAmount} credited to user wallet.`, 'success');
      if (inspectModal?.id === approveModal.id) setInspectModal(null);
      setApproveModal(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to approve submission:', err);
      showToast(err.message || 'Failed to approve submission. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    try {
      setProcessing(true);
      await onUpdateStatus(rejectModal.id, 'rejected', rejectionReason, adminNote);
      showToast('Submission marked as rejected.', 'info');
      setRejectModal(null);
      if (inspectModal?.id === rejectModal.id) setInspectModal(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to reject submission:', err);
      showToast(err.message || 'Failed to reject submission.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
            Approved & Credited
          </span>
        );
      case 'under_verification':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Under Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-[#0B1F4D] border border-yellow-300">
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6 text-[#0B1F4D]">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md inline-block mb-1">
          Audit Desk
        </span>
        <h1 className="text-2xl font-black text-[#0B1F4D]">Task Submissions Verification</h1>
        <p className="text-xs text-[#0B1F4D]/70 mt-0.5">
          Audit member applications against partner affiliate tracking logs and authorize reward disbursements.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search || ''}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task title, application reference ID, or user ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-[#0B1F4D] placeholder-blue-900/40 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-[#0B1F4D] text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            All Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setFilter('pending_review')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'pending_review' ? 'bg-yellow-400 text-[#0B1F4D] shadow-xs' : 'bg-yellow-50 text-[#0B1F4D] hover:bg-yellow-100 border border-yellow-300'
            }`}
          >
            Pending Review ({submissions.filter(s => s.status === 'pending_review').length})
          </button>
          <button
            onClick={() => setFilter('under_verification')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'under_verification' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Under Verification ({submissions.filter(s => s.status === 'under_verification').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'approved' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Approved ({submissions.filter(s => s.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'rejected' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            Rejected ({submissions.filter(s => s.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-blue-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#0B1F4D]/70">
            No submissions found under this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-blue-50/70 border-b border-blue-200 text-[#0B1F4D] font-bold uppercase text-[10px]">
                  <th className="py-3.5 px-6">Task & User ID</th>
                  <th className="py-3.5 px-4">Application Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Reward</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-[#0B1F4D]">{sub.taskTitle}</p>
                      <p className="text-[10px] text-[#0B1F4D]/60 font-mono">User: {sub.userId} • Sub ID: {sub.id}</p>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-blue-700 text-xs">
                      {sub.proofApplicationId || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-[#0B1F4D]/70">
                      <div>{new Date(sub.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </td>
                    <td className="py-4 px-4 font-black text-blue-700 text-sm">
                      ₹{sub.rewardAmount}*
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectModal(sub)}
                          className="p-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold text-xs transition-colors cursor-pointer"
                          title="View Proof & Notes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {sub.status !== 'approved' && (
                          <button
                            onClick={() => handleOpenApproveModal(sub)}
                            disabled={processing}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Approve
                          </button>
                        )}

                        {sub.status !== 'rejected' && (
                          <button
                            onClick={() => setRejectModal(sub)}
                            disabled={processing}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07152F]/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-blue-200 text-[#0B1F4D]">
            <div className="px-6 py-4 bg-white border-b border-blue-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0B1F4D] text-sm">Submission Audit Details</h3>
                <span className="text-[10px] font-mono text-blue-700">ID: {inspectModal.id}</span>
              </div>
              <button onClick={() => setInspectModal(null)} className="p-1 rounded-lg text-[#0B1F4D]/60 hover:text-[#0B1F4D] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-1">
                <p className="font-bold text-[#0B1F4D] text-sm">{inspectModal.taskTitle}</p>
                <div className="flex items-center justify-between text-[11px] text-[#0B1F4D]/70">
                  <span>User ID: {inspectModal.userId}</span>
                  <span className="font-bold text-blue-700">Reward: ₹{inspectModal.rewardAmount}*</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl border border-blue-200 bg-white">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0B1F4D]/60">Application Ref</span>
                  <p className="font-mono font-bold text-[#0B1F4D] mt-0.5">{inspectModal.proofApplicationId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0B1F4D]/60">Completed Date</span>
                  <p className="font-bold text-[#0B1F4D] mt-0.5">{inspectModal.completedDate}</p>
                </div>
              </div>

              {inspectModal.userNote && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0B1F4D]/60 block mb-1">User Note</span>
                  <p className="p-3 bg-blue-50/30 rounded-xl text-[#0B1F4D] text-xs border border-blue-200">
                    {inspectModal.userNote}
                  </p>
                </div>
              )}

              {inspectModal.screenshotUrl ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0B1F4D]/60 block mb-1">Submitted Screenshot</span>
                  <div className="rounded-2xl border border-blue-200 overflow-hidden bg-blue-50/20 p-1">
                    <img 
                      src={inspectModal.screenshotUrl} 
                      alt="Proof" 
                      referrerPolicy="no-referrer"
                      className="w-full max-h-72 object-contain rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/40 rounded-xl text-[#0B1F4D]/70 text-center border border-blue-200">
                  No image attached. Member provided application reference ID only.
                </div>
              )}

              {inspectModal.adminNote && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0B1F4D]/60 block mb-1">Internal Audit Note</span>
                  <p className="p-3 bg-yellow-50 rounded-xl text-[#0B1F4D] text-xs border border-yellow-300">
                    {inspectModal.adminNote}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-white border-t border-blue-100 flex items-center justify-between">
              <button
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 text-xs font-semibold text-[#0B1F4D]/70 hover:bg-blue-50 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                {inspectModal.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      setRejectModal(inspectModal);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-700 font-bold text-xs rounded-xl border border-red-200 hover:bg-red-100 cursor-pointer"
                  >
                    Reject Submission
                  </button>
                )}
                {inspectModal.status !== 'approved' && (
                  <button
                    onClick={() => handleOpenApproveModal(inspectModal)}
                    disabled={processing}
                    className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Disburse Reward
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07152F]/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-blue-200 text-[#0B1F4D]">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B1F4D] text-sm">Approve Submission & Disburse Reward</h3>
                  <p className="text-[11px] text-blue-700">Audit Desk Verification & Credit</p>
                </div>
              </div>
              <button 
                onClick={() => setApproveModal(null)} 
                disabled={processing}
                className="p-1.5 rounded-lg text-[#0B1F4D]/60 hover:text-[#0B1F4D] hover:bg-blue-100/50 disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50/40 border border-blue-200 rounded-2xl space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0B1F4D]/60 block">Task</span>
                  <p className="font-bold text-[#0B1F4D] text-xs">{approveModal.taskTitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-blue-100 text-[11px]">
                  <div>
                    <span className="text-[10px] text-[#0B1F4D]/60 block font-medium">Beneficiary Member</span>
                    <span className="font-mono text-[#0B1F4D] font-bold">{approveModal.userName || approveModal.userId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#0B1F4D]/60 block font-medium">Application / Proof Ref</span>
                    <span className="font-mono text-blue-700 font-bold">{approveModal.proofApplicationId || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-blue-900">Wallet Reward Disbursement</p>
                  <p className="text-[10px] text-blue-700">Instant credit to user available balance</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-blue-700">₹{approveModal.rewardAmount}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0B1F4D] mb-1">Audit Reconciliation Note</label>
                <textarea
                  rows={2}
                  value={approveAdminNote}
                  onChange={(e) => setApproveAdminNote(e.target.value)}
                  placeholder="e.g. Verified against partner affiliate audit report."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 focus:outline-none text-xs text-[#0B1F4D] bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setApproveModal(null)}
                  disabled={processing}
                  className="px-4 py-2.5 text-xs font-semibold text-[#0B1F4D]/70 hover:bg-blue-50 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Crediting ₹{approveModal.rewardAmount}...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Approval & Credit ₹{approveModal.rewardAmount}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07152F]/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-red-200 text-[#0B1F4D]">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <h3 className="font-bold text-red-900 text-sm">Reject Submission</h3>
              <button onClick={() => setRejectModal(null)} className="p-1 rounded-lg text-red-600 hover:text-red-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
              <p className="text-[#0B1F4D]/80">
                State the reason for rejecting submission for <strong>{rejectModal.taskTitle}</strong>. This feedback will be displayed to the user.
              </p>

              <div>
                <label className="block font-bold text-[#0B1F4D] mb-1">Select Preset Reason</label>
                <select
                  value={rejectionReason || ''}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 focus:outline-none text-xs text-[#0B1F4D] bg-white cursor-pointer"
                >
                  <option value="Application ID was not confirmed in partner affiliate reconciliation.">Application ID not found in partner audit.</option>
                  <option value="Screenshot does not clearly show completed application confirmation.">Screenshot unclear or missing reference number.</option>
                  <option value="Partner reported application was cancelled, incomplete, or duplicate.">Partner reported duplicate or incomplete KYC.</option>
                  <option value="Task was completed outside the approved affiliate tracking session.">Tracking session mismatch or direct organic visit.</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0B1F4D] mb-1">Custom Note / Explanation</label>
                <textarea
                  rows={3}
                  value={adminNote || ''}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Additional context for member or audit records..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 focus:outline-none text-xs text-[#0B1F4D]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#0B1F4D]/70 hover:bg-blue-50 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
