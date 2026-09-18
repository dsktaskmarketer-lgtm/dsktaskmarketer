import React, { useState } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Gift, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { User, ReferralItem, PlatformSettings } from '../../types';

interface UserReferralsViewProps {
  user: User;
  referrals: ReferralItem[];
  settings: PlatformSettings;
}

export const UserReferralsView: React.FC<UserReferralsViewProps> = ({
  user,
  referrals = [],
  settings,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const safeReferrals = Array.isArray(referrals) ? referrals : [];
  const referralLink = `${window.location.origin}?ref=${user.referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Complete verified financial tasks and earn verified rewards on DSK TaskMarketer! Join with my referral code ${user.referralCode}: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `Complete verified financial tasks and earn verified rewards on DSK TaskMarketer! Join with my referral code ${user.referralCode}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const totalReferralRewards = safeReferrals
    .filter(r => r.rewardStatus === 'rewarded')
    .reduce((acc, curr) => acc + curr.rewardAmount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rewarded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Reward Credited
          </span>
        );
      case 'task_completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Under Verification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            Registered (Task Pending)
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block mb-1">
          Growth Program
        </span>
        <h1 className="text-2xl font-black text-slate-900">Refer & Earn</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Invite friends to DSK TaskMarketer and earn ₹{settings.referralRewardAmount} when they complete their first verified task.
        </p>
      </div>

      {/* Share Box & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Share Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Your Exclusive Referral Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">Share with your contacts via link or social messengers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Referral Code Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your Referral Code</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-mono font-black text-slate-900">{user.referralCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Referral Link Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your Referral Link</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-700 truncate">{referralLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <span className="text-xs font-bold text-slate-700">Quick Share:</span>
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              Share on WhatsApp
            </button>
            <button
              onClick={handleShareTelegram}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              Share on Telegram
            </button>
          </div>
        </div>

        {/* Stats Column */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-md inline-block mb-3">
              Referral Performance
            </span>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400">Total Referred Friends</span>
                <p className="text-3xl font-black text-white">{safeReferrals.length}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Total Referral Earnings</span>
                <p className="text-3xl font-black text-emerald-400">₹{totalReferralRewards}</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
            Bonus is credited upon the referred friend's first verified and approved task.
          </p>
        </div>
      </div>

      {/* Anti-Fraud Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Referral Fairness Policy:</strong> Multiple accounts originating from identical devices, duplicate phone numbers, or fabricated submissions are strictly forbidden and will result in permanent disqualification.
        </p>
      </div>

      {/* Referred Friends Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Referred Members ({safeReferrals.length})</h3>

        {safeReferrals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
            You haven't referred anyone yet. Share your code to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Referred User</th>
                  <th className="pb-3 pr-4">Registered On</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Referral Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeReferrals.map(ref => (
                  <tr key={ref.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-900">{ref.referredUserName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">User ID: {ref.referredUserId}</p>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500">
                      {new Date(ref.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 pr-4">
                      {getStatusBadge(ref.rewardStatus)}
                    </td>
                    <td className="py-3.5 text-right font-bold text-emerald-800">
                      {ref.rewardStatus === 'rewarded' ? `+₹${ref.rewardAmount}` : `Pending (₹${ref.rewardAmount})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
