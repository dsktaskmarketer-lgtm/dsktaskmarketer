import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink,
  Eye,
  AlertCircle,
  Clock,
  Edit,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileText,
  User,
  Building2,
  Mail,
  Phone,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  MessageSquare,
  Globe,
  MapPin,
  Send,
  Link as LinkIcon,
  ChevronRight,
  PlusCircle,
  Layers,
  PhoneCall
} from 'lucide-react';
import { Campaign, TaskCategory, CampaignEnquiry, CampaignEnquiryStatus, Task } from '../../types';
import { 
  fetchCampaignEnquiries, 
  updateCampaignEnquiry, 
  convertCampaignEnquiryToTask 
} from '../../services/api';

interface AdminCampaignsViewProps {
  campaigns: Campaign[];
  categories: TaskCategory[];
  onApproveCampaign: (campaignId: string) => Promise<void>;
  onRejectCampaign: (campaignId: string, reason: string) => Promise<void>;
  onNavigate?: (view: string, id?: string) => void;
  onRefreshTasks?: () => Promise<void>;
}

// Mandated 8 Enquiry Statuses
export const MANDATED_STATUSES: { key: CampaignEnquiryStatus; label: string; color: string; badgeBg: string }[] = [
  { 
    key: 'new', 
    label: 'New', 
    color: 'text-blue-700 dark:text-blue-300', 
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
  },
  { 
    key: 'contacted', 
    label: 'Contacted', 
    color: 'text-amber-700 dark:text-amber-300', 
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
  },
  { 
    key: 'under_review', 
    label: 'Under Review', 
    color: 'text-purple-700 dark:text-purple-300', 
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
  },
  { 
    key: 'follow_up_required', 
    label: 'Follow-up Required', 
    color: 'text-orange-700 dark:text-orange-300', 
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-200 dark:border-orange-800' 
  },
  { 
    key: 'approved', 
    label: 'Approved', 
    color: 'text-emerald-700 dark:text-emerald-300', 
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
  },
  { 
    key: 'rejected', 
    label: 'Rejected', 
    color: 'text-rose-700 dark:text-rose-300', 
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800' 
  },
  { 
    key: 'converted', 
    label: 'Converted', 
    color: 'text-teal-700 dark:text-teal-300', 
    badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800' 
  },
  { 
    key: 'archived', 
    label: 'Archived', 
    color: 'text-slate-700 dark:text-slate-300', 
    badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' 
  },
];

