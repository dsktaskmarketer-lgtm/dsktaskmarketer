import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Building2, 
  Users, 
  Store, 
  Smartphone, 
  TrendingUp, 
  Wrench,
  ShieldCheck,
  ExternalLink,
  PlusCircle,
  ArrowRight,
  MessageSquare,
  PhoneCall,
  Info,
  Layers,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Campaign, Submission, User, CampaignEnquiry, PartnerType } from '../../types';
import { fetchMyCampaignEnquiries } from '../../services/api';
import { CampaignEnquiryAIAssistant } from '../../components/campaign/CampaignEnquiryAIAssistant';

interface ClientDashboardViewProps {
  user: User;
  campaigns: Campaign[];
  submissions: Submission[];
  onNavigate: (view: string) => void;
}

const PARTNER_CATEGORIES: {
  type: PartnerType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
  badge: string;
}[] = [
  {
    type: 'company',
    title: 'Company / Enterprise',
    subtitle: 'Scale customer acquisition, verified signups, and KYC completions across India.',
    icon: Building2,
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    badge: 'Acquisition & Growth'
  },
  {
    type: 'brand',
    title: 'Brand / Direct to Consumer',
    subtitle: 'Drive product trials, consumer feedback, survey responses, and brand buzz.',
    icon: Sparkles,
    accentBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    accentText: 'text-purple-600 dark:text-purple-400',
    badge: 'Awareness & Trials'
  },
  {
    type: 'creator',
    title: 'Creator / Influencer',
    subtitle: 'Boost subscribers, channel engagement, community members, and audience reach.',
    icon: Users,
    accentBg: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
    accentText: 'text-pink-600 dark:text-pink-400',
    badge: 'Audience & Reach'
  },
  {
    type: 'local_business',
    title: 'Local Store / Business',
    subtitle: 'Drive genuine footfalls, store visits, local reviews, and walk-in inquiries.',
    icon: Store,
    accentBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    accentText: 'text-amber-600 dark:text-amber-400',
    badge: 'Walk-ins & Footfalls'
  },
  {
    type: 'app_owner',
    title: 'App / Website Owner',
    subtitle: 'Acquire verified app installs, account registrations, app ratings, and active users.',
    icon: Smartphone,
    accentBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    badge: 'Installs & Ratings'
  },
  {
    type: 'affiliate_partner',
    title: 'Affiliate Partner',
    subtitle: 'Promote CPA, CPL, or rev-share offers with performance-based payout structures.',
    icon: TrendingUp,
    accentBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    accentText: 'text-teal-600 dark:text-teal-400',
    badge: 'CPA & Performance'
  },
  {
    type: 'service_provider',
    title: 'Service Provider / Agency',
    subtitle: 'Generate qualified customer inquiries, booking appointments, and client leads.',
    icon: Wrench,
    accentBg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    badge: 'Leads & Appointments'
  }
];

