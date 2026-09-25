import React from 'react';
import { Gift, Share2, Users, Sparkles, ArrowRight } from 'lucide-react';
import referralCutoutImg from '../../assets/images/dsk_referral_duo_transparent.png';
import { FloatingCoin3D, FloatingGem3D } from '../ThreeDDecorations';

interface ReferralSectionIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ReferralSectionIllustration: React.FC<ReferralSectionIllustrationProps> = ({
  className = '',
  size = 'md'
}) => {
  const maxW = {
    sm: 'max-w-[280px]',
    md: 'max-w-[440px]',
    lg: 'max-w-[540px]'
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none w-full overflow-visible ${className}`}>
      {/* Volumetric Glow in Purple & Gold */}
      <div className="absolute -inset-6 bg-radial from-violet-600/30 via-amber-400/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating 3D Coins around Referral Duo */}
      <div className="absolute -top-3 -right-2 sm:-right-4 z-30 pointer-events-none">
        <FloatingCoin3D size={40} delay="0.2s" tilt={18} />
      </div>
      <div className="absolute bottom-2 -left-2 sm:-left-4 z-30 pointer-events-none">
        <FloatingCoin3D size={34} delay="1.5s" tilt={-12} />
      </div>

      <div className={`relative w-full ${maxW} overflow-visible p-1`}>
        {/* Soft Radial Shadow Pedestal */}
        <div 
          className="absolute -bottom-2 inset-x-8 h-8 bg-violet-950/60 rounded-[100%] blur-md pointer-events-none" 
          style={{ transform: 'rotateX(75deg)' }}
        />

        {/* Free-Standing Transparent Cutout - No Rectangular Box */}
        <div className="relative w-full overflow-visible [mask-image:linear-gradient(to_bottom,black_88%,transparent_100%)]">
          <img
            src={referralCutoutImg}
            alt="DSK TaskMarketer Referral Program Ambassadors"
            className="w-full h-auto object-contain filter drop-shadow-[0_12px_28px_rgba(124,58,237,0.4)] drop-shadow-[0_4px_16px_rgba(255,196,0,0.25)] transform hover:scale-[1.02] transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>

        {/* Floating Badges */}
        <div className="absolute -top-2.5 sm:-top-3.5 right-1 sm:right-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border-2 border-white shadow-xl shadow-yellow-500/30 whitespace-nowrap">
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-950 shrink-0" />
            <span className="text-[9px] sm:text-xs font-black tracking-wide">₹50 Per Friend</span>
          </div>
        </div>

        <div className="absolute -bottom-2.5 left-2 sm:left-4 z-20 pointer-events-none">
          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-violet-900/90 border border-violet-400/40 text-violet-200 text-[10px] sm:text-xs font-black shadow-lg">
            <Users className="w-3 h-3 text-violet-300" />
            <span>Direct Payout</span>
          </div>
        </div>
      </div>
    </div>
  );
};
