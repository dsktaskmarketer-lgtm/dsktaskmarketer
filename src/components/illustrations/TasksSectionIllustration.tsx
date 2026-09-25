import React from 'react';
import { CheckCircle2, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import tasksAnimeImg from '../../assets/images/tasks_anime_banner_1790089486713.jpg';
import { FloatingCoin3D, FloatingGem3D } from '../ThreeDDecorations';

interface TasksSectionIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TasksSectionIllustration: React.FC<TasksSectionIllustrationProps> = ({
  className = '',
  size = 'md'
}) => {
  const maxW = {
    sm: 'max-w-[280px]',
    md: 'max-w-[440px]',
    lg: 'max-w-[580px]'
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none w-full overflow-visible ${className}`}>
      {/* 3D Volumetric Glow in Electric Blue & Emerald */}
      <div className="absolute -inset-6 bg-radial from-blue-600/35 via-indigo-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating 3D Coin & Gem around Task Character */}
      <div className="absolute -top-3 -right-2 sm:-right-4 z-30">
        <FloatingCoin3D size={40} delay="0.3s" tilt={14} />
      </div>
      <div className="absolute bottom-4 -left-2 sm:-left-4 z-30">
        <FloatingGem3D color="blue" size={28} delay="1.2s" />
      </div>

      {/* Main Integrated Container with Organic Edge Masking */}
      <div className={`relative w-full ${maxW} overflow-visible p-1`}>
        
        {/* Ground Pedestal Shadow */}
        <div 
          className="absolute -bottom-3 inset-x-8 h-6 bg-blue-950/50 rounded-[100%] blur-sm pointer-events-none" 
          style={{ transform: 'rotateX(75deg)' }}
        />

        <div className="relative rounded-3xl overflow-hidden p-1 bg-gradient-to-b from-blue-400/25 via-white/10 to-transparent backdrop-blur-xs shadow-[0_15px_35px_rgba(7,21,47,0.5)]">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl [mask-image:radial-gradient(ellipse_92%_88%_at_50%_50%,black_65%,rgba(0,0,0,0.85)_82%,transparent_100%)]">
            <img
              src={tasksAnimeImg}
              alt="DSK TaskMarketer Financial Tasks Banner"
              className="w-full h-auto object-cover transform hover:scale-[1.03] transition-transform duration-600 ease-out"
              referrerPolicy="no-referrer"
              loading="eager"
            />

            {/* Bottom Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-[#07152F] via-[#07152F]/40 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute -top-3 right-1 sm:right-2 z-30 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-3 py-1.5 rounded-xl sm:rounded-2xl border-2 border-yellow-300 shadow-lg shadow-blue-600/30 whitespace-nowrap">
            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300/40 shrink-0 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-black tracking-wide">High Reward Tasks</span>
          </div>
        </div>

        <div className="absolute -bottom-3 left-1 sm:left-2 z-30 pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/95 text-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-500/40 shadow-lg whitespace-nowrap">
            <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[9px] sm:text-xs font-black text-white leading-tight">
                Verified Partners
              </p>
              <p className="text-[8px] sm:text-[10px] font-bold text-blue-400">
                Guaranteed Payouts
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
