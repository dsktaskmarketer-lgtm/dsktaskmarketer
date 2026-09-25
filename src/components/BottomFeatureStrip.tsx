import React from 'react';
import { ShieldCheck, Zap, Headphones, Layers, Sparkles, Award } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface BottomFeatureStripProps {
  className?: string;
}

export const BottomFeatureStrip: React.FC<BottomFeatureStripProps> = ({ className = '' }) => {
  return (
    <div className={`w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-4 sm:py-6 px-3 sm:px-6 shadow-xs ${className}`}>
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
        
        {/* Brand & Tagline on Left */}
        <div className="flex items-center gap-3 shrink-0 text-center lg:text-left">
          <BrandLogo size="md" showTagline={true} />
        </div>

        {/* 4 Feature Pillars in Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full lg:w-auto flex-1 max-w-4xl">
          
          {/* 1. Secure Platform */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 min-w-0">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0 text-left">
              <h4 className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                Secure Platform
              </h4>
              <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
                Your data is safe
              </p>
            </div>
          </div>

          {/* 2. Instant Payouts */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 min-w-0">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Zap className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0 text-left">
              <h4 className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                Instant Payouts
              </h4>
              <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
                Fast & reliable
              </p>
            </div>
          </div>

          {/* 3. 24/7 Support */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 min-w-0">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Headphones className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0 text-left">
              <h4 className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                24/7 Support
              </h4>
              <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
                We are here for you
              </p>
            </div>
          </div>

          {/* 4. Multiple Categories */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 min-w-0">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0 text-left">
              <h4 className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                Multiple Categories
              </h4>
              <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
                Finance, Apps & More
              </p>
            </div>
          </div>

        </div>

        {/* Golden Dream Earn Grow Badge on Right */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 dark:from-amber-950/60 dark:via-yellow-950/60 dark:to-amber-950/60 border border-yellow-300 dark:border-yellow-700 shrink-0">
          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs font-black tracking-wide bg-gradient-to-r from-amber-700 via-yellow-600 to-red-600 bg-clip-text text-transparent font-serif italic">
            Dream • Earn • Grow
          </span>
        </div>

      </div>
    </div>
  );
};
