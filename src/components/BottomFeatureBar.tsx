import React from 'react';
import { ShieldCheck, Zap, Headphones, LayoutGrid } from 'lucide-react';

interface BottomFeatureBarProps {
  className?: string;
  onNavigate?: (view: string) => void;
}

export const BottomFeatureBar: React.FC<BottomFeatureBarProps> = ({
  className = '',
  onNavigate
}) => {
  return (
    <div className={`w-full max-w-7xl mx-auto px-2 sm:px-4 ${className}`}>
      {/* Sleek Light/Dark Mode Feature Strip */}
      <div className="rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-[#091D42]/85 backdrop-blur-md border border-slate-200 dark:border-blue-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.05)] px-4 sm:px-8 py-3.5 sm:py-5 transition-colors">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 items-center">
          
          {/* 1. Secure Platform */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-9 sm:w-11 h-9 sm:h-11 rounded-full bg-blue-100/80 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-400/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                Secure Platform
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-blue-200/75 truncate mt-0.5 font-medium">
                Your data is safe
              </p>
            </div>
          </div>

          {/* 2. Instant Payouts */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-9 sm:w-11 h-9 sm:h-11 rounded-full bg-amber-100/80 dark:bg-blue-950/90 border border-amber-300 dark:border-blue-400/40 text-amber-600 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-amber-500 fill-amber-500/20" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                Instant Payouts
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-blue-200/75 truncate mt-0.5 font-medium">
                Fast & reliable
              </p>
            </div>
          </div>

          {/* 3. 24/7 Support */}
          <div 
            onClick={() => onNavigate && onNavigate('contact')}
            className={`flex items-center gap-2.5 sm:gap-3.5 ${onNavigate ? 'cursor-pointer group' : ''}`}
          >
            <div className="w-9 sm:w-11 h-9 sm:h-11 rounded-full bg-blue-100/80 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-400/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-xs group-hover:border-blue-500 transition-colors">
              <Headphones className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                24/7 Support
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-blue-200/75 truncate mt-0.5 font-medium">
                We are here for you
              </p>
            </div>
          </div>

          {/* 4. Multiple Task Categories */}
          <div 
            onClick={() => onNavigate && onNavigate('available-tasks')}
            className={`flex items-center gap-2.5 sm:gap-3.5 ${onNavigate ? 'cursor-pointer group' : ''}`}
          >
            <div className="w-9 sm:w-11 h-9 sm:h-11 rounded-full bg-purple-100/80 dark:bg-blue-950/90 border border-purple-200 dark:border-blue-400/40 text-purple-600 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-xs group-hover:border-purple-500 transition-colors">
              <LayoutGrid className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600 dark:text-blue-300" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-purple-600 dark:group-hover:text-blue-300 transition-colors">
                Multiple Task Categories
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-blue-200/75 truncate mt-0.5 font-medium">
                Finance, Shopping & Survey
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
