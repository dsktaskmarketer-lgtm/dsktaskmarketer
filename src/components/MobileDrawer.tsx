import React, { useEffect } from 'react';
import { 
  Shield, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  X, 
  Wallet, 
  Sparkles, 
  ChevronRight,
  Users,
  Settings,
  Sun,
  Moon,
  Home,
  Briefcase,
  Layers,
  FileCheck,
  PlusCircle,
  CheckSquare,
  Compass,
  HelpCircle,
  MessageSquare,
  Info,
  Gift,
  BarChart3
} from 'lucide-react';
import { User, WalletSummary, PlatformSettings } from '../types';
import { useTranslation } from '../locales';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  wallet: WalletSummary | null;
  unreadCount: number;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onMarkAllNotificationsRead: () => void;
  settings?: PlatformSettings;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  wallet,
  unreadCount,
  currentView,
  onNavigate,
  onLogout,
  onMarkAllNotificationsRead,
  settings
}) => {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isNormalUser = user && !isAdmin && !isClient;

  const handleNav = (view: string) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div className="lg:hidden fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <aside className="w-screen max-w-sm sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                DSK
              </div>
              <span className="font-black text-base text-slate-900 dark:text-white truncate">
                {settings?.platformName || 'DSK TaskMarketer'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            
            {/* User Session Profile Card */}
            {user && (
              <div className="p-4 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-slate-50/90 dark:bg-slate-800/60 space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-black text-sm shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  {user.referralCode && (
                    <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full shrink-0 border border-emerald-300 dark:border-emerald-700">
                      {user.referralCode}
                    </span>
                  )}
                </div>

                {isNormalUser && wallet && (
                  <div className="flex items-center justify-between p-3 bg-emerald-100/70 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-700/70">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">{t('dashboard.availableBalance', 'Available Balance')}</div>
                        <div className="text-base font-black text-emerald-950 dark:text-white font-mono">₹{wallet.availableBalance}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNav('wallet')}
                      className="px-3 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs"
                    >
                      {t('nav.wallet', 'Wallet')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
                COMPLETE AUTHENTICATED MAIN MENU (Requirement 1 & 6)
                1. Home
                2. Tasks
                3. Explore Tasks
                4. Wallet
                5. How It Works
                6. Refer & Earn
                7. Community
                8. About Us
                9. Profile / Account
                10. Logout
                ======================================================== */}
            {isNormalUser && (
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 px-2 flex items-center justify-between">
                  <span>{t('nav.menu', 'Navigation Menu')}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">10 Options</span>
                </div>

                {/* 1. Home */}
                <button 
                  id="mobile-nav-home"
                  onClick={() => handleNav('home')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all cursor-pointer ${
                    currentView === 'home' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'home' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'}`}>
                      <Home className="w-5 h-5" />
                    </div>
                    <span>{t('nav.home', 'Home')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 2. Dashboard */}
                <button 
                  id="mobile-nav-dashboard"
                  onClick={() => handleNav('dashboard')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all cursor-pointer ${
                    currentView === 'dashboard' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span>{t('nav.dashboard', 'Dashboard')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 3. Tasks */}
                <button 
                  id="mobile-nav-tasks"
                  onClick={() => handleNav('tasks')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all cursor-pointer ${
                    currentView === 'tasks'
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'tasks' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'}`}>
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <span>{t('nav.tasks', 'Tasks')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 4. Explore Tasks */}
                <button 
                  id="mobile-nav-explore-tasks"
                  onClick={() => handleNav('available-tasks')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all ${
                    currentView === 'available-tasks'
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'available-tasks' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                      <Compass className="w-5 h-5" />
                    </div>
                    <span>{t('nav.exploreTasks', 'Explore Tasks')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 4. Wallet (Requirement 2: Clearly visible in the menu) */}
                <button 
                  id="mobile-nav-wallet"
                  onClick={() => handleNav('wallet')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all ${
                    currentView === 'wallet' || currentView === 'withdrawals'
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'wallet' || currentView === 'withdrawals' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span>{t('nav.wallet', 'Wallet')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 5. How It Works */}
                <button 
                  id="mobile-nav-how-it-works"
                  onClick={() => handleNav('how-it-works')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all ${
                    currentView === 'how-it-works' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'how-it-works' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <span>{t('nav.howItWorks', 'How It Works')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 6. Refer & Earn */}
                <button 
                  id="mobile-nav-refer-earn"
                  onClick={() => handleNav('referrals')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all ${
                    currentView === 'referrals' || currentView === 'refer-earn'
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'referrals' || currentView === 'refer-earn' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'}`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <span>{t('nav.referEarn', 'Refer & Earn')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 7. Community */}
                <button 
                  id="mobile-nav-community"
                  onClick={() => handleNav('community')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all ${
                    currentView === 'community' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'community' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400'}`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span>{t('nav.community', 'Community')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 8. About Us */}
                <button 
                  id="mobile-nav-about-us"
                  onClick={() => handleNav('about')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all ${
                    currentView === 'about' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'about' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      <Info className="w-5 h-5" />
                    </div>
                    <span>{t('nav.aboutUs', 'About Us')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 9. Profile / Account */}
                <button 
                  id="mobile-nav-profile"
                  onClick={() => handleNav('profile')} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold rounded-2xl transition-all ${
                    currentView === 'profile' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-white border-2 border-emerald-500 shadow-xs font-black' 
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentView === 'profile' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <span>{t('nav.profile', 'Profile')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 10. Logout */}
                <button 
                  id="mobile-nav-logout"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }} 
                  className="w-full flex items-center justify-between px-4 py-3.5 text-base font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition-all border border-rose-200 dark:border-rose-900/50"
                >
                  <span className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span>{t('nav.logout', 'Logout')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            )}

            {/* Client Portal Options */}
            {isClient && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 px-2 mb-2">
                  Partner Portal
                </div>
                <button onClick={() => handleNav('client-dashboard')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="flex items-center gap-2.5"><Layers className="w-4 h-4 text-blue-500" /> Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button onClick={() => handleNav('client-campaigns')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="flex items-center gap-2.5"><Briefcase className="w-4 h-4 text-blue-500" /> My Campaigns</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button onClick={() => handleNav('client-create-campaign')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="flex items-center gap-2.5"><PlusCircle className="w-4 h-4 text-emerald-500" /> New Campaign</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}

            {/* Theme Toggle in Drawer */}
            <div className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              {/* Theme Toggle */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    {isDark ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                    Theme Mode
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isDark ? 'Dark' : 'Light'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-200/70 dark:bg-slate-900 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDark) toggleTheme();
                      showToast('Theme set to Light mode');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      !isDark
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isDark) toggleTheme();
                      showToast('Theme set to Dark mode');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      isDark
                        ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
};
