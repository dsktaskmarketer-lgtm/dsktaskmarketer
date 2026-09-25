import React from 'react';
import duoIncentiveImg from '../../assets/images/dsk_incentive_duo_transparent.png';
import { FloatingCoin3D, FloatingGem3D } from '../ThreeDDecorations';
import { Gift, Sparkles, Award } from 'lucide-react';

interface DskDuoGiftIllustrationProps {
  className?: string;
  imgClassName?: string;
}

export const DskDuoGiftIllustration: React.FC<DskDuoGiftIllustrationProps> = ({
  className = '',
  imgClassName = 'w-full h-auto object-contain'
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none overflow-visible w-full ${className}`}>
      {/* 3D Volumetric Amber & Gold Glow */}
      <div className="absolute -inset-6 bg-radial from-amber-400/30 via-yellow-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating 3D Coin & Gem around Incentive Duo */}
      <div className="absolute -top-3 -right-2 sm:-right-4 z-20 pointer-events-none">
        <FloatingCoin3D size={42} delay="0.4s" tilt={22} />
      </div>
      <div className="absolute bottom-2 -left-2 sm:-left-4 z-20 pointer-events-none">
        <FloatingGem3D color="gold" size={28} delay="1.1s" />
      </div>

      {/* Main Integrated Container with Free-Standing Transparent Cutout (NO RECTANGULAR BOX) */}
      <div className="relative w-full max-w-[340px] sm:max-w-[420px] overflow-visible">
        
        {/* Soft Radial Ground Glow */}
        <div 
          className="absolute -bottom-2 inset-x-8 h-8 bg-amber-950/60 rounded-[100%] blur-md pointer-events-none" 
          style={{ transform: 'rotateX(75deg)' }}
        />

        {/* Transparent Anime Boy + Girl Celebrating Incentive Rewards */}
        <div className="relative w-full overflow-visible [mask-image:linear-gradient(to_bottom,black_88%,transparent_100%)]">
          <img
            src={duoIncentiveImg}
            alt="DSK TaskMarketer Monthly Incentive Bonus Ambassadors"
            className={`${imgClassName} filter drop-shadow-[0_12px_28px_rgba(245,158,11,0.4)] drop-shadow-[0_4px_16px_rgba(255,196,0,0.3)] transform hover:scale-105 transition-transform duration-500 ease-out`}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>

        {/* Floating Mini Ribbon Tag */}
        <div className="absolute -bottom-2.5 right-4 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-[10px] shadow-lg shadow-amber-400/30 border border-yellow-200">
            <Gift className="w-3.5 h-3.5 text-slate-950" />
            <span>Monthly Payouts</span>
          </div>
        </div>

      </div>
    </div>
  );
};
