import React from 'react';
import { ClipboardList, ArrowRight } from 'lucide-react';
import boyCardImg from '../assets/images/dsk_card_complete_tasks_transparent.png';
import incentiveArtwork from '../assets/images/monthly-incentive.png';
import referEarnArtwork from '../assets/images/refer-and-earn.png';

interface ThreeHorizontalCardsProps {
  onNavigate: (view: string) => void;
  isLoggedIn?: boolean;
}

export const ThreeHorizontalCards: React.FC<ThreeHorizontalCardsProps> = ({
  onNavigate,
  isLoggedIn = false
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-4">
      {/* 3 Cards ALWAYS in 1x3 horizontal row across Desktop, Tablet and Mobile */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 md:gap-4 lg:gap-6 w-full items-stretch">

        {/* ========================================================
            CARD 1: COMPLETE TASKS (Kept exactly as it is)
            ======================================================== */}
        <div
          id="card-complete-tasks"
          onClick={() => onNavigate(isLoggedIn ? 'tasks' : 'available-tasks')}
          className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3.5 md:p-5 lg:p-6 bg-white dark:bg-gradient-to-r dark:from-[#07204F] dark:via-[#0B2C6E] dark:to-[#114399] border sm:border-2 border-blue-500/40 hover:border-blue-500 shadow-[0_4px_15px_rgba(18,100,255,0.1)] hover:shadow-[0_10px_30px_rgba(18,100,255,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 sm:hover:-translate-y-1 group cursor-pointer flex justify-between items-center min-h-[140px] xs:min-h-[160px] sm:min-h-[220px] md:min-h-[270px] lg:min-h-[300px]"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-10 -left-10 w-24 sm:w-36 h-24 sm:h-36 bg-blue-400/15 dark:bg-blue-400/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-24 sm:w-36 h-24 sm:h-36 bg-cyan-400/10 dark:bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Left Text & Action Column */}
          <div className="relative z-10 flex flex-col justify-between items-start text-left min-w-0 pr-1 sm:pr-2 h-full">
            <div>
              {/* Top Icon: Yellow Clipboard in Rounded Square */}
              <div className="w-5 xs:w-6 sm:w-8 md:w-11 h-5 xs:h-6 sm:h-8 md:h-11 rounded-md sm:rounded-xl bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-xs sm:shadow-md shadow-amber-400/30 mb-1 sm:mb-2 md:mb-3 shrink-0 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-3 xs:w-3.5 sm:w-5 md:w-6 h-3 xs:h-3.5 sm:h-5 md:h-6 text-slate-950" />
              </div>

              {/* Title: Complete Tasks */}
              <h3 className="text-[10px] xs:text-xs sm:text-base md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                Complete <br />
                <span className="text-blue-600 dark:text-[#FFC400]">Tasks</span>
              </h3>

              {/* Subtext */}
              <p className="text-[7px] xs:text-[8px] sm:text-[10px] md:text-xs text-slate-600 dark:text-blue-100/85 mt-0.5 sm:mt-1 md:mt-1.5 max-w-[170px] leading-tight sm:leading-snug font-medium line-clamp-2">
                Simple tasks, easy steps. Get started!
              </p>
            </div>

            {/* Bottom Yellow Arrow Button */}
            <div className="mt-1 sm:mt-3 md:mt-4 w-4 xs:w-5 sm:w-7 md:w-8 h-4 xs:h-5 sm:h-7 md:h-8 rounded-full bg-[#FFC400] text-slate-950 flex items-center justify-center font-black shadow-xs sm:shadow-md shadow-amber-400/35 group-hover:scale-110 group-hover:bg-yellow-300 transition-all shrink-0">
              <ArrowRight className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Right Character Column: Boy in Yellow Hoodie with Thumbs Up */}
          <div className="relative z-10 shrink-0 w-[34px] xs:w-[46px] sm:w-[75px] md:w-[110px] lg:w-[145px] flex items-center justify-center pointer-events-none select-none">
            <img
              src={boyCardImg}
              alt="Complete Tasks Character - Boy in Yellow Hoodie"
              className="w-full h-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        </div>

        {/* ========================================================
            CARD 2: GET INCENTIVES (Image scaled with equal padding, uncropped)
            ======================================================== */}
        <div
          id="card-get-incentives"
          onClick={() => onNavigate('incentives')}
          className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl p-1.5 xs:p-2 sm:p-3 md:p-4 bg-white dark:bg-gradient-to-b dark:from-[#2a0410] dark:via-[#48071a] dark:to-[#6d0a27] border sm:border-2 border-red-500/40 hover:border-red-500 shadow-[0_4px_15px_rgba(255,23,68,0.1)] hover:shadow-[0_10px_30px_rgba(255,23,68,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 sm:hover:-translate-y-1 group cursor-pointer flex flex-col justify-between min-h-[140px] xs:min-h-[160px] sm:min-h-[220px] md:min-h-[270px] lg:min-h-[300px]"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-12 -left-12 w-24 sm:w-48 h-24 sm:h-48 bg-red-500/15 dark:bg-red-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-24 sm:w-48 h-24 sm:h-48 bg-amber-400/10 dark:bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Artwork Area: Scaled neatly with equal margin/padding, no crop, no distortion */}
          <div className="relative z-10 w-full flex-1 min-h-[55px] xs:min-h-[70px] sm:min-h-[100px] md:min-h-[135px] lg:min-h-[160px] flex items-center justify-center p-0.5 sm:p-1.5 md:p-2 overflow-hidden">
            <img
              src={incentiveArtwork}
              alt="DSK Monthly Incentive Rewards Artwork"
              className="max-w-full max-h-[55px] xs:max-h-[70px] sm:max-h-[100px] md:max-h-[135px] lg:max-h-[160px] w-auto h-auto object-contain rounded-md sm:rounded-xl filter drop-shadow-[0_3px_10px_rgba(255,23,68,0.15)] group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
              loading="lazy"
            />
          </div>

          {/* Bottom Content Area */}
          <div className="relative z-10 flex items-center justify-between pt-1 sm:pt-2 md:pt-3 px-0.5 sm:px-1">
            <div className="text-left pr-1 min-w-0">
              <h3 className="text-[10px] xs:text-xs sm:text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                Get <span className="text-red-600 dark:text-[#FFC400]">Incentives</span>
              </h3>
              <p className="text-[7px] xs:text-[8.5px] sm:text-[11px] md:text-xs text-red-600 dark:text-[#FFC400] font-bold mt-0.5 leading-tight sm:leading-snug truncate">
                Earn Up to ₹3,000
              </p>
            </div>

            {/* Action Indicator Arrow Button */}
            <div className="w-4 xs:w-5 sm:w-7 md:w-8 h-4 xs:h-5 sm:h-7 md:h-8 rounded-full bg-[#FFC400] text-slate-950 flex items-center justify-center font-black shadow-xs sm:shadow-md shadow-amber-400/35 group-hover:scale-110 group-hover:bg-yellow-300 transition-all shrink-0">
              <ArrowRight className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* ========================================================
            CARD 3: REFER & EARN (Image scaled with equal padding, uncropped)
            ======================================================== */}
        <div
          id="card-refer-earn"
          onClick={() => onNavigate(isLoggedIn ? 'referrals' : 'refer-earn')}
          className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl p-1.5 xs:p-2 sm:p-3 md:p-4 bg-white dark:bg-gradient-to-b dark:from-[#051636] dark:via-[#092253] dark:to-[#0e3175] border sm:border-2 border-blue-500/40 hover:border-blue-500 shadow-[0_4px_15px_rgba(18,100,255,0.1)] hover:shadow-[0_10px_30px_rgba(18,100,255,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 sm:hover:-translate-y-1 group cursor-pointer flex flex-col justify-between min-h-[140px] xs:min-h-[160px] sm:min-h-[220px] md:min-h-[270px] lg:min-h-[300px]"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-12 -left-12 w-24 sm:w-48 h-24 sm:h-48 bg-blue-500/15 dark:bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-24 sm:w-48 h-24 sm:h-48 bg-cyan-400/10 dark:bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Artwork Area: Scaled neatly with equal margin/padding, no crop, no distortion */}
          <div className="relative z-10 w-full flex-1 min-h-[55px] xs:min-h-[70px] sm:min-h-[100px] md:min-h-[135px] lg:min-h-[160px] flex items-center justify-center p-0.5 sm:p-1.5 md:p-2 overflow-hidden">
            <img
              src={referEarnArtwork}
              alt="DSK Refer & Earn Artwork"
              className="max-w-full max-h-[55px] xs:max-h-[70px] sm:max-h-[100px] md:max-h-[135px] lg:max-h-[160px] w-auto h-auto object-contain rounded-md sm:rounded-xl filter drop-shadow-[0_3px_10px_rgba(18,100,255,0.15)] group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
              loading="lazy"
            />
          </div>

          {/* Bottom Content Area */}
          <div className="relative z-10 flex items-center justify-between pt-1 sm:pt-2 md:pt-3 px-0.5 sm:px-1">
            <div className="text-left pr-1 min-w-0">
              <h3 className="text-[10px] xs:text-xs sm:text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                Refer & <span className="text-blue-600 dark:text-[#FFC400]">Earn</span>
              </h3>
              <p className="text-[7px] xs:text-[8.5px] sm:text-[11px] md:text-xs text-blue-600 dark:text-[#FFC400] font-bold mt-0.5 leading-tight sm:leading-snug truncate">
                ₹50 per Valid Referral
              </p>
            </div>

            {/* Action Indicator Arrow Button */}
            <div className="w-4 xs:w-5 sm:w-7 md:w-8 h-4 xs:h-5 sm:h-7 md:h-8 rounded-full bg-[#FFC400] text-slate-950 flex items-center justify-center font-black shadow-xs sm:shadow-md shadow-amber-400/35 group-hover:scale-110 group-hover:bg-yellow-300 transition-all shrink-0">
              <ArrowRight className="w-2.5 xs:w-3 sm:w-4 h-2.5 xs:h-3 sm:h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
