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
import { User, ReferralItem, PlatformSettings, WalletSummary, RewardItem } from '../../types';
import { ReferralFriendsIllustration, ReferralSectionIllustration } from '../../components/illustrations';

interface UserReferralsViewProps {
  user: User;
  referrals: ReferralItem[];
  settings: PlatformSettings;
  wallet?: WalletSummary;
  rewards?: RewardItem[];
}

export const UserReferralsView: React.FC<UserReferralsViewProps> = ({
  user,
  referrals = [],
  settings,
  wallet,
  rewards = [],
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const safeReferrals = Array.isArray(referrals) ? referrals : [];
  const referralLink = `${window.location.origin}?ref=${user.referralCode}`;

  // Derive actual referral earnings strictly from real database records (wallet summary / reward transactions / referrals)
  const actualReferralEarnings = React.useMemo(() => {
    if (wallet && (wallet as any).referralRewards !== undefined && (wallet as any).referralRewards !== null) {
      return Number((wallet as any).referralRewards) || 0;
    }
    if (Array.isArray(rewards) && rewards.length > 0) {
      const rewardSum = rewards
        .filter(r => (r.type === 'referral_reward' || r.type === 'referral_bonus') && (r.status === 'credited' || r.status === 'approved'))
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      if (rewardSum > 0) return rewardSum;
    }
    return safeReferrals
      .filter(r => r.rewardStatus === 'rewarded' || r.status === 'reward_credited')
      .reduce((acc, curr) => acc + (Number(curr.rewardAmount) || 0), 0);
  }, [wallet, rewards, safeReferrals]);

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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-900 border border-yellow-300">
            <CheckCircle2 className="w-3 h-3 text-yellow-600" />
            Reward Credited
          </span>
        );
      case 'task_completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
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
    <div className="w-full px-2.5 sm:px-6 py-3 sm:py-8 space-y-3 sm:space-y-8">
      {/* Header with Refer & Earn Earnings Card & Illustration */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 rounded-xl sm:rounded-3xl p-3 sm:p-8 text-white shadow-xl border border-blue-700/50 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6 items-center relative z-10">
          <div className="md:col-span-8 space-y-1.5 sm:space-y-3">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-yellow-300 bg-white/10 px-2.5 py-0.5 sm:py-1 rounded-full inline-block border border-white/20">
              DSK Referral Network
            </span>
            <h1 className="text-lg sm:text-3xl font-black text-white">
              Refer & Earn <span className="text-yellow-400">₹{settings?.referralRewardAmount ?? 50}</span> Per Friend
            </h1>
            <p className="text-[10px] sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              Invite friends to DSK TaskMarketer. When your referred friend completes their first verified task, you receive ₹{settings?.referralRewardAmount ?? 50} directly into your available balance.
            </p>

            <div className="pt-1 sm:pt-2 flex items-center gap-3">
              <div className="bg-yellow-400 text-slate-950 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 sm:gap-2">
                <Gift className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-950" />
                <span>₹{actualReferralEarnings} Earned So Far</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 hidden md:flex justify-end">
            <ReferralSectionIllustration size="sm" />
          </div>
        </div>
      </div>

      {/* Share Box & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 w-full">
        {/* Share Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl sm:rounded-3xl p-3 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 sm:space-y-5">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">Your Exclusive Referral Details</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Share with your contacts via link or social messengers</p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-4 w-full">
            {/* Referral Code Box */}
            <div className="p-2 sm:p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-1 sm:space-y-2 min-w-0">
              <span className="text-[8px] xs:text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 block truncate">Referral Code</span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                <span className="text-xs xs:text-sm sm:text-xl font-mono font-black text-blue-900 dark:text-white truncate">{user.referralCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] xs:text-[10px] sm:text-xs rounded-lg sm:rounded-xl shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Referral Link Box */}
            <div className="p-2 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1 sm:space-y-2 min-w-0">
              <span className="text-[8px] xs:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">Referral Link</span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                <span className="text-[9px] xs:text-[10px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 truncate w-full">{referralLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-2 sm:px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] xs:text-[10px] sm:text-xs rounded-lg sm:rounded-xl shadow-2xs flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              Share on WhatsApp
            </button>
            <button
              onClick={handleShareTelegram}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              Share on Telegram
            </button>
          </div>
        </div>

        {/* Stats Column */}
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 shadow-md">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-yellow-400 bg-yellow-400/20 border border-yellow-400/30 px-2.5 py-1 rounded-md inline-block mb-3">
              Referral Performance
            </span>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-blue-200">Total Referred Friends</span>
                <p className="text-3xl font-black text-white">{safeReferrals.length}</p>
              </div>
              <div>
                <span className="text-xs text-blue-200">Total Referral Earnings</span>
                <p className="text-3xl font-black text-yellow-400">₹{actualReferralEarnings} Earned</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-blue-200/80 leading-relaxed border-t border-blue-800/80 pt-3">
            Bonus is credited upon the referred friend's first verified and approved task.
          </p>
        </div>
      </div>

      {/* Anti-Fraud Disclaimer */}
      <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 flex items-start gap-3 text-xs text-yellow-950">
        <ShieldAlert className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Referral Fairness Policy:</strong> Multiple accounts originating from identical devices, duplicate phone numbers, or fabricated submissions are strictly forbidden and will result in permanent disqualification.
        </p>
      </div>

      {/* Referred Friends Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900">Referred Members ({safeReferrals.length})</h3>

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
                    <td className="py-3.5 text-right font-black text-blue-700">
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
