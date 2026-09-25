import React from 'react';
import { Wallet, Sparkles, ShieldCheck, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import walletAnimeImg from '../../assets/images/wallet_anime_banner_1790089542638.jpg';

interface WalletSectionIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WalletSectionIllustration: React.FC<WalletSectionIllustrationProps> = ({
  className = '',
  size = 'md'
}) => {
  const maxW = {
    sm: 'max-w-[280px]',
    md: 'max-w-[440px]',
    lg: 'max-w-[580px]'
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none w-full ${className}`}>
      {/* Volumetric Glow in Emerald & Teal */}
      <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-600/30 via-teal-400/25 to-blue-600/20 rounded-3xl blur-3xl transform scale-95 pointer-events-none" />

      <div className={`relative w-full ${maxW} rounded-2xl sm:rounded-3xl overflow-visible p-1.5 sm:p-2`}>
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/20 border-2 border-white/90 dark:border-slate-700/80 bg-gradient-to-b from-emerald-50/50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <img
            src={walletAnimeImg}
            alt="DSK TaskMarketer Wallet & Payouts Banner"
            className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
            loading="eager"
          />

          <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent pointer-events-none" />
        </div>

        {/* Floating Badges */}
        <div className="absolute -top-2.5 sm:-top-3.5 right-1 sm:right-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-2xl border-2 border-red-300 shadow-xl shadow-red-600/30 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 shrink-0" />
            <span className="text-[9px] sm:text-xs font-black tracking-wide">Instant UPI Withdrawals</span>
          </div>
        </div>

        <div className="absolute bottom-10 sm:bottom-12 left-1 sm:-left-3 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xl shadow-emerald-600/20 whitespace-nowrap">
            <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-md sm:rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Wallet className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[9px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                0% Transaction Fee
              </p>
              <p className="text-[7px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Min. ₹200 Threshold
              </p>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-2.5 sm:-bottom-3.5 right-1 sm:right-3 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-2xl border border-white shadow-xl whitespace-nowrap font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-950 shrink-0" />
            <span className="text-[9px] sm:text-xs text-slate-950">Fast 24-48h Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