export const AdminCampaignsView: React.FC<AdminCampaignsViewProps> = ({
  campaigns,
  categories,
  onApproveCampaign,
  onRejectCampaign,
  onNavigate,
  onRefreshTasks,
}) => {
  // Navigation tabs: 'all_enquiries' | 'advertiser_enquiries' | 'partner_enquiries' | 'live_campaigns'
  const [activeTab, setActiveTab] = useState<'all_enquiries' | 'advertiser_enquiries' | 'partner_enquiries' | 'live_campaigns'>('all_enquiries');

  // Enquiries State
  const [enquiries, setEnquiries] = useState<CampaignEnquiry[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<'all' | CampaignEnquiryStatus>('all');
  const [enquiryPartnerTypeFilter, setEnquiryPartnerTypeFilter] = useState<'all' | string>('all');
  
  // Selected Enquiry for "View Full Enquiry" Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<CampaignEnquiry | null>(null);
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [trackingUrlDraft, setTrackingUrlDraft] = useState('');
  const [newFollowUpNote, setNewFollowUpNote] = useState('');
  const [newFollowUpType, setNewFollowUpType] = useState<'call' | 'whatsapp' | 'email' | 'note'>('call');
  const [savingEnquiry, setSavingEnquiry] = useState(false);

  // Conversion to Task State
  const [convertingEnquiry, setConvertingEnquiry] = useState<CampaignEnquiry | null>(null);
  const [taskConversionForm, setTaskConversionForm] = useState<Partial<Task>>({});
  const [isConverting, setIsConverting] = useState(false);

  // Rejection Dialog State
  const [rejectingEnquiry, setRejectingEnquiry] = useState<CampaignEnquiry | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');

  // Contact Drawer / Modal State
  const [contactingEnquiry, setContactingEnquiry] = useState<CampaignEnquiry | null>(null);

  // Existing campaigns filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Campaign['status']>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const res = await fetchCampaignEnquiries();
      if (res && res.enquiries) {
        setEnquiries(res.enquiries);
      }
    } catch (err) {
      console.warn('[Admin Campaigns] Note fetching enquiries:', err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  // Filter enquiries according to active tab, search, status, and partner type
  const filteredEnquiries = enquiries.filter(e => {
    // Tab filter
    if (activeTab === 'advertiser_enquiries' && e.enquiryType === 'partner') return false;
    if (activeTab === 'partner_enquiries' && e.enquiryType !== 'partner') return false;

    // Partner type filter
    if (enquiryPartnerTypeFilter !== 'all') {
      const type = e.partnerType || e.enquiryType;
      if (type !== enquiryPartnerTypeFilter) return false;
    }

    // Status filter
    if (enquiryStatusFilter !== 'all') {
      const mappedStatus = e.status === ('new_enquiry' as any) ? 'new' : (e.status === ('reviewing' as any) ? 'under_review' : e.status);
      if (mappedStatus !== enquiryStatusFilter) return false;
    }

    // Search query
    if (enquirySearch.trim()) {
      const q = enquirySearch.toLowerCase();
      const match =
        (e.businessName && e.businessName.toLowerCase().includes(q)) ||
        (e.campaignName && e.campaignName.toLowerCase().includes(q)) ||
        (e.companyName && e.companyName.toLowerCase().includes(q)) ||
        (e.contactPerson && e.contactPerson.toLowerCase().includes(q)) ||
        (e.officialEmail && e.officialEmail.toLowerCase().includes(q)) ||
        (e.phoneNumber && e.phoneNumber.toLowerCase().includes(q)) ||
        (e.desiredResult && e.desiredResult.toLowerCase().includes(q)) ||
        (e.productService && e.productService.toLowerCase().includes(q)) ||
        (e.objective && e.objective.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Filter live campaigns
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper to normalize status badge
  const getStatusMeta = (status: string) => {
    const norm = status === 'new_enquiry' ? 'new' : (status === 'reviewing' ? 'under_review' : status);
    return MANDATED_STATUSES.find(s => s.key === norm) || MANDATED_STATUSES[0];
  };

  // ADMIN ACTION 1 & Status/Tracking/Notes/Follow-up updater
  const handleUpdateStatusAndNotes = async (
    enquiryId: string, 
    newStatus?: CampaignEnquiryStatus, 
    notes?: string,
    trackingUrl?: string,
    followUpNote?: string,
    followUpType?: 'call' | 'whatsapp' | 'email' | 'note'
  ) => {
    setSavingEnquiry(true);
    try {
      const res = await updateCampaignEnquiry(enquiryId, {
        ...(newStatus ? { status: newStatus } : {}),
        ...(notes !== undefined ? { adminNotes: notes } : {}),
        ...(trackingUrl !== undefined ? { trackingUrl, trackingUrlArrangedByAdmin: !trackingUrl } : {}),
        ...(followUpNote ? { followUpNote, followUpType: followUpType || 'note' } : {})
      });
      if (res.success && res.enquiry) {
        setEnquiries(prev => prev.map(e => e.id === res.enquiry.id ? res.enquiry : e));
        if (selectedEnquiry?.id === res.enquiry.id) {
          setSelectedEnquiry(res.enquiry);
          setAdminNotesDraft(res.enquiry.adminNotes || '');
          setTrackingUrlDraft(res.enquiry.trackingUrl || '');
        }
        if (followUpNote) {
          setNewFollowUpNote('');
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to update enquiry.");
    } finally {
      setSavingEnquiry(false);
    }
  };

  const handleAddFollowUpLog = async () => {
    if (!selectedEnquiry || !newFollowUpNote.trim()) return;
    await handleUpdateStatusAndNotes(
      selectedEnquiry.id,
      undefined,
      undefined,
      undefined,
      newFollowUpNote.trim(),
      newFollowUpType
    );
  };

  // ADMIN ACTION 2: Contact Advertiser/Partner
  const handleOpenContactModal = (enquiry: CampaignEnquiry) => {
    setContactingEnquiry(enquiry);
  };

  const handleMarkAsContacted = async (enquiry: CampaignEnquiry) => {
    await handleUpdateStatusAndNotes(enquiry.id, 'contacted', enquiry.adminNotes);
    setContactingEnquiry(null);
  };

  // ADMIN ACTION 3: Approve Enquiry
  const handleApproveEnquiry = async (enquiry: CampaignEnquiry) => {
    if (!confirm(`Are you sure you want to approve enquiry "${enquiry.campaignName || enquiry.companyName}"?`)) return;
    await handleUpdateStatusAndNotes(enquiry.id, 'approved');
  };

  // ADMIN ACTION 4: Reject Enquiry
  const handleExecuteRejectEnquiry = async () => {
    if (!rejectingEnquiry) return;
    const note = rejectReasonText.trim() ? `Rejected: ${rejectReasonText.trim()}` : 'Rejected by Admin.';
    await handleUpdateStatusAndNotes(rejectingEnquiry.id, 'rejected', note);
    setRejectingEnquiry(null);
    setRejectReasonText('');
  };

  // ADMIN ACTION 5: Convert to Campaign
  const handleOpenConversionModal = (enquiry: CampaignEnquiry) => {
    setConvertingEnquiry(enquiry);
    const rewardVal = Number(enquiry.rewardAmount || enquiry.rewardPerAction) || 50;
    
    setTaskConversionForm({
      title: enquiry.campaignName ? `${enquiry.campaignName} Task` : `${enquiry.companyName} Campaign Task`,
      partnerName: enquiry.companyName || enquiry.advertiserName || 'Partner',
      categoryId: categories[0]?.id || 'cat_cards',
      rewardAmount: rewardVal,
      currency: 'INR',
      description: enquiry.objective || 'Complete verified campaign action on partner portal.',
      affiliateUrl: enquiry.trackingUrl || enquiry.affiliateUrl || 'https://dsktaskmarketer.com',
      eligibility: enquiry.eligibility || enquiry.targetAudience || 'Age 18+, Resident of India',
      steps: Array.isArray(enquiry.instructions) && enquiry.instructions.length > 0 ? enquiry.instructions : [
        'Click Start Task to visit partner portal',
        'Complete target campaign action or verified application',
        'Save confirmation receipt, Order ID, or screenshot',
        'Submit legitimate verification proof'
      ],
      proofRequirements: Array.isArray(enquiry.requiredProof) && enquiry.requiredProof.length > 0 
        ? enquiry.requiredProof 
        : ['Confirmation screenshot / Order ID'],
      terms: enquiry.notes || 'Reward credited upon successful verification and partner audit reconciliation.'
    });
  };

  const handleExecuteConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingEnquiry) return;

    setIsConverting(true);
    try {
      const res = await convertCampaignEnquiryToTask(convertingEnquiry.id, taskConversionForm);
      if (res.success) {
        setEnquiries(prev => prev.map(enq => enq.id === convertingEnquiry.id ? res.enquiry : enq));
        if (selectedEnquiry?.id === convertingEnquiry.id) {
          setSelectedEnquiry(res.enquiry);
        }
        setConvertingEnquiry(null);

        if (onRefreshTasks) {
          await onRefreshTasks();
        }

        alert(`Successfully converted enquiry into active task: "${res.task.title}"! It is now live on the platform for users.`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to convert enquiry to task.");
    } finally {
      setIsConverting(false);
    }
  };

  const advertiserCount = enquiries.filter(e => e.enquiryType !== 'partner').length;
  const partnerCount = enquiries.filter(e => e.enquiryType === 'partner').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Campaign Enquiries & Approvals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review incoming advertiser and partner proposals, contact sponsors, approve/reject, and convert into live tasks
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('all_enquiries')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all_enquiries'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            All Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('advertiser_enquiries')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'advertiser_enquiries'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Advertiser Enquiries ({advertiserCount})
          </button>
          <button
            onClick={() => setActiveTab('partner_enquiries')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'partner_enquiries'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Partner Enquiries ({partnerCount})
          </button>
          <button
            onClick={() => setActiveTab('live_campaigns')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'live_campaigns'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            Live Campaigns ({campaigns.length})
          </button>
        </div>
      </div>

      {/* ================= ENQUIRIES TABS (ALL / ADVERTISER / PARTNER) ================= */}
      {activeTab !== 'live_campaigns' && (
        <div className="space-y-4">
          
          {/* Search and Refresh Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
                placeholder="Search by company, brand, contact person, email, or objective..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadEnquiries}
                disabled={loadingEnquiries}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Refresh Enquiries"
              >
                <RefreshCw className={`w-4 h-4 ${loadingEnquiries ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mandated Status Filter Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Filter by Status:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setEnquiryStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  enquiryStatusFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Statuses ({enquiries.length})
              </button>
              {MANDATED_STATUSES.map(st => {
                const count = enquiries.filter(e => {
                  const norm = e.status === ('new_enquiry' as any) ? 'new' : (e.status === ('reviewing' as any) ? 'under_review' : e.status);
                  return norm === st.key;
                }).length;

                return (
                  <button
                    key={st.key}
                    onClick={() => setEnquiryStatusFilter(st.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      enquiryStatusFilter === st.key
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Partner / Business Type Filter Pills */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Filter by Partner Category:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all', label: 'All Business Categories' },
                { key: 'company', label: 'Company' },
                { key: 'brand', label: 'Brand' },
                { key: 'creator', label: 'Creator / Influencer' },
                { key: 'local_business', label: 'Local Store' },
                { key: 'app_owner', label: 'App / Website' },
                { key: 'affiliate_partner', label: 'Affiliate' },
                { key: 'agency', label: 'Agency' },
                { key: 'service_provider', label: 'Service Provider' },
                { key: 'other', label: 'Other' },
              ].map(pt => {
                const count = pt.key === 'all' 
                  ? enquiries.length 
                  : enquiries.filter(e => (e.partnerType || e.enquiryType) === pt.key).length;

                return (
                  <button
                    key={pt.key}
                    onClick={() => setEnquiryPartnerTypeFilter(pt.key)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                      enquiryPartnerTypeFilter === pt.key
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pt.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enquiries Cards List */}
          {filteredEnquiries.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No campaign enquiries match criteria</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Proposals submitted by advertisers and partners through the AI Assistant appear here for administrative verification, direct contact, and task conversion.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEnquiries.map(enquiry => {
                const statusMeta = getStatusMeta(enquiry.status);
                const isApproved = enquiry.status === 'approved';
                const isRejected = enquiry.status === 'rejected';

                const partnerTypeLabel = (
                  {
                    company: 'Company / Enterprise',
                    brand: 'Brand',
                    creator: 'Creator / Influencer',
                    influencer: 'Creator / Influencer',
                    local_business: 'Local Store / Business',
                    app_owner: 'App / Website Owner',
                    affiliate_partner: 'Affiliate Partner',
                    agency: 'Agency / Marketer',
                    service_provider: 'Service Provider',
                    other: 'Business Partner'
                  } as Record<string, string>
                )[enquiry.partnerType || enquiry.enquiryType] || (enquiry.enquiryType === 'partner' ? 'Partner Proposal' : 'Advertiser');

                const followUpCount = enquiry.followUpHistory?.length || 0;

                return (
                  <div
                    key={enquiry.id}
                    className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
                  >
                    {/* Top Row: Company Name, Type Badge, Status Badge & Submission Time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 ${
                          enquiry.partnerType === 'creator' || enquiry.partnerType === 'influencer' ? 'bg-pink-600' :
                          enquiry.partnerType === 'local_business' ? 'bg-amber-600' :
                          enquiry.partnerType === 'app_owner' ? 'bg-indigo-600' :
                          enquiry.enquiryType === 'partner' ? 'bg-purple-600' : 'bg-emerald-600'
                        }`}>
                          {enquiry.enquiryType === 'partner' ? (
                            <ShieldCheck className="w-5 h-5" />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {enquiry.businessName || enquiry.campaignName || enquiry.companyName}
                            </h4>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {partnerTypeLabel}
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.badgeBg}`}>
                              {statusMeta.label}
                            </span>
                            {followUpCount > 0 && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {followUpCount} {followUpCount === 1 ? 'follow-up' : 'follow-ups'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>ID: {enquiry.id}</span>
                            <span>•</span>
                            <span>Submitted: {new Date(enquiry.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Converted Task Pill if live */}
                      {enquiry.convertedTaskId && (
                        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Live Task ID: {enquiry.convertedTaskId}
                        </span>
                      )}
                    </div>

                    {/* Middle: Mandatory Contact Info Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Contact Person:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {enquiry.contactPerson || enquiry.advertiserName || 'Not provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Official Email:</span>
                        <a
                          href={`mailto:${enquiry.officialEmail || enquiry.contactEmail}`}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline truncate block"
                        >
                          {enquiry.officialEmail || enquiry.contactEmail}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Phone / WhatsApp:</span>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{enquiry.phoneNumber || enquiry.contactMobile}</span>
                          {enquiry.whatsappNumber && (
                            <a
                              href={`https://wa.me/${enquiry.whatsappNumber.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Company / Brand / Store:</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {enquiry.businessName || enquiry.companyName}
                        </span>
                      </div>
                    </div>

                    {/* Partner Specific & Objective Banner */}
                    {(enquiry.desiredResult || enquiry.productService || enquiry.businessLocation) && (
                      <div className="text-xs bg-slate-100/70 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                        {enquiry.desiredResult && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase">Goal / Desired Result: </span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{enquiry.desiredResult}</span>
                          </div>
                        )}
                        {enquiry.businessLocation && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span><strong>Location:</strong> {enquiry.businessLocation}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Campaign Details & Objective */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/60">
                      <div>
                        <span className="text-slate-400 block">Reward per Action:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                          ₹{enquiry.rewardAmount || enquiry.rewardPerAction || 50}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total Budget:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{enquiry.totalBudget || enquiry.budget || 'Flexible'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Target Completions:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {enquiry.targetCompletions || enquiry.expectedVolume || 100} users
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Tracking Mechanism:</span>
                        {enquiry.trackingUrl ? (
                          <a 
                            href={enquiry.trackingUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="font-bold text-indigo-600 dark:text-indigo-400 truncate block hover:underline"
                          >
                            Partner Link Attached ↗
                          </a>
                        ) : (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            To be arranged by Admin
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Summary Banner */}
                    <div className="text-xs bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400 text-[11px] mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Campaign Summary:</span>
                      </div>
                      <p className="leading-relaxed text-[11px]">
                        {enquiry.aiSummary || enquiry.objective}
                      </p>
                    </div>

                    {/* Internal Admin Note if present */}
                    {enquiry.adminNotes && (
                      <div className="text-[11px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <span className="font-bold">Admin Note: </span>
                          <span>{enquiry.adminNotes}</span>
                        </div>
                      </div>
                    )}

                    {/* MANDATED 5 ADMIN ACTIONS */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400">
                        Admin Actions:
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. View Full Enquiry */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEnquiry(enquiry);
                            setAdminNotesDraft(enquiry.adminNotes || '');
                            setTrackingUrlDraft(enquiry.trackingUrl || '');
                            setNewFollowUpNote('');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Full Enquiry</span>
                        </button>

                        {/* 2. Contact Advertiser/Partner */}
                        <button
                          type="button"
                          onClick={() => handleOpenContactModal(enquiry)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          <span>Contact</span>
                        </button>

                        {/* 3. Approve */}
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleApproveEnquiry(enquiry)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* 4. Reject */}
                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingEnquiry(enquiry);
                              setRejectReasonText('');
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        )}

                        {/* 5. Convert to Campaign */}
                        <button
                          type="button"
                          onClick={() => handleOpenConversionModal(enquiry)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Convert to Campaign</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ================= TAB: LIVE PARTNER CAMPAIGNS ================= */}
      {activeTab === 'live_campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search live campaigns by title or partner..."
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

          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No live campaigns found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Converted enquiries and approved partner campaigns appear here.
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
                    {filteredCampaigns.map(c => {
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
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {c.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedCampaign(c)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                            >
                              Review
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
        </div>
      )}

      {/* ================= MODAL 1: VIEW FULL ENQUIRY ================= */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedEnquiry.campaignName || selectedEnquiry.companyName}
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusMeta(selectedEnquiry.status).badgeBg}`}>
                    {getStatusMeta(selectedEnquiry.status).label}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {selectedEnquiry.enquiryType === 'partner' ? 'Partner Enquiry' : 'Advertiser Enquiry'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Enquiry ID: {selectedEnquiry.id} • Submitted: {new Date(selectedEnquiry.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complete Contact Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mandatory Contact Details</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block font-semibold">Contact Person Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedEnquiry.contactPerson || selectedEnquiry.advertiserName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Company / Brand Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedEnquiry.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Official Email:</span>
                  <a href={`mailto:${selectedEnquiry.officialEmail || selectedEnquiry.contactEmail}`} className="font-bold text-blue-600 hover:underline">
                    {selectedEnquiry.officialEmail || selectedEnquiry.contactEmail}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Phone Number:</span>
                  <a href={`tel:${selectedEnquiry.phoneNumber || selectedEnquiry.contactMobile}`} className="font-bold text-slate-900 dark:text-white hover:underline">
                    {selectedEnquiry.phoneNumber || selectedEnquiry.contactMobile}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">WhatsApp Number:</span>
                  <a
                    href={`https://wa.me/${(selectedEnquiry.whatsappNumber || selectedEnquiry.contactMobile || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{selectedEnquiry.whatsappNumber || selectedEnquiry.contactMobile}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Website:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedEnquiry.website || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Partner Category & Custom Business Specifications */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Partner Specifications & Objective</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block font-semibold">Partner Category:</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {selectedEnquiry.partnerType?.replace('_', ' ') || selectedEnquiry.enquiryType || 'General Partner'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Desired Result / Goal:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedEnquiry.desiredResult || selectedEnquiry.productService || 'User Acquisition'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Reward per Action:</span>
                  <span className="font-black text-emerald-600 text-sm">₹{selectedEnquiry.rewardAmount || selectedEnquiry.rewardPerAction || 50}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Total Budget:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{selectedEnquiry.totalBudget || selectedEnquiry.budget || 'Flexible'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Target Volume:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedEnquiry.targetCompletions || selectedEnquiry.expectedVolume || 100} users</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Campaign Duration:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedEnquiry.campaignDuration || selectedEnquiry.timelines || '30 Days'}</span>
                </div>

                {selectedEnquiry.businessLocation && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 block font-semibold">Store / Business Location:</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      {selectedEnquiry.businessLocation}
                    </span>
                  </div>
                )}

                {selectedEnquiry.creatorPlatforms && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 block font-semibold">Creator Channels / Handles:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedEnquiry.creatorPlatforms} {selectedEnquiry.socialMediaProfiles ? `— ${selectedEnquiry.socialMediaProfiles}` : ''}
                    </span>
                  </div>
                )}

                {selectedEnquiry.promotionRequirement && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 block font-semibold">Special Promotion Requirements:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {selectedEnquiry.promotionRequirement}
                    </span>
                  </div>
                )}
              </div>

              {/* Tracking Link Management */}
              <div className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tracking / Affiliate URL Setup</span>
                  </span>
                  {selectedEnquiry.trackingUrlArrangedByAdmin && !selectedEnquiry.trackingUrl && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                      To be arranged by Admin
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={trackingUrlDraft}
                    onChange={e => setTrackingUrlDraft(e.target.value)}
                    placeholder="https://partner-link.com?ref=dsk_task"
                    className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                  <button
                    type="button"
                    disabled={savingEnquiry}
                    onClick={() => handleUpdateStatusAndNotes(selectedEnquiry.id, undefined, undefined, trackingUrlDraft)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Save URL
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Affiliate and tracking URLs are optional for partners; admins can configure or arrange tracking links prior to campaign launch.
                </p>
              </div>

              {/* Instructions & Required Proof */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold mb-1">Instructions / Steps:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    {Array.isArray(selectedEnquiry.instructions) ? (
                      selectedEnquiry.instructions.map((ins, i) => <li key={i}>{ins}</li>)
                    ) : (
                      <li>{selectedEnquiry.instructions || 'Standard verification'}</li>
                    )}
                  </ul>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold mb-1">Required Proof:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    {Array.isArray(selectedEnquiry.requiredProof) ? (
                      selectedEnquiry.requiredProof.map((prf, i) => <li key={i}>{prf}</li>)
                    ) : (
                      <li>{selectedEnquiry.requiredProof || 'Confirmation Screenshot / ID'}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* AI Summary Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
              <span className="font-bold block mb-1">AI Assistant Summary:</span>
              <p>{selectedEnquiry.aiSummary || selectedEnquiry.objective}</p>
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Update Status Workflow:
              </label>
              <div className="flex flex-wrap gap-2">
                {MANDATED_STATUSES.map(st => (
                  <button
                    key={st.key}
                    type="button"
                    disabled={savingEnquiry}
                    onClick={() => handleUpdateStatusAndNotes(selectedEnquiry.id, st.key, adminNotesDraft)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      getStatusMeta(selectedEnquiry.status).key === st.key
                        ? `${st.badgeBg} ring-2 ring-emerald-500`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up Timeline & Management */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                  <span>Follow-up History ({selectedEnquiry.followUpHistory?.length || 0})</span>
                </label>
              </div>

              {/* Log new follow-up */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={newFollowUpType}
                    onChange={e => setNewFollowUpType(e.target.value as any)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <option value="call">Phone Call</option>
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="email">Official Email</option>
                    <option value="note">Internal Review Note</option>
                  </select>
                  <input
                    type="text"
                    value={newFollowUpNote}
                    onChange={e => setNewFollowUpNote(e.target.value)}
                    placeholder="Log contact outcome, sponsor remarks, agreed payout..."
                    className="flex-1 p-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFollowUpLog();
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={savingEnquiry || !newFollowUpNote.trim()}
                    onClick={handleAddFollowUpLog}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Log
                  </button>
                </div>
              </div>

              {/* History List */}
              {selectedEnquiry.followUpHistory && selectedEnquiry.followUpHistory.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {selectedEnquiry.followUpHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            item.type === 'call' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300' :
                            item.type === 'whatsapp' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300' :
                            item.type === 'email' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300' :
                            'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.date).toLocaleString()} by {item.adminName}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          {item.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic py-1">
                  No follow-up records logged yet. Use the logger above to track client interactions.
                </div>
              )}
            </div>

            {/* Admin Internal Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                General Admin Remarks:
              </label>
              <textarea
                rows={2}
                value={adminNotesDraft}
                onChange={e => setAdminNotesDraft(e.target.value)}
                placeholder="Internal discussions, partner credibility assessment..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingEnquiry}
                  onClick={() => handleUpdateStatusAndNotes(selectedEnquiry.id, undefined, adminNotesDraft)}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Save Remarks
                </button>
              </div>
            </div>

            {/* Bottom Actions in Modal */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleOpenContactModal(selectedEnquiry)}
                className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Contact Advertiser / Partner</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEnquiry(null);
                    handleOpenConversionModal(selectedEnquiry);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Convert to Campaign / Task</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 2: CONTACT ADVERTISER / PARTNER ================= */}
      {contactingEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Contact Sponsor
                </h3>
                <p className="text-xs text-slate-400">
                  {contactingEnquiry.companyName} • {contactingEnquiry.contactPerson || contactingEnquiry.advertiserName}
                </p>
              </div>
              <button onClick={() => setContactingEnquiry(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* WhatsApp Direct Action */}
              <a
                href={`https://wa.me/${(contactingEnquiry.whatsappNumber || contactingEnquiry.phoneNumber || contactingEnquiry.contactMobile || '').replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(contactingEnquiry.contactPerson || '')}%2C%20we%20have%20reviewed%20your%20campaign%20enquiry%20for%20${encodeURIComponent(contactingEnquiry.companyName)}%20on%20DSK%20TaskMarketer.`}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Open WhatsApp Direct Chat</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Email Direct Action */}
              <a
                href={`mailto:${contactingEnquiry.officialEmail || contactingEnquiry.contactEmail}?subject=${encodeURIComponent(`DSK TaskMarketer - Campaign Enquiry: ${contactingEnquiry.campaignName || contactingEnquiry.companyName}`)}&body=${encodeURIComponent(`Dear ${contactingEnquiry.contactPerson || 'Partner'},\n\nThank you for submitting your campaign proposal with DSK TaskMarketer.\n\nWe would like to discuss next steps regarding your campaign requirements.`)}`}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-bold flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Send Official Email</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Phone Direct Action */}
              <a
                href={`tel:${contactingEnquiry.phoneNumber || contactingEnquiry.contactMobile}`}
                className="w-full p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-bold flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <span>Call Phone ({contactingEnquiry.phoneNumber || contactingEnquiry.contactMobile})</span>
                </div>
                <PhoneCall className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleMarkAsContacted(contactingEnquiry)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Mark as Contacted
              </button>
              <button
                type="button"
                onClick={() => setContactingEnquiry(null)}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: REJECT ENQUIRY ================= */}
      {rejectingEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-black text-rose-600">
              Reject Campaign Enquiry
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please provide a reason or note for rejecting the enquiry from <strong>{rejectingEnquiry.companyName}</strong>.
            </p>

            <textarea
              rows={3}
              value={rejectReasonText}
              onChange={e => setRejectReasonText(e.target.value)}
              placeholder="e.g. Incomplete verification, non-compliant tracking link, or outside category policy..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingEnquiry(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRejectEnquiry}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: CONVERT TO TASK / CAMPAIGN ================= */}
      {convertingEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Convert Enquiry into Live Campaign & Task
                </h3>
                <p className="text-xs text-slate-400">
                  Enquiry ID: {convertingEnquiry.id} • Partner: {convertingEnquiry.companyName}
                </p>
              </div>
              <button onClick={() => setConvertingEnquiry(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteConversion} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskConversionForm.title || ''}
                  onChange={e => setTaskConversionForm({ ...taskConversionForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Partner / Sponsor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={taskConversionForm.partnerName || ''}
                    onChange={e => setTaskConversionForm({ ...taskConversionForm, partnerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Category *
                  </label>
                  <select
                    value={taskConversionForm.categoryId || categories[0]?.id}
                    onChange={e => setTaskConversionForm({ ...taskConversionForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Reward Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={taskConversionForm.rewardAmount || 50}
                    onChange={e => setTaskConversionForm({ ...taskConversionForm, rewardAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Affiliate / Tracking Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={taskConversionForm.affiliateUrl || ''}
                    onChange={e => setTaskConversionForm({ ...taskConversionForm, affiliateUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Description / Task Summary
                </label>
                <textarea
                  rows={2}
                  value={taskConversionForm.description || ''}
                  onChange={e => setTaskConversionForm({ ...taskConversionForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Instructions / Steps (one per line)
                </label>
                <textarea
                  rows={3}
                  value={Array.isArray(taskConversionForm.steps) ? taskConversionForm.steps.join('\n') : ''}
                  onChange={e => setTaskConversionForm({ 
                    ...taskConversionForm, 
                    steps: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Proof Requirements (one per line)
                </label>
                <textarea
                  rows={2}
                  value={Array.isArray(taskConversionForm.proofRequirements) ? taskConversionForm.proofRequirements.join('\n') : ''}
                  onChange={e => setTaskConversionForm({ 
                    ...taskConversionForm, 
                    proofRequirements: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConvertingEnquiry(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConverting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isConverting ? (
                    <span>Publishing Task...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Approve & Publish Live Campaign Task</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL 5: REVIEW LIVE CAMPAIGN ================= */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedCampaign.title}
                </h3>
                <p className="text-xs text-slate-400">Partner: {selectedCampaign.partnerName}</p>
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600 dark:text-slate-300">{selectedCampaign.description}</p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="font-bold block text-emerald-600">Reward: ₹{selectedCampaign.rewardAmount}</span>
                <span className="text-slate-400 block mt-1">Status: {selectedCampaign.status}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
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
