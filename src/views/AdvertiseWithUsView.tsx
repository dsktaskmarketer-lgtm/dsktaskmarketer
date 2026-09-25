import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck,
  Building2,
  Users,
  Store,
  Smartphone,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { CampaignEnquiry, PartnerType } from '../types';
import { CampaignEnquiryAIAssistant } from '../components/campaign/CampaignEnquiryAIAssistant';

interface AdvertiseWithUsViewProps {
  onNavigateHome: () => void;
}

export const AdvertiseWithUsView: React.FC<AdvertiseWithUsViewProps> = ({ onNavigateHome }) => {
  const [selectedCategory, setSelectedCategory] = useState<PartnerType | undefined>(undefined);

  return (
    <div className="w-full px-4 md:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <Briefcase className="w-3.5 h-3.5" />
          Partnerships & Campaign Promotion
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Partner With DSK TaskMarketer
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Whether you are a <strong>Company, Creator, Local Store, Agency, App Owner, or Service Business</strong>, our platform delivers genuine user actions, leads, store footfalls, and verified engagement across India.
        </p>
      </div>

      {/* Informational Policy Banner */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-white">Admin-Managed & Verified Quality: </span>
          All campaign proposals submitted through our AI Assistant are reviewed by our platform administrators. We verify your requirements, align payout structures, configure tracking mechanisms, and launch tasks cleanly.
        </div>
      </div>

      {/* Dynamic AI Assistant Component */}
      <CampaignEnquiryAIAssistant
        initialPartnerType={selectedCategory}
        onCancel={onNavigateHome}
        onSubmitted={(_enquiry: CampaignEnquiry) => {
          // Handled within the assistant with dedicated success message & reference ID
        }}
      />

    </div>
  );
};
