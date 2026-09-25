import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ExternalLink, 
  FileCheck,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Campaign, Submission, User } from '../../types';

interface ClientSubmissionsViewProps {
  user: User;
  campaigns: Campaign[];
  submissions: Submission[];
  onReviewSubmission: (submissionId: string, status: 'approved' | 'rejected', note?: string) => Promise<void>;
}

export const ClientSubmissionsView: React.FC<ClientSubmissionsViewProps> = ({
  user,
  campaigns,
  submissions,
  onReviewSubmission,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Submissions that belong to campaigns owned by this client
  const myCampaignIds = new Set(campaigns.filter(c => c.clientId === user.id).map(c => c.id));
  const mySubmissions = submissions.filter(s => myCampaignIds.has(s.campaignId || ''));

  const filtered = mySubmissions.filter(s => {
    const matchesSearch = s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.proofApplicationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && (s.status === 'pending_review' || s.status === 'under_verification')) ||
      (statusFilter === 'approved' && s.status === 'approved') ||
      (statusFilter === 'rejected' && s.status === 'rejected');
    return matchesSearch && matchesStatus;
  });

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedSubmission) return;
    try {
      setReviewing(true);
      await onReviewSubmission(selectedSubmission.id, status, reviewNote);
      setSelectedSubmission(null);
      setReviewNote('');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="w-full px-4 md:px-6 py-8 space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Submissions Audit Desk</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Verify and approve customer actions completed on your marketing campaigns
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user, email, or application ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <FileCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No submissions found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Submissions submitted by users who completed your campaigns will appear here for verification.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reward</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{s.userName}</div>
                      <div className="text-[11px] text-slate-500">{s.userEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                      {s.proofApplicationId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(s.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                      ₹{s.rewardAmount}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                        s.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                        'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedSubmission(s)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Audit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Audit User Submission</h2>

            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl">
              <div><span className="text-slate-400">Applicant:</span> <strong className="text-slate-800 dark:text-slate-200">{selectedSubmission.userName} ({selectedSubmission.userEmail})</strong></div>
              <div><span className="text-slate-400">Application ID / UCC:</span> <code className="font-bold text-emerald-600">{selectedSubmission.proofApplicationId}</code></div>
              <div><span className="text-slate-400">Completion Date:</span> <span>{selectedSubmission.completedDate}</span></div>
              {selectedSubmission.userNote && (
                <div><span className="text-slate-400">User Note:</span> <p className="text-slate-700 dark:text-slate-300 italic">{selectedSubmission.userNote}</p></div>
              )}
            </div>

            {selectedSubmission.screenshotUrl && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Proof Screenshot</label>
                <a 
                  href={selectedSubmission.screenshotUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 relative group"
                >
                  <img src={selectedSubmission.screenshotUrl} alt="Proof" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    Click to Open Full View
                  </div>
                </a>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Audit / Rejection Note (Optional)
              </label>
              <textarea
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Reason or feedback..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                disabled={reviewing}
                onClick={() => handleAction('rejected')}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
              <button
                disabled={reviewing}
                onClick={() => handleAction('approved')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve & Credit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
