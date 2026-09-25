import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  PlusCircle, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Sparkles,
  RefreshCw,
  Building2,
  Eye,
  ShieldCheck,
  Phone,
  Mail,
  X
} from 'lucide-react';
import { Campaign, TaskCategory, User, CampaignEnquiry } from '../../types';
import { fetchMyCampaignEnquiries } from '../../services/api';
import { MANDATED_STATUSES } from '../admin/AdminCampaignsView';

interface ClientCampaignsViewProps {
  user: User;
  campaigns: Campaign[];
  categories: TaskCategory[];
  onCreateCampaignClick: () => void;
  onUpdateStatus?: (campaignId: string, status: Campaign['status']) => Promise<void>;
}

export const ClientCampaignsView: React.FC<ClientCampaignsViewProps> = ({
  user,
  campaigns,
  categories,
  onCreateCampaignClick,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'my_enquiries' | 'live_campaigns'>('my_enquiries');
  const [enquiries, setEnquiries] = useState<CampaignEnquiry[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<CampaignEnquiry | null>(null);

  const loadMyEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const res = await fetchMyCampaignEnquiries();
      if (res && res.enquiries) {
        setEnquiries(res.enquiries);
      }
    } catch (err) {
      console.warn('[Client Campaigns] Note fetching my enquiries:', err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  useEffect(() => {
    loadMyEnquiries();
  }, []);

  // Filtered live campaigns
  const myCampaigns = campaigns.filter(c => c.clientId === user.id);
  const filteredCampaigns = myCampaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered enquiries
  const filteredEnquiries = enquiries.filter(e => {
    const matchesSearch = (e.businessName && e.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (e.campaignName && e.campaignName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (e.companyName && e.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (e.objective && e.objective.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (e.desiredResult && e.desiredResult.toLowerCase().includes(searchTerm.toLowerCase()));
    const norm = e.status === ('new_enquiry' as any) ? 'new' : (e.status === ('reviewing' as any) ? 'under_review' : e.status);
    const matchesStatus = statusFilter === 'all' || norm === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const norm = status === 'new_enquiry' ? 'new' : (status === 'reviewing' ? 'under_review' : status);
    const meta = MANDATED_STATUSES.find(s => s.key === norm) || MANDATED_STATUSES[0];
    return meta;
  };

  return (
    <div className="w-full px-4 md:px-6 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Campaign Proposals & Enquiries
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit and monitor your advertiser campaign proposals. Reviewed and published by Admin.
          </p>
        </div>

        {/* Primary CTA: Launch AI Assistant */}
        <button
          onClick={onCreateCampaignClick}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Campaign Enquiry (AI Assistant)</span>
        </button>
      </div>

      {/* Informational Compliance Banner */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-white">Admin Approval Workflow: </span>
          All advertiser proposals are collected via our AI Assistant, validated with mandatory contact details, and audited by platform administrators before being converted into live tasks for users.
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('my_enquiries');
              setStatusFilter('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'my_enquiries'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>My Campaign Enquiries ({enquiries.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('live_campaigns');
              setStatusFilter('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'live_campaigns'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Active Campaigns ({myCampaigns.length})</span>
          </button>
        </div>

        {activeTab === 'my_enquiries' && (
          <button
            onClick={loadMyEnquiries}
            disabled={loadingEnquiries}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
            title="Refresh my enquiries"
          >
            <RefreshCw className={`w-4 h-4 ${loadingEnquiries ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'my_enquiries' ? "Search enquiries by brand or objective..." : "Search campaigns by title..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          {activeTab === 'my_enquiries' ? (
            <>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All
              </button>
              {MANDATED_STATUSES.map(st => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === st.key
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </>
          ) : (
            (['all', 'active', 'pending_approval', 'paused', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))
          )}
        </div>
      </div>

      {/* CONTENT: TAB 1 - MY ENQUIRIES */}
      {activeTab === 'my_enquiries' && (
        <div className="space-y-4">
          {filteredEnquiries.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Campaign Enquiries Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Ready to launch your performance marketing campaign? Use our conversational AI Assistant to submit your proposal.
                </p>
              </div>
              <button
                onClick={onCreateCampaignClick}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit First Campaign Enquiry</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEnquiries.map(enquiry => {
                const statusMeta = getStatusBadge(enquiry.status);

                return (
                  <div
                    key={enquiry.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {enquiry.businessName || enquiry.campaignName || enquiry.companyName}
                            </h4>
                            {enquiry.partnerType && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                {enquiry.partnerType.replace('_', ' ')}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.badgeBg}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Enquiry ID: {enquiry.id} • Submitted: {new Date(enquiry.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <div>
                        <span className="text-slate-400 block font-semibold">Reward/Action:</span>
                        <span className="font-black text-emerald-600 text-xs">
                          ₹{enquiry.rewardAmount || enquiry.rewardPerAction || 50}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Total Budget:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{enquiry.totalBudget || enquiry.budget || 'Flexible'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Target Completions:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {enquiry.targetCompletions || 100} users
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Duration:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {enquiry.campaignDuration || enquiry.timelines || '30 Days'}
                        </span>
                      </div>
                    </div>

                    {/* AI Summary snippet */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      {enquiry.aiSummary || enquiry.objective}
                    </p>

                    {/* Converted notification */}
                    {enquiry.convertedTaskId && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Approved & Published! Live Campaign Task ID: {enquiry.convertedTaskId}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENT: TAB 2 - LIVE CAMPAIGNS */}
      {activeTab === 'live_campaigns' && (
        <div className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Active Campaigns</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Once your campaign enquiries are reviewed and approved by administrators, they will appear here as active campaigns.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCampaigns.map(c => {
                const category = categories.find(cat => cat.id === c.categoryId);
                return (
                  <div
                    key={c.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">{c.title}</h4>
                        <span className="text-xs text-slate-400">{category?.name || 'General'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{c.description}</p>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-black text-emerald-600">Reward: ₹{c.rewardAmount}</span>
                      <span className="text-slate-400">Target: {c.targetCompletions || 100} completions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ENQUIRY DETAILS MODAL FOR CLIENT */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedEnquiry.campaignName || selectedEnquiry.companyName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(selectedEnquiry.status).badgeBg}`}>
                    {getStatusBadge(selectedEnquiry.status).label}
                  </span>
                  <span className="text-xs text-slate-400">ID: {selectedEnquiry.id}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEnquiry(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                <div>
                  <span className="text-slate-400 block font-semibold">Reward per Action:</span>
                  <span className="font-black text-emerald-600 text-sm">₹{selectedEnquiry.rewardAmount || selectedEnquiry.rewardPerAction || 50}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Total Budget:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{selectedEnquiry.totalBudget || selectedEnquiry.budget || 'Flexible'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Duration:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedEnquiry.campaignDuration || selectedEnquiry.timelines || '30 Days'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Target Completions:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedEnquiry.targetCompletions || 100}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Submitted Contact Details:</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 text-slate-700 dark:text-slate-300">
                  <p><strong>Contact Person:</strong> {selectedEnquiry.contactPerson || selectedEnquiry.advertiserName}</p>
                  <p><strong>Official Email:</strong> {selectedEnquiry.officialEmail || selectedEnquiry.contactEmail}</p>
                  <p><strong>Phone / WhatsApp:</strong> {selectedEnquiry.phoneNumber || selectedEnquiry.contactMobile} / {selectedEnquiry.whatsappNumber || selectedEnquiry.phoneNumber || selectedEnquiry.contactMobile}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Campaign Objective & Requirements:</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedEnquiry.objective}
                </div>
              </div>

              {selectedEnquiry.adminNotes && (
                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Admin Feedback:</span>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-800 dark:text-amber-200">
                    {selectedEnquiry.adminNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold"
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
