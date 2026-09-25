import React from 'react';
import { Share2, Heart, Zap, Sparkles } from 'lucide-react';
import heroDuoCutout from '../../assets/images/dsk_ref_hero_duo_transparent.png';
import { FloatingCoin3D } from '../ThreeDDecorations';

interface DskRefHeroIllustrationProps {
  className?: string;
}

export const DskRefHeroIllustration: React.FC<DskRefHeroIllustrationProps> = ({
  className = ''
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none w-full overflow-visible ${className}`}>
      
      {/* ========================================================
          COMBINED HERO GRAPHIC GROUP (Single Visual Entity)
          Character Cutout + Attached Floating Words, Badges & Coins
          Scale perfectly across Mobile, Tablet, and Desktop
          ======================================================== */}
      <div className="relative w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[390px] md:max-w-[440px] lg:max-w-[500px] mx-auto select-none overflow-visible">
        
        {/* Ambient Stage Glows centered directly behind characters */}
        <div className="absolute inset-0 bg-radial from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-xl sm:blur-2xl pointer-events-none transform scale-105" />
        <div className="absolute top-1/4 -right-2 sm:-right-4 w-24 sm:w-40 h-24 sm:h-40 bg-yellow-400/15 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-2 sm:-left-4 w-24 sm:w-40 h-24 sm:h-40 bg-red-500/15 rounded-full blur-xl pointer-events-none" />

        {/* Soft Ground Shadow */}
        <div 
          className="absolute -bottom-1 sm:-bottom-2 inset-x-6 sm:inset-x-8 h-4 sm:h-8 bg-slate-900/30 dark:bg-[#030B1A]/90 rounded-[100%] blur-xs sm:blur-md pointer-events-none" 
          style={{ transform: 'rotateX(75deg)' }}
        />

        {/* Main Characters Image Cutout */}
        <div className="relative w-full overflow-visible">
          <img
            src={heroDuoCutout}
            alt="DSK TaskMarketer Hero Characters - Boy in Yellow Hoodie and Girl in Red Jacket"
            className="w-full h-auto object-contain filter drop-shadow-[0_6px_16px_rgba(18,100,255,0.2)] sm:drop-shadow-[0_12px_28px_rgba(18,100,255,0.22)] drop-shadow-[0_2px_8px_rgba(255,196,0,0.15)] sm:drop-shadow-[0_4px_12px_rgba(255,196,0,0.18)] transform hover:scale-[1.015] transition-transform duration-500 ease-out select-none pointer-events-none"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>

        {/* ========================================================
            ATTACHED FLOATING WORDS & BADGES
            Proportionally scaled for Mobile, Tablet, and Desktop
            Positioned in whitespace, never overlapping character faces
            ======================================================== */}

        {/* 1. Red Speech Bubble Badge: "Small Tasks • Big Rewards!" with Crown (Top-Right above girl's shoulder) */}
        <div className="absolute top-0.5 sm:top-1.5 md:top-2 -right-1 sm:right-0.5 md:right-1 z-30 pointer-events-none animate-[bounce_4s_ease-in-out_infinite]">
          <div className="relative bg-gradient-to-br from-[#FF1744] via-[#E50914] to-[#B70000] text-white px-1.5 py-0.5 xs:px-2 xs:py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 lg:px-3.5 lg:py-1.5 rounded-lg xs:rounded-xl sm:rounded-2xl shadow-xs sm:shadow-sm md:shadow-md border sm:border-2 border-white/70 text-center select-none">
            {/* Gold Crown */}
            <span className="absolute -top-2 xs:-top-2.5 sm:-top-3 md:-top-3.5 right-1 sm:right-1.5 text-yellow-300 text-[8px] xs:text-[10px] sm:text-xs md:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">👑</span>
            <p className="text-[6px] xs:text-[7.5px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-black leading-tight tracking-wide drop-shadow-xs">
              Small Tasks
            </p>
            <div className="flex items-center justify-center gap-0.5 text-yellow-300 text-[5.5px] xs:text-[6.5px] sm:text-[8px] md:text-[8.5px] lg:text-[9px] font-black">
              <span>✦</span>
              <span className="text-white">Big Rewards!</span>
            </div>
            {/* Speech bubble pointer tail */}
            <div className="absolute -bottom-1 sm:-bottom-1.5 left-2 sm:left-3 w-1.5 sm:w-3 h-1.5 sm:h-3 bg-[#B70000] rotate-45 border-r border-b sm:border-r-2 sm:border-b-2 border-white/70" />
          </div>
        </div>

        {/* 2. Blue Floating Word Badge: "Work Smart • Earn Fast" (Top-Left above boy's shoulder) */}
        <div className="absolute top-1 xs:top-1.5 sm:top-3 md:top-4 left-0.5 sm:left-1.5 md:left-3 z-30 pointer-events-none animate-[pulse_4s_ease-in-out_infinite]">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-1.5 py-0.5 xs:px-2 xs:py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 rounded-md xs:rounded-lg sm:rounded-xl shadow-xs sm:shadow-sm md:shadow-md border sm:border-2 border-blue-300/80 text-left select-none flex items-center gap-1 sm:gap-1.5 backdrop-blur-sm">
            <Zap className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-yellow-300 fill-yellow-300 shrink-0" />
            <div className="leading-tight">
              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] md:text-[8.5px] lg:text-[9px] font-black tracking-wider uppercase text-yellow-300 block">Daily Cash</span>
              <span className="text-[6px] xs:text-[7.5px] sm:text-[9px] md:text-[9.5px] lg:text-[10px] font-bold text-white block">Work & Earn!</span>
            </div>
          </div>
        </div>

        {/* 3. Glowing Blue Share Icon Badge (Mid-Left near boy's arm) */}
        <div className="absolute top-1/2 -left-1.5 sm:-left-2 md:-left-3 z-30 pointer-events-none animate-[pulse_3s_ease-in-out_infinite]">
          <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-[0_0_12px_rgba(18,100,255,0.4)] sm:shadow-[0_0_20px_rgba(18,100,255,0.6)] border sm:border-2 border-blue-200/90">
            <Share2 className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-white fill-white/10" />
          </div>
        </div>

        {/* 4. Glowing Pink Heart Icon Badge (Mid-Right near girl's arm) */}
        <div className="absolute top-[42%] -right-1.5 sm:-right-2 md:-right-3 z-30 pointer-events-none animate-[bounce_5s_ease-in-out_infinite]">
          <div className="w-4.5 h-4.5 xs:w-5.5 xs:h-5.5 sm:w-7 sm:h-7 md:w-7.5 md:h-7.5 lg:w-8 lg:h-8 rounded-md xs:rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.4)] sm:shadow-[0_0_18px_rgba(244,63,94,0.6)] border sm:border-2 border-pink-200/90 rotate-6">
            <Heart className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-white fill-white" />
          </div>
        </div>

        {/* 5. Floating Trust / Fast Payout Pill (Bottom-Left) */}
        <div className="absolute bottom-1.5 xs:bottom-2 sm:bottom-3 md:bottom-4 lg:bottom-5 left-1 sm:left-2 md:left-3 lg:left-4 z-30 pointer-events-none">
          <div className="inline-flex items-center gap-0.5 sm:gap-1.5 px-1.5 py-0.5 xs:px-2 xs:py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 rounded-full bg-slate-900/90 dark:bg-slate-950/90 text-white text-[5.5px] xs:text-[7px] sm:text-[8.5px] md:text-[9.5px] lg:text-[10px] font-black border border-yellow-400/50 shadow-xs sm:shadow-md backdrop-blur-md">
            <Sparkles className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 text-yellow-400 shrink-0" />
            <span>100% Genuine & Instant</span>
          </div>
        </div>

        {/* ========================================================
            ORBITING 3D GOLD ₹ COINS
            Scaled with hardware-accelerated transforms for perfect proportions
            ======================================================== */}
        {/* Coin 1: Top-Left */}
        <div className="absolute top-[18%] left-[2%] z-20 pointer-events-none scale-50 xs:scale-65 sm:scale-80 md:scale-90 lg:scale-100 origin-center">
          <FloatingCoin3D size={34} delay="0.2s" tilt={16} />
        </div>
        {/* Coin 2: Mid-Left */}
        <div className="absolute top-[62%] -left-[3%] z-20 pointer-events-none scale-50 xs:scale-65 sm:scale-80 md:scale-90 lg:scale-100 origin-center">
          <FloatingCoin3D size={30} delay="1.4s" tilt={-18} />
        </div>
        {/* Coin 3: Bottom-Left */}
        <div className="absolute -bottom-1 left-[20%] z-20 pointer-events-none scale-50 xs:scale-65 sm:scale-80 md:scale-90 lg:scale-100 origin-center">
          <FloatingCoin3D size={40} delay="2.1s" tilt={12} />
        </div>
        {/* Coin 4: Top-Right */}
        <div className="absolute top-[28%] -right-[2%] z-20 pointer-events-none scale-50 xs:scale-65 sm:scale-80 md:scale-90 lg:scale-100 origin-center">
          <FloatingCoin3D size={32} delay="0.8s" tilt={-22} />
        </div>
        {/* Coin 5: Bottom-Right */}
        <div className="absolute bottom-[4%] -right-[3%] z-20 pointer-events-none scale-50 xs:scale-65 sm:scale-80 md:scale-90 lg:scale-100 origin-center">
          <FloatingCoin3D size={36} delay="1.8s" tilt={15} />
        </div>

      </div>

    </div>
  );
};
