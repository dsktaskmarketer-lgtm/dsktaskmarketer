import React from 'react';
import { 
  Users, 
  Share2, 
  ShieldAlert, 
  Gift, 
  ArrowRight, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { PlatformSettings } from '../types';
import { ReferralSectionIllustration } from '../components/illustrations';

interface PublicReferViewProps {
  settings: PlatformSettings;
  onNavigate: (view: string) => void;
}

export const PublicReferView: React.FC<PublicReferViewProps> = ({ settings, onNavigate }) => {
  return (
    <div className="w-full px-4 md:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
      {/* Hero Banner Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-10 md:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 border border-purple-500/30 px-3.5 py-1.5 rounded-full inline-block">
              Community Referral Growth
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Refer Friends & Earn <span className="text-yellow-400">₹{settings.referralRewardAmount}</span> Verified Cash Rewards
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Invite friends to complete verified financial tasks on DSK TaskMarketer. Earn ₹{settings.referralRewardAmount} directly into your available balance when your friend completes their first verified action.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('register')}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Register & Get Your Referral Code</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <ReferralSectionIllustration size="md" />
          </div>
        </div>
      </div>

      {/* Referral Lifecycle Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 text-center">
          How Referral Logic Operates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Share Link / Code</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Share your unique referral link or 6-character code via WhatsApp, Telegram, or social media.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Friend Registers & Completes Task</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your friend signs up using your code, selects an eligible financial task, and submits valid proof.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Reward Credited</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upon partner audit confirmation of the friend's task, ₹{settings.referralRewardAmount} is added directly to your Available Balance.
            </p>
          </div>
        </div>
      </div>

      {/* Anti-Abuse & Fraud Protection Rules */}
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Strict Anti-Abuse & Fairness Policy</span>
        </div>
        <ul className="space-y-1.5 text-xs text-rose-800 leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="text-rose-600 font-bold">•</span>
            <span>Self-referrals (referring your own secondary accounts, duplicate phone numbers, or identical payout details) are strictly prohibited.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-rose-600 font-bold">•</span>
            <span>Automated scripts, fraudulent bot accounts, or unauthorized mass spamming will lead to immediate account suspension and reward forfeiture.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-rose-600 font-bold">•</span>
            <span>Referral rewards only unlock once the qualifying action is verified and confirmed by the affiliate partner reconciliation audit.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
