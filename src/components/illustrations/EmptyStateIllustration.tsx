import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import emptySearchAnimeImg from '../../assets/images/empty_search_anime_1790044223840.jpg';

interface EmptyStateIllustrationProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  className = '',
  size = 'md'
}) => {
  const maxW = size === 'sm' ? 'max-w-[130px]' : 'max-w-[200px]';

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Glow */}
      <div className="absolute -inset-2 bg-gradient-to-tr from-blue-500/15 via-slate-400/10 to-amber-500/15 rounded-2xl blur-xl transform scale-90 pointer-events-none" />

      <div className={`relative w-full ${maxW} rounded-2xl overflow-visible p-1`}>
        <div className="relative rounded-2xl overflow-hidden shadow-lg shadow-slate-900/10 border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-b from-slate-50 via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <img
            src={emptySearchAnimeImg}
            alt="DSK TaskMarketer 3D Anime Search Character"
            className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-300"
            referrerPolicy="no-referrer"
            loading="eager"
          />

          {/* Bottom vignette */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/30 to-transparent pointer-events-none" />
        </div>

        {/* Search Pin Badge */}
        <div className="absolute -bottom-1.5 -right-1 z-20 pointer-events-none">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md border border-white dark:border-slate-800">
            <Search className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
