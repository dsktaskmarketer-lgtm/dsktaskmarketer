import React from 'react';
import { Sparkles, CheckCircle2, Award, Zap, ShieldCheck } from 'lucide-react';
import duoCutoutImg from '../../assets/images/dsk_hero_duo_transparent.png';
import { FloatingCoin3D, FloatingGem3D } from '../ThreeDDecorations';

interface DskDuoHeroIllustrationProps {
  className?: string;
  badgeText?: string;
}

export const DskDuoHeroIllustration: React.FC<DskDuoHeroIllustrationProps> = ({
  className = '',
  badgeText = 'More Tasks, More Rewards! ✨'
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none w-full overflow-visible ${className}`}>
      {/* 3D Volumetric Ambient Stage Glow - Integrated directly into hero background */}
      <div className="absolute -inset-4 sm:-inset-10 bg-radial from-blue-600/30 via-indigo-600/15 to-transparent rounded-full blur-3xl pointer-events-none transform scale-110" />
      <div className="absolute top-1/4 -right-6 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-6 w-48 h-48 bg-red-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Floating 3D Coins orbiting around the adult anime duo */}
      <div className="absolute -top-4 -left-3 sm:-left-8 z-30 pointer-events-none">
        <FloatingCoin3D size={44} delay="0s" tilt={15} />
      </div>
      <div className="absolute top-1/2 -right-4 sm:-right-10 z-30 pointer-events-none">
        <FloatingCoin3D size={50} delay="1.2s" tilt={-20} />
      </div>
      <div className="absolute -bottom-3 left-2 sm:left-6 z-30 pointer-events-none">
        <FloatingCoin3D size={38} delay="2.4s" tilt={10} />
      </div>

      {/* Floating 3D Gems & Sparkles */}
      <div className="absolute top-6 -right-2 sm:-right-5 z-30 pointer-events-none">
        <FloatingGem3D color="gold" size={28} delay="0.8s" />
      </div>
      <div className="absolute bottom-14 -left-3 sm:-left-6 z-30 pointer-events-none">
        <FloatingGem3D color="blue" size={26} delay="1.6s" />
      </div>

      {/* Main Cut-Out Character Stage (NO RECTANGULAR BOX, NO WHITE BORDER, NO CARD PANEL) */}
      <div className="relative w-full max-w-[340px] xs:max-w-[400px] sm:max-w-[480px] overflow-visible">
        
        {/* Soft 3D Ground Shadow beneath feet */}
        <div 
          className="absolute -bottom-2 inset-x-8 h-8 bg-[#030B1A]/80 rounded-[100%] blur-md pointer-events-none" 
          style={{ transform: 'rotateX(75deg)' }}
        />

        {/* 
          Adult Anime Boy & Girl Transparent Cutout 
          Completely free-standing silhouette with zero rectangular box or border.
          Soft ambient drop-shadow + bottom feathering melts naturally into continuous hero section.
        */}
        <div className="relative w-full overflow-visible [mask-image:linear-gradient(to_bottom,black_88%,transparent_100%)]">
          <img
            src={duoCutoutImg}
            alt="DSK TaskMarketer Ambassadors - Adult Anime Boy & Girl Duo"
            className="w-full h-auto object-contain filter drop-shadow-[0_12px_32px_rgba(18,100,255,0.45)] drop-shadow-[0_4px_16px_rgba(255,196,0,0.25)] transform hover:scale-[1.02] transition-transform duration-500 ease-out select-none"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>

        {/* ================= FLOATING 3D BRAND BADGES (OVERLAPPING GRACEFULLY) ================= */}

        {/* Top-Right Floating Banner: More Tasks, More Rewards! */}
        <div className="absolute -top-3.5 right-0 sm:right-2 z-30 pointer-events-none animate-[bounce_4s_ease-in-out_infinite]">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-yellow-300/90 shadow-[0_10px_25px_rgba(18,100,255,0.5)] whitespace-nowrap backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 animate-pulse fill-yellow-300/40 shrink-0" />
            <span className="text-[10px] sm:text-xs font-black tracking-wide">{badgeText}</span>
          </div>
        </div>

        {/* Floating Left Badge: Verified Tasks */}
        <div className="absolute bottom-12 sm:bottom-16 -left-3 sm:-left-6 z-30 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2.5 bg-[#07152F]/90 text-white backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-blue-500/50 shadow-[0_10px_25px_rgba(18,100,255,0.35)] whitespace-nowrap">
            <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg sm:rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[10px] sm:text-xs font-black text-white leading-tight">
                Verified Tasks
              </p>
              <p className="text-[8px] sm:text-[10px] font-bold text-blue-400">
                100% Genuine
              </p>
            </div>
          </div>
        </div>

        {/* Floating Bottom Badge: 3-Plan Monthly Incentives */}
        <div className="absolute -bottom-3 sm:-bottom-4 right-1 sm:right-4 z-30 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-white shadow-[0_12px_30px_rgba(245,158,11,0.4)] whitespace-nowrap">
            <Award className="w-4 h-4 text-slate-950 fill-slate-950/20 shrink-0" />
            <div className="text-left">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-900/80 leading-none">
                Monthly Bonus
              </p>
              <p className="text-[9px] sm:text-xs font-black text-slate-950 leading-tight mt-0.5">
                Up to ₹1,000+ Extra
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
