import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Campaign, TaskCategory, User, CampaignEnquiry } from '../../types';
import { CampaignEnquiryAIAssistant } from '../../components/campaign/CampaignEnquiryAIAssistant';

interface ClientCreateCampaignViewProps {
  user: User;
  categories: TaskCategory[];
  onCreateCampaign?: (campaignData: Partial<Campaign>) => Promise<void>;
  onCancel: () => void;
}

export const ClientCreateCampaignView: React.FC<ClientCreateCampaignViewProps> = ({
  user,
  categories,
  onCancel
}) => {
  return (
    <div className="w-full px-4 md:px-6 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </button>
      </div>

      {/* AI-Powered Campaign Enquiry Assistant */}
      <CampaignEnquiryAIAssistant
        initialType="advertiser"
        userId={user.id}
        userEmail={user.email}
        userName={user.name}
        categories={categories}
        onCancel={onCancel}
        onSubmitted={(_enquiry: CampaignEnquiry) => {
          // Handled within assistant with the mandated confirmation message
        }}
      />
    </div>
  );
};
