import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  isDark?: boolean;
  variant?: 'default' | 'white' | 'on-dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  isDark = false,
  variant = 'default'
}) => {
  // Sizing dimensions
  const dimensions = {
    sm: { height: 28, textDsk: 'text-base sm:text-lg', textTask: 'text-[10px] sm:text-xs md:text-sm', taglineText: 'text-[7px] sm:text-[8px]', iconSize: 'w-3.5 h-3.5 sm:w-4 sm:h-4' },
    md: { height: 38, textDsk: 'text-base sm:text-2xl md:text-3xl', textTask: 'text-xs sm:text-base md:text-lg', taglineText: 'text-[8px] sm:text-[10px]', iconSize: 'w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6' },
    lg: { height: 50, textDsk: 'text-xl sm:text-3xl md:text-4xl', textTask: 'text-base sm:text-xl md:text-2xl', taglineText: 'text-[9px] sm:text-[11px]', iconSize: 'w-5 h-5 sm:w-6 sm:h-6' },
    xl: { height: 64, textDsk: 'text-2xl sm:text-4xl md:text-5xl', textTask: 'text-lg sm:text-2xl md:text-3xl', taglineText: 'text-[10px] sm:text-xs', iconSize: 'w-6 h-6 sm:w-7 sm:h-7' },
  }[size];

  const isOnDarkOrWhite = variant === 'white' || variant === 'on-dark';

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="flex items-center gap-1 sm:gap-1.5 leading-none font-black tracking-tight">
        {/* DSK with integrated upward arrow in red and blue/white */}
        <div className="flex items-center relative">
          <span 
            className={`${
              isOnDarkOrWhite ? 'text-red-400' : 'text-red-600 dark:text-red-500'
            } font-black italic tracking-tighter uppercase font-sans ${dimensions.textDsk} font-extrabold`} 
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            DSK
          </span>
          {/* Dynamic upward growth arrow matching reference */}
          <div className="relative -ml-0.5 -mt-1 sm:-mt-2">
            <svg 
              className={`${dimensions.iconSize} ${
                isOnDarkOrWhite ? 'text-yellow-400' : 'text-blue-600 dark:text-blue-400'
              } transform -rotate-12 transition-transform group-hover:scale-110`} 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M5 19L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* TaskMarketer */}
        <span className={`font-black tracking-tight ${
          isOnDarkOrWhite ? 'text-white' : 'text-blue-600 dark:text-blue-400'
        } ${dimensions.textTask} font-sans`}>
          Task<span className={isOnDarkOrWhite ? 'text-yellow-300' : 'text-blue-700 dark:text-blue-300'}>Marketer</span>
        </span>
      </div>

      {/* Tagline matching reference */}
      {showTagline && (
        <div className={`flex items-center gap-1.5 font-bold tracking-wider ${
          isOnDarkOrWhite ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
        } uppercase mt-0.5 ${dimensions.taglineText}`}>
          <span>Complete Tasks</span>
          <span className="text-red-500">•</span>
          <span>Earn Rewards</span>
          <span className="text-yellow-500">•</span>
          <span>Grow Together</span>
        </div>
      )}
    </div>
  );
};
