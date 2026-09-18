import React, { useState } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Campaign, TaskCategory } from '../../types';
import { AdminUserLinkCard } from '../../components/admin/AdminUserLinkCard';

interface AdminCampaignsViewProps {
  campaigns: Campaign[];
  categories: TaskCategory[];
  onApproveCampaign: (campaignId: string) => Promise<void>;
  onRejectCampaign: (campaignId: string, reason: string) => Promise<void>;
  onNavigate?: (view: string, id?: string) => void;
}

export const AdminCampaignsView: React.FC<AdminCampaignsViewProps> = ({
  campaigns,
  categories,
  onApproveCampaign,
  onRejectCampaign,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Campaign['status']>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const filtered = campaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string) => {
    try {
      setProcessing(true);
      await onApproveCampaign(id);
      setSelectedCampaign(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    try {
      setProcessing(true);
      await onRejectCampaign(id, rejectReason.trim());
      setSelectedCampaign(null);
      setRejectReason('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Campaign Approvals</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Review, approve, and convert client-submitted offers into live tasks
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search campaigns by title or partner..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'pending_approval', 'active', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'all' ? 'All Campaigns' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No campaigns found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Client submitted campaigns will show up here for administrative compliance approval.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Title & Partner</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Reward</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(c => {
                  const category = categories.find(cat => cat.id === c.categoryId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div>{c.title}</div>
                        <div className="text-[11px] text-slate-400 font-normal">Partner: {c.partnerName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {category?.name || 'General'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        ₹{c.rewardAmount}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                          c.status === 'pending_approval' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                          'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedCampaign(c)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Review Client Campaign</h2>

            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl">
              <div><span className="text-slate-400">Campaign Title:</span> <strong className="text-slate-800 dark:text-slate-200">{selectedCampaign.title}</strong></div>
              <div><span className="text-slate-400">Partner:</span> <span>{selectedCampaign.partnerName}</span></div>
              <div><span className="text-slate-400">Reward Per Action:</span> <strong className="text-emerald-600">₹{selectedCampaign.rewardAmount}</strong></div>
              <div><span className="text-slate-400">Target Completions:</span> <span>{selectedCampaign.targetCompletions || '100'}</span></div>
              <div><span className="text-slate-400">Affiliate URL:</span> <a href={selectedCampaign.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">{selectedCampaign.affiliateUrl}</a></div>
              <div><span className="text-slate-400">Description:</span> <p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedCampaign.description}</p></div>
            </div>

            {/* Live User-Facing Link Card */}
            <div>
              <div className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 tracking-wider">
                User-Facing Campaign Page & Sharing
              </div>
              <AdminUserLinkCard
                taskId={selectedCampaign.id}
                taskTitle={selectedCampaign.title}
                partnerName={selectedCampaign.partnerName}
                rewardAmount={selectedCampaign.rewardAmount}
                onNavigate={onNavigate}
              />
            </div>

            {selectedCampaign.status === 'pending_approval' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Rejection Reason (if rejecting)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invalid affiliate link or non-compliant reward rate"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>

              {selectedCampaign.status === 'pending_approval' && (
                <>
                  <button
                    disabled={processing || !rejectReason.trim()}
                    onClick={() => handleReject(selectedCampaign.id)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    disabled={processing}
                    onClick={() => handleApprove(selectedCampaign.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Publish Task</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