export const ClientDashboardView: React.FC<ClientDashboardViewProps> = ({
  user,
  campaigns,
  submissions,
  onNavigate
}) => {
  const [enquiries, setEnquiries] = useState<CampaignEnquiry[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState<boolean>(true);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);
  const [selectedPartnerCategory, setSelectedPartnerCategory] = useState<PartnerType | undefined>(undefined);
  const [enquirySuccessMessage, setEnquirySuccessMessage] = useState<string | null>(null);

  const myCampaigns = campaigns.filter(c => c.clientId === user.id);
  const activeCampaigns = myCampaigns.filter(c => c.status === 'active');
  
  const mySubmissions = submissions.filter(s => myCampaigns.some(c => c.id === s.campaignId));
  const approvedConversions = mySubmissions.filter(s => s.status === 'approved');
  const totalVerifiedActions = approvedConversions.length;

  const loadEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const res = await fetchMyCampaignEnquiries();
      if (res && res.enquiries) {
        setEnquiries(res.enquiries);
      }
    } catch (err) {
      console.warn('Note: Could not load client campaign enquiries', err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [user.id, user.email]);

  const handleStartEnquiryForCategory = (type: PartnerType) => {
    setSelectedPartnerCategory(type);
    setShowAIAssistant(true);
  };

  const handleEnquirySubmitted = (enquiry: CampaignEnquiry) => {
    setEnquiries(prev => [enquiry, ...prev]);
    setShowAIAssistant(false);
    setEnquirySuccessMessage(
      `Your campaign enquiry for "${enquiry.businessName || enquiry.companyName}" has been submitted to DSK TaskMarketer administrators. We will contact you at ${enquiry.phoneNumber} / ${enquiry.officialEmail} shortly.`
    );
  };

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'new':
      case 'new_enquiry':
        return {
          label: 'New Proposal Submitted',
          desc: 'Our administrative team is reviewing your requirements.',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        };
      case 'contacted':
        return {
          label: 'Contacted by Admin',
          desc: 'Our campaign manager has initiated contact to finalize details.',
          badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800'
        };
      case 'under_review':
      case 'reviewing':
        return {
          label: 'Under Administrative Review',
          desc: 'Reviewing payout structures, verification criteria, and tracking URLs.',
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        };
      case 'follow_up_required':
        return {
          label: 'Follow-up Scheduled',
          desc: 'Admin team is in active discussion with you to clarify specifics.',
          badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800'
        };
      case 'approved':
        return {
          label: 'Proposal Approved',
          desc: 'Your campaign specifications have been approved and queued for task creation.',
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        };
      case 'converted':
        return {
          label: 'Live Campaign Active',
          desc: 'Campaign task is published on DSK TaskMarketer. Verified users are completing actions.',
          badge: 'bg-emerald-600 text-white border-emerald-600'
        };
      case 'rejected':
        return {
          label: 'Proposal Closed',
          desc: 'Proposal could not be accommodated at this time.',
          badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        };
      default:
        return {
          label: status,
          desc: 'Pending administrative action',
          badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        };
    }
  };

  return (
    <div className="w-full px-4 md:px-6 py-8 space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#07152F] via-[#0B1E42] to-blue-900/40 rounded-3xl p-6 sm:p-8 text-white border border-blue-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Partner & Advertiser Growth Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              DSK TaskMarketer empowers businesses, brands, creators, local stores, and app owners to achieve verified results, user acquisition, and genuine engagement through admin-managed campaigns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setSelectedPartnerCategory(undefined);
                setShowAIAssistant(true);
              }}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch AI Enquiry Assistant</span>
            </button>
            <button
              onClick={loadEnquiries}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors cursor-pointer"
              title="Refresh Statuses"
            >
              <RefreshCw className={`w-4 h-4 ${loadingEnquiries ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {enquirySuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <span className="font-medium leading-relaxed">{enquirySuccessMessage}</span>
          </div>
          <button
            onClick={() => setEnquirySuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Embedded AI Assistant Modal / View */}
      {showAIAssistant && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  AI Campaign Enquiry Assistant
                </h3>
                <p className="text-xs text-slate-500">
                  Tell our AI what your business needs. We will gather requirements and coordinate with Admin.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAIAssistant(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close Assistant
            </button>
          </div>

          <CampaignEnquiryAIAssistant
            initialPartnerType={selectedPartnerCategory}
            onSuccess={handleEnquirySubmitted}
          />
        </div>
      )}

      {/* STAGE 1: Tell Us What You Need (Interactive Partner Type Selection) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Tell Us What You Need</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your business type below to start a tailored AI enquiry session.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {PARTNER_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.type}
                onClick={() => handleStartEnquiryForCategory(cat.type)}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between ${cat.accentBg}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.accentText} bg-white dark:bg-slate-900 shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/70 ${cat.accentText}`}>
                      {cat.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Start Proposal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STAGE 2: My Submitted Campaign Enquiries */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                My Campaign Proposals & Status Tracker
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {enquiries.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live tracking of your submissions. DSK TaskMarketer administrators coordinate directly with you.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedPartnerCategory(undefined);
              setShowAIAssistant(true);
            }}
            className="self-start sm:self-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Submit Another Enquiry</span>
          </button>
        </div>

        {loadingEnquiries ? (
          <div className="text-center py-10 text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading your campaign enquiries...
          </div>
        ) : enquiries.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No campaign enquiries submitted yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Use the AI Assistant above or select a business category to submit your requirements. Our administrators will review and build your customized performance campaign.
            </p>
            <button
              onClick={() => {
                setSelectedPartnerCategory(undefined);
                setShowAIAssistant(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Start First Enquiry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {enquiries.map(enq => {
              const statusMeta = getStatusMeta(enq.status);
              return (
                <div
                  key={enq.id}
                  className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {enq.businessName || enq.campaignName || enq.companyName}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {enq.partnerType?.replace('_', ' ') || enq.enquiryType}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.badge}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Submitted: {new Date(enq.createdAt).toLocaleString()} • Enquiry ID: {enq.id}
                      </p>
                    </div>

                    {enq.convertedTaskId && (
                      <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-3 py-1 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Live Task Active: {enq.convertedTaskId}
                      </span>
                    )}
                  </div>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Target Goal / Action:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {enq.desiredResult || enq.productService || 'User Acquisition'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Target Volume:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {enq.expectedVolume || enq.targetCompletions || 100} users
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Reward per Action:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        ₹{enq.rewardAmount || 50}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Tracking Status:</span>
                      {enq.trackingUrl ? (
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                          Link Configured
                        </span>
                      ) : (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          Arranged by Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Summary */}
                  {enq.aiSummary && (
                    <div className="text-[11px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 p-2.5 rounded-xl text-emerald-900 dark:text-emerald-200">
                      <span className="font-bold">Summary: </span>
                      <span>{enq.aiSummary}</span>
                    </div>
                  )}

                  {/* Admin feedback / Note if any */}
                  {enq.adminNotes && (
                    <div className="text-[11px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-xl text-amber-900 dark:text-amber-200">
                      <span className="font-bold">Admin Message: </span>
                      <span>{enq.adminNotes}</span>
                    </div>
                  )}

                  {/* Explanatory next step */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>{statusMeta.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STAGE 3: Active Campaigns Performance (If Live) */}
      {myCampaigns.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Live Campaign Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance metrics for campaigns launched by DSK TaskMarketer administrators.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {totalVerifiedActions} Verified Actions Completed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCampaigns.map(c => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {c.title}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    c.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Target Progress</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {c.completionsCount} / {c.targetCompletions || 100} completions
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((c.completionsCount / (c.targetCompletions || 100)) * 100))}%`
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                  <span>Payout per action: ₹{c.rewardAmount}</span>
                  <span className="font-semibold text-emerald-600">Admin Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Guarantee Banner */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-slate-700 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">100% Genuine Human Verification: </span>
            Every user submission is audited by DSK TaskMarketer administrators. No bots, fake clicks, or fraudulent leads.
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedPartnerCategory(undefined);
            setShowAIAssistant(true);
          }}
          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs shrink-0 cursor-pointer"
        >
          Discuss New Campaign
        </button>
      </div>
    </div>
  );
};
