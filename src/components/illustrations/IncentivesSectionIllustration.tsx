import React from 'react';
import { Award, Trophy, Sparkles, Gift } from 'lucide-react';
import incentivesCutoutImg from '../../assets/images/dsk_incentive_duo_transparent.png';
import { FloatingCoin3D, FloatingGem3D } from '../ThreeDDecorations';

interface IncentivesSectionIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IncentivesSectionIllustration: React.FC<IncentivesSectionIllustrationProps> = ({
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
      {/* 3D Volumetric Glow in Golden Yellow & Blue */}
      <div className="absolute -inset-6 bg-radial from-amber-400/35 via-yellow-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating 3D Coins around Monthly Incentives Character */}
      <div className="absolute -top-3 -right-2 sm:-right-4 z-30 pointer-events-none">
        <FloatingCoin3D size={42} delay="0.5s" tilt={20} />
      </div>
      <div className="absolute bottom-3 -left-2 sm:-left-4 z-30 pointer-events-none">
        <FloatingCoin3D size={36} delay="1.8s" tilt={-15} />
      </div>
      <div className="absolute top-1/3 -left-3 z-30 pointer-events-none">
        <FloatingGem3D color="gold" size={28} delay="1s" />
      </div>

      {/* Main Integrated Container with Free-Standing Transparent Cutout (NO RECTANGULAR BOX) */}
      <div className={`relative w-full ${maxW} overflow-visible p-1`}>
        
        {/* Ground Pedestal Shadow */}
        <div 
          className="absolute -bottom-2 inset-x-8 h-8 bg-amber-950/60 rounded-[100%] blur-md pointer-events-none" 
          style={{ transform: 'rotateX(75deg)' }}
        />

        <div className="relative w-full overflow-visible [mask-image:linear-gradient(to_bottom,black_88%,transparent_100%)]">
          <img
            src={incentivesCutoutImg}
            alt="DSK TaskMarketer Monthly Incentives Ambassadors"
            className="w-full h-auto object-contain filter drop-shadow-[0_12px_28px_rgba(245,158,11,0.4)] drop-shadow-[0_4px_16px_rgba(255,196,0,0.3)] transform hover:scale-[1.02] transition-transform duration-600 ease-out"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>

        {/* Floating Badges */}
        <div className="absolute -top-3 right-1 sm:right-2 z-30 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-3 py-1.5 rounded-xl sm:rounded-2xl border-2 border-white shadow-[0_10px_25px_rgba(245,158,11,0.4)] whitespace-nowrap">
            <Trophy className="w-3.5 h-3.5 text-slate-950 fill-amber-950/30 shrink-0" />
            <span className="text-[10px] sm:text-xs font-black tracking-wide">Monthly Rewards Pool</span>
          </div>
        </div>

        <div className="absolute -bottom-3 left-1 sm:left-2 z-30 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/95 text-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-lg whitespace-nowrap">
            <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
              <Gift className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <div className="text-left">
              <p className="text-[9px] sm:text-xs font-black text-white leading-tight">
                Extra Cash Bonuses
              </p>
              <p className="text-[8px] sm:text-[10px] font-bold text-amber-400">
                Tier 1, 2 & 3 Plans
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
