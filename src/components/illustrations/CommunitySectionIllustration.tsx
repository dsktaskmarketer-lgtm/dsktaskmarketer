import React from 'react';
import { MessageSquare, Headset, Shield, Heart, Sparkles } from 'lucide-react';
import communityAnimeImg from '../../assets/images/community_anime_banner_1790089559803.jpg';

interface CommunitySectionIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CommunitySectionIllustration: React.FC<CommunitySectionIllustrationProps> = ({
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
      {/* Volumetric Glow in Violet & Soft Cyan */}
      <div className="absolute -inset-3 bg-gradient-to-tr from-violet-600/30 via-indigo-400/25 to-cyan-500/20 rounded-3xl blur-3xl transform scale-95 pointer-events-none" />

      <div className={`relative w-full ${maxW} rounded-2xl sm:rounded-3xl overflow-visible p-1.5 sm:p-2`}>
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-indigo-950/20 border-2 border-white/90 dark:border-slate-700/80 bg-gradient-to-b from-indigo-50/50 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <img
            src={communityAnimeImg}
            alt="DSK TaskMarketer Community & Support Banner"
            className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
            loading="eager"
          />

          <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent pointer-events-none" />
        </div>

        {/* Floating Badges */}
        <div className="absolute -top-2.5 sm:-top-3.5 right-1 sm:right-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-2xl border-2 border-violet-300 shadow-xl shadow-indigo-600/30 whitespace-nowrap">
            <Headset className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 shrink-0 animate-pulse" />
            <span className="text-[9px] sm:text-xs font-black tracking-wide">24/7 Dedicated Support</span>
          </div>
        </div>

        <div className="absolute bottom-10 sm:bottom-12 left-1 sm:-left-3 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-xl shadow-indigo-600/20 whitespace-nowrap">
            <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-md sm:rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <MessageSquare className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[9px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                Official Telegram & WhatsApp
              </p>
              <p className="text-[7px] sm:text-[10px] font-bold text-violet-600 dark:text-violet-400">
                Active Community
              </p>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-2.5 sm:-bottom-3.5 right-1 sm:right-3 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/95 dark:bg-black/95 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-2xl border border-slate-700 shadow-xl whitespace-nowrap">
            <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[9px] sm:text-xs font-bold text-slate-200">Verified Guidelines</span>
          </div>
        </div>
      </div>
    </div>
  );
};
