import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, TrendingUp, Smartphone } from 'lucide-react';
import heroAnimeImg from '../../assets/images/hero_anime_character_1790044120209.jpg';

interface HeroCharacterIllustrationProps {
  className?: string;
}

export const HeroCharacterIllustration: React.FC<HeroCharacterIllustrationProps> = ({
  className = ''
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Volumetric Glow in DSK Brand Colors (Blue, Yellow, Red) */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/25 via-yellow-400/20 to-red-600/20 rounded-3xl blur-3xl transform scale-95 pointer-events-none" />
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main 3D Anime Character Composition Container */}
      <div className="relative w-full max-w-[440px] sm:max-w-[480px] rounded-3xl overflow-visible p-2 sm:p-3">
        {/* The 3D Anime Character Artwork with Smooth Framing & Soft Shadows */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/25 border-2 border-white/80 dark:border-slate-700/60 bg-gradient-to-b from-blue-50/50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <img
            src={heroAnimeImg}
            alt="DSK TaskMarketer 3D Anime Hero Character"
            className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
            loading="eager"
          />

          {/* Subtle Bottom Vignette Gradient for Depth */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-950/40 via-blue-950/10 to-transparent pointer-events-none" />
        </div>

        {/* ================= FLOATING 3D BRAND BADGES ================= */}

        {/* Top-Right Floating Badge: Instant Rewards */}
        <div className="absolute -top-3 -right-2 sm:-right-4 z-20 animate-bounce [animation-duration:3.5s] pointer-events-none">
          <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-yellow-300 dark:border-yellow-600/60 shadow-xl shadow-yellow-500/20 text-slate-900 dark:text-white">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-950 fill-amber-950/20" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 leading-none">
                Instant Rewards
              </p>
              <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                ₹50 - ₹400/Task
              </p>
            </div>
          </div>
        </div>

        {/* Floating Left Badge: Verified Tasks */}
        <div className="absolute top-1/3 -left-3 sm:-left-6 z-20 pointer-events-none">
          <div className="flex items-center gap-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-600/20">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-900 dark:text-white">
                Verified Partners
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                100% Genuine Tasks
              </p>
            </div>
          </div>
        </div>

        {/* Bottom-Right Floating Badge: Fast Payouts */}
        <div className="absolute -bottom-3 -right-2 sm:-right-4 z-20 pointer-events-none">
          <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-2xl shadow-xl shadow-red-600/30 border border-red-400/40">
            <ShieldCheck className="w-4 h-4 text-yellow-300" />
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-100 block leading-none">
                Safe & Secure
              </span>
              <span className="text-xs font-black text-white">
                Instant UPI Transfer
              </span>
            </div>
          </div>
        </div>

        {/* Bottom-Left Floating Pill: Growth & Earnings */}
        <div className="absolute -bottom-2 -left-2 sm:-left-4 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-slate-900/90 dark:bg-black/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-[11px] font-black">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">+₹45,000+</span>
            <span className="text-slate-300 text-[10px] font-medium">paid this week</span>
          </div>
        </div>

      </div>
    </div>
  );
};
