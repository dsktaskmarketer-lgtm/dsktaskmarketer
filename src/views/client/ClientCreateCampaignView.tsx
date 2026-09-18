import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle,
  Link,
  Coins,
  FileText
} from 'lucide-react';
import { Campaign, TaskCategory, User } from '../../types';

interface ClientCreateCampaignViewProps {
  user: User;
  categories: TaskCategory[];
  onCreateCampaign: (campaignData: Partial<Campaign>) => Promise<void>;
  onCancel: () => void;
}

export const ClientCreateCampaignView: React.FC<ClientCreateCampaignViewProps> = ({
  user,
  categories,
  onCreateCampaign,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [partnerName, setPartnerName] = useState(user.name || '');
  const [rewardAmount, setRewardAmount] = useState(250);
  const [targetCompletions, setTargetCompletions] = useState(100);
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [stepsText, setStepsText] = useState('Click on the referral link\nComplete registration & KYC\nSubmit account ID or confirmation code');
  const [proofText, setProofText] = useState('Screenshot of successful application\nApplication ID / Reference Number');
  const [terms, setTerms] = useState('Reward is credited once the partner reconciles verified account creation.');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !affiliateUrl.trim() || !description.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    if (rewardAmount <= 0) {
      setError("Reward amount must be greater than 0.");
      return;
    }

    try {
      setLoading(true);
      await onCreateCampaign({
        clientId: user.id,
        title: title.trim(),
        categoryId: categoryId || categories[0]?.id,
        partnerName: partnerName.trim(),
        rewardAmount: Number(rewardAmount),
        currency: 'INR',
        affiliateUrl: affiliateUrl.trim(),
        description: description.trim(),
        eligibility: eligibility.trim(),
        steps: stepsText.split('\n').map(s => s.trim()).filter(Boolean),
        proofRequirements: proofText.split('\n').map(p => p.trim()).filter(Boolean),
        terms: terms.trim(),
        targetCompletions: Number(targetCompletions),
        status: 'pending_approval'
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 animate-in fade-in duration-200">
        <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Campaign Submitted!</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Your campaign has been submitted for administrative compliance review. Once approved, it will be published to the active tasks feed.
        </p>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          View Campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Create New Campaign</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit a performance marketing offer for verification and publishing
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Campaign Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Open Savings Account with Zero Balance"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Brand / Partner Name *
              </label>
              <input
                type="text"
                required
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. HDFC Bank, Upstox"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Reward Per User (₹ INR) *
              </label>
              <input
                type="number"
                min="10"
                step="10"
                required
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Target Completions Count
              </label>
              <input
                type="number"
                min="1"
                value={targetCompletions}
                onChange={(e) => setTargetCompletions(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Affiliate / Tracking Destination URL *
            </label>
            <input
              type="url"
              required
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              placeholder="https://track.partner.com/click?offer_id=123"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Description & Highlights *
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the offer benefits to the user..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Eligibility Criteria
            </label>
            <input
              type="text"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              placeholder="e.g. Indian residents age 21+ with Pan Card and Aadhaar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Instructions / Steps (One per line)
            </label>
            <textarea
              rows={3}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Required Proofs (One per line)
            </label>
            <textarea
              rows={2}
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
