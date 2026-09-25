import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import taskSuccessAnimeImg from '../../assets/images/task_success_anime_1790044191206.jpg';

interface TaskCompleteIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TaskCompleteIllustration: React.FC<TaskCompleteIllustrationProps> = ({
  className = '',
  size = 'md'
}) => {
  const maxW = {
    sm: 'max-w-[180px]',
    md: 'max-w-[260px]',
    lg: 'max-w-[340px]'
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Volumetric Glow in Green & Amber */}
      <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/20 via-yellow-400/25 to-blue-500/20 rounded-3xl blur-2xl transform scale-90 pointer-events-none" />

      <div className={`relative w-full ${maxW} rounded-2xl overflow-visible p-1.5`}>
        <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-slate-900/15 border-2 border-white/90 dark:border-slate-700/60 bg-gradient-to-b from-emerald-50/50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <img
            src={taskSuccessAnimeImg}
            alt="DSK TaskMarketer 3D Anime Task Verified Character"
            className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-300"
            referrerPolicy="no-referrer"
            loading="eager"
          />

          {/* Bottom vignette */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
        </div>

        {/* Floating Top Badge: Task Verified */}
        <div className="absolute -top-2.5 -right-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1 rounded-xl shadow-lg shadow-emerald-600/30 text-[11px] font-black border border-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span>Task Verified</span>
          </div>
        </div>

        {/* Floating Bottom Badge: Reward Credited */}
        <div className="absolute -bottom-2 -left-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 px-3 py-1 rounded-xl shadow-lg text-[11px] font-black border border-white dark:border-slate-800">
            <Sparkles className="w-3 h-3 text-amber-950" />
            <span>Reward Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
