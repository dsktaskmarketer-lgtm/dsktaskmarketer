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

interface PublicReferViewProps {
  settings: PlatformSettings;
  onNavigate: (view: string) => void;
}

export const PublicReferView: React.FC<PublicReferViewProps> = ({ settings, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          Community Growth
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Refer Friends & Earn Verified Rewards
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Invite friends to complete verified financial tasks on DSK TaskMarketer. Earn ₹{settings.referralRewardAmount} when your referred friend completes their first verified task.
        </p>
      </div>

      {/* Hero Banner Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 text-white p-8 sm:p-12 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
          <Gift className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black">
          ₹{settings.referralRewardAmount} Per Qualifying Referral
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          {settings.referralQualifyingCondition}. Both you and your friend benefit from transparent reward tracking.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('register')}
            className="px-7 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-2"
          >
            <span>Register & Get Your Referral Code</span>
            <ArrowRight className="w-4 h-4" />
          </button>
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
