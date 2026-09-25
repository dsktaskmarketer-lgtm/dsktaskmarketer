import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Headphones 
} from 'lucide-react';
import { Task, TaskCategory, SocialLink, PlatformSettings, User, WalletSummary } from '../types';
import { useTranslation } from '../locales';
import { DskRefHeroIllustration } from '../components/illustrations/DskRefHeroIllustration';
import { ThreeHorizontalCards } from '../components/ThreeHorizontalCards';
import { BottomFeatureBar } from '../components/BottomFeatureBar';

interface HomeViewProps {
  user?: User | null;
  wallet?: WalletSummary | null;
  tasks: Task[];
  categories: TaskCategory[];
  socialLinks: SocialLink[];
  settings: PlatformSettings;
  onNavigate: (view: string) => void;
  onViewTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  wallet,
  tasks,
  categories,
  socialLinks,
  settings,
  onNavigate,
  onViewTask,
  onStartTask,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full bg-white dark:bg-[#07152F] text-slate-900 dark:text-slate-100 flex flex-col overflow-x-hidden pb-2 sm:pb-4 selection:bg-amber-400 selection:text-slate-950">
      
      {/* Background Volumetric Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-10 w-72 sm:w-96 h-72 sm:h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-72 sm:w-96 h-72 sm:h-96 bg-red-500/8 dark:bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Wrapper - Tight and Consistent Spacing across Desktop, Tablet and Mobile */}
      <div className="relative z-10 w-full flex flex-col space-y-3 sm:space-y-6 lg:space-y-8">
        
        {/* ========================================================
            HERO SECTION
            Exact Desktop Master Composition Scaled Proportionally:
            LEFT = Welcome text, DSK TaskMarketer, Subtitle, Description, Buttons, Trust Badges
            RIGHT = Combined Hero Character Image + Floating Badges/Words
            Always Side-by-Side across Desktop, Tablet and Mobile
            ======================================================== */}
        <section className="w-full px-2 sm:px-6 pt-2 sm:pt-4 lg:pt-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-12 gap-1.5 sm:gap-6 lg:gap-8 items-center">
              
              {/* Left Column: Heading, Subtitle, Description, CTAs, Badges */}
              <div className="col-span-7 sm:col-span-7 md:col-span-7 lg:col-span-7 space-y-1.5 xs:space-y-2 sm:space-y-4 lg:space-y-5 text-left pr-0.5 sm:pr-2 lg:pr-4">
                
                {/* Script "Welcome to" with Yellow Brush Curve Underline */}
                <div className="inline-block relative">
                  <span className="font-['Caveat',cursive,sans-serif] text-sm xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-wide italic">
                    Welcome to
                  </span>
                  {/* Yellow curved brush stroke */}
                  <svg className="w-14 xs:w-20 sm:w-28 md:w-32 h-1.5 sm:h-3 text-[#FFC400] mt-0.5" viewBox="0 0 100 12" fill="none">
                    <path d="M2 9C28 3 72 3 98 9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Main Heading: DSK TaskMarketer 🚀 */}
                <h1 className="text-sm xs:text-lg sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                  <span className="text-[#FF1744]">DSK</span>{' '}
                  <span className="text-slate-900 dark:text-white">TaskMarketer</span>{' '}
                  <span className="inline-block text-xs xs:text-sm sm:text-3xl md:text-4xl lg:text-5xl transform hover:scale-110 transition-transform">🚀</span>
                </h1>

                {/* Subtitle with Bullet Points */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-2.5 text-[8px] xs:text-[10px] sm:text-sm md:text-base lg:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  <span>Complete Tasks</span>
                  <span className="text-[#FFC400] text-[8px] sm:text-base">●</span>
                  <span>Earn Real Rewards</span>
                  <span className="text-[#FFC400] text-[8px] sm:text-base">●</span>
                  <span>Grow Together</span>
                </div>

                {/* Paragraph Description */}
                <p className="text-[7.5px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base text-slate-600 dark:text-blue-100/90 font-medium max-w-xl leading-tight sm:leading-relaxed">
                  Do simple tasks, complete offers, refer friends and earn money. It's fast, safe and 100% genuine.
                </p>

                {/* CTAs: Get Started & Explore Tasks Buttons */}
                <div className="flex flex-wrap items-center gap-1 xs:gap-2 sm:gap-4 pt-0.5 sm:pt-1">
                  
                  {/* Yellow Get Started Button */}
                  <button
                    id="hero-get-started-btn"
                    onClick={() => onNavigate(user ? 'available-tasks' : 'register')}
                    className="px-2 xs:px-3.5 sm:px-5 md:px-7 py-1 xs:py-1.5 sm:py-2.5 md:py-3.5 bg-[#FFC400] hover:bg-yellow-300 text-slate-950 font-black text-[8px] xs:text-[11px] sm:text-xs md:text-sm lg:text-base rounded-full shadow-xs sm:shadow-[0_8px_25px_rgba(255,196,0,0.35)] transition-all hover:scale-105 active:scale-95 flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4 text-slate-950" />
                  </button>

                  {/* Clean Blue Explore Tasks Button */}
                  <button
                    id="hero-explore-tasks-btn"
                    onClick={() => onNavigate('available-tasks')}
                    className="px-2 xs:px-3.5 sm:px-5 md:px-7 py-1 xs:py-1.5 sm:py-2.5 md:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[8px] xs:text-[11px] sm:text-xs md:text-sm lg:text-base rounded-full border sm:border-2 border-blue-600 shadow-xs sm:shadow-[0_8px_25px_rgba(37,99,235,0.25)] transition-all hover:scale-105 active:scale-95 flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>Explore Tasks</span>
                    <ArrowRight className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4 text-white" />
                  </button>
                </div>

                {/* Trust Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2.5 sm:gap-4 lg:gap-6 pt-0.5 sm:pt-2 text-[7px] xs:text-[8px] sm:text-[11px] md:text-xs text-slate-700 dark:text-blue-200 font-bold">
                  <div className="flex items-center gap-0.5 sm:gap-1.5">
                    <ShieldCheck className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Secure & Trusted</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1.5">
                    <Zap className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4 text-amber-500 shrink-0" />
                    <span>Fast Payouts</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1.5">
                    <Headphones className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>24/7 Support</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Combined Hero Image + Words/Badges Group */}
              <div className="col-span-5 sm:col-span-5 md:col-span-5 lg:col-span-5 flex justify-center items-center relative overflow-visible">
                <DskRefHeroIllustration className="w-full" />
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================
            EXACTLY 3 HORIZONTAL CARDS BELOW HERO
            1. Complete Tasks
            2. Get Incentives (Monthly Incentive Artwork)
            3. Refer & Earn (Refer & Earn Artwork)
            Always in 1x3 horizontal layout with white background
            ======================================================== */}
        <section className="w-full">
          <ThreeHorizontalCards 
            onNavigate={onNavigate}
            isLoggedIn={!!user}
          />
        </section>

        {/* ========================================================
            BOTTOM FEATURE BAR
            Secure Platform | Instant Payouts | 24/7 Support | Multiple Task Categories
            ======================================================== */}
        <section className="w-full">
          <BottomFeatureBar onNavigate={onNavigate} />
        </section>

      </div>

    </div>
  );
};
