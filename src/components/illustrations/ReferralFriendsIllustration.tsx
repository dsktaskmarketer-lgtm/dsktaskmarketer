import React from 'react';
import { Gift, Share2, Sparkles, Users } from 'lucide-react';
import referralCutoutImg from '../../assets/images/dsk_referral_duo_transparent.png';
import { FloatingCoin3D, FloatingGem3D } from '../ThreeDDecorations';

interface ReferralFriendsIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ReferralFriendsIllustration: React.FC<ReferralFriendsIllustrationProps> = ({
  className = '',
  size = 'md'
}) => {
  const maxW = {
    sm: 'max-w-[260px]',
    md: 'max-w-[420px]',
    lg: 'max-w-[520px]'
  }[size];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none overflow-visible ${className}`}>
      {/* Background Volumetric Violet & Gold Glow */}
      <div className="absolute -inset-6 bg-radial from-violet-600/30 via-indigo-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating 3D Coins around Referral Duo */}
      <div className="absolute -top-3 -right-2 sm:-right-4 z-30 pointer-events-none">
        <FloatingCoin3D size={42} delay="0.2s" tilt={18} />
      </div>
      <div className="absolute bottom-2 -left-2 sm:-left-4 z-30 pointer-events-none">
        <FloatingCoin3D size={36} delay="1.5s" tilt={-12} />
      </div>
      <div className="absolute top-1/2 -right-3 z-30 pointer-events-none">
        <FloatingGem3D color="violet" size={28} delay="0.9s" />
      </div>

      {/* Main 3D Composition Container with Free-Standing Transparent Cutout (NO RECTANGULAR BOX) */}
      <div className={`relative w-full ${maxW} overflow-visible p-1`}>
        
        {/* Soft Radial Shadow Pedestal */}
        <div 
          className="absolute -bottom-2 inset-x-8 h-8 bg-violet-950/60 rounded-[100%] blur-md pointer-events-none" 
          style={{ transform: 'rotateX(75deg)' }}
        />

        {/* Transparent Anime Boy + Girl Sharing Referrals */}
        <div className="relative w-full overflow-visible [mask-image:linear-gradient(to_bottom,black_88%,transparent_100%)]">
          <img
            src={referralCutoutImg}
            alt="DSK TaskMarketer Refer & Earn Ambassadors"
            className="w-full h-auto object-contain filter drop-shadow-[0_12px_28px_rgba(124,58,237,0.4)] drop-shadow-[0_4px_16px_rgba(255,196,0,0.25)] transform hover:scale-[1.02] transition-transform duration-600 ease-out"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>

        {/* ================= FLOATING 3D REWARD BADGES ================= */}

        {/* Top-Right: ₹50 Per Referral Golden Callout */}
        <div className="absolute -top-3.5 right-0 sm:right-2 z-30 pointer-events-none animate-[bounce_3.5s_ease-in-out_infinite]">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-[0_10px_25px_rgba(245,158,11,0.4)] border-2 border-white whitespace-nowrap">
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 shrink-0" />
            <div className="text-left">
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-900 block leading-none">
                Bonus
              </span>
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-950 leading-tight">
                ₹50 Per Referral
              </span>
            </div>
          </div>
        </div>

        {/* Floating Bottom: Instant Wallet Credit */}
        <div className="absolute -bottom-3 left-2 sm:left-4 z-30 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-[#07152F]/95 text-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-violet-500/40 shadow-lg text-[9px] sm:text-xs font-black whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span>Invite Friends & Earn</span>
          </div>
        </div>

      </div>
    </div>
  );
};
