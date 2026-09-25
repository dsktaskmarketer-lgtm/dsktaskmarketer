import React from 'react';
import { Wallet, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import walletRewardAnimeImg from '../../assets/images/wallet_reward_anime_1790044209629.jpg';

interface WalletRewardIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WalletRewardIllustration: React.FC<WalletRewardIllustrationProps> = ({
  className = '',
  size = 'md'
}) => {
  const maxW = {
    sm: 'max-w-[180px]',
    md: 'max-w-[280px]',
    lg: 'max-w-[360px]'
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Volumetric Glow in Royal Blue and Golden Yellow */}
      <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600/25 via-yellow-400/20 to-indigo-600/20 rounded-3xl blur-2xl transform scale-90 pointer-events-none" />

      <div className={`relative w-full ${maxW} rounded-2xl overflow-visible p-1.5`}>
        <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-blue-950/20 border-2 border-white/90 dark:border-slate-700/60 bg-gradient-to-b from-blue-50/50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <img
            src={walletRewardAnimeImg}
            alt="DSK TaskMarketer 3D Anime Wallet Rewards Character"
            className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-300"
            referrerPolicy="no-referrer"
            loading="eager"
          />

          {/* Bottom vignette */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
        </div>

        {/* Floating Top Badge: Instant UPI */}
        <div className="absolute -top-2.5 -right-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-xl shadow-lg shadow-red-600/30 text-[10px] font-black border border-red-400">
            <ShieldCheck className="w-3 h-3 text-yellow-300" />
            <span>Instant UPI</span>
          </div>
        </div>

        {/* Floating Bottom Badge: Fast Payouts */}
        <div className="absolute -bottom-2 -left-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 px-3 py-1 rounded-xl shadow-lg text-[10px] font-black border border-white dark:border-slate-800">
            <Sparkles className="w-3 h-3 text-amber-950" />
            <span>0% Fee Payouts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
