import React, { useState } from 'react';
import { 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Wallet, 
  ChevronDown, 
  Users, 
  Sun, 
  Moon, 
  Home, 
  CheckSquare, 
  Compass, 
  HelpCircle, 
  MessageSquare, 
  Info, 
  Award,
  Layers,
  Sparkles,
  FileCheck,
  Settings,
  Briefcase,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { User, WalletSummary, NotificationItem, PlatformSettings } from '../types';
import { useTranslation } from '../locales';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  user: User | null;
  wallet: WalletSummary | null;
  unreadCount: number;
  notifications: NotificationItem[];
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  settings?: PlatformSettings;
  customLogo?: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  wallet,
  unreadCount,
  notifications,
  currentView,
  onNavigate,
  onLogout,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  settings,
  customLogo,
}) => {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isNormalUser = user && !isAdmin && !isClient;
  const referralRewardAmount = settings?.referralRewardAmount ?? 50;

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B1F4D] border-b border-[#0057D9]/40 shadow-lg text-[#FFFFFF] transition-colors w-full">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20 w-full gap-2 lg:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="brand-logo-btn"
              onClick={() => {
                if (isAdmin && currentView.startsWith('admin-')) handleNavClick('admin-dashboard');
                else handleNavClick('home');
              }}
              className="flex items-center gap-2 focus:outline-hidden text-left group cursor-pointer"
            >
              {customLogo || settings?.logoUrl ? (
                <img
                  src={customLogo || settings?.logoUrl}
                  alt={settings?.platformName || 'DSK TaskMarketer'}
                  className="h-8 sm:h-10 max-w-[140px] sm:max-w-[160px] object-contain"
                />
              ) : (
                <BrandLogo size="md" variant="white" showTagline={false} />
              )}
              {isClient && (
                <span className="ml-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#0057D9] text-[#FFFFFF] rounded-md border border-[#0057D9]">
                  Partner Portal
                </span>
              )}
            </button>
          </div>

          {/* ========================================================
              DESKTOP & TABLET NAVIGATION MENU
              Strict 5 Approved Colors ONLY:
              1. White #FFFFFF
              2. Navy Blue #0B1F4D
              3. Blue #0057D9
              4. Yellow #FFD400
              5. Red #E60012
              ======================================================== */}
          <nav className="hidden xl:flex items-center gap-1 xl:gap-1.5 overflow-x-auto no-scrollbar py-1">
            {/* PUBLIC NAVIGATION (When Logged Out) */}
            {!user && (
              <>
                <button
                  id="public-nav-home"
                  onClick={() => handleNavClick('home')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'home'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Home className={`w-4 h-4 shrink-0 ${currentView === 'home' ? 'text-[#0057D9]' : 'text-[#0057D9]'}`} />
                  <span>Home</span>
                </button>

                <button
                  id="public-nav-task"
                  onClick={() => handleNavClick('available-tasks')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'tasks' || currentView === 'available-tasks'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <CheckSquare className={`w-4 h-4 shrink-0 ${currentView === 'tasks' || currentView === 'available-tasks' ? 'text-[#0057D9]' : 'text-[#0057D9]'}`} />
                  <span>Tasks</span>
                </button>

                <button
                  id="public-nav-explore-task"
                  onClick={() => handleNavClick('available-tasks')}
                  className="px-3 py-2 text-xs xl:text-sm font-bold text-[#FFFFFF] hover:bg-[#0057D9]/40 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#0057D9] shrink-0" />
                  <span>Explore Tasks</span>
                </button>

                <button
                  id="public-nav-wallet"
                  onClick={() => handleNavClick('wallet')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'wallet'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Wallet className="w-4 h-4 shrink-0 text-[#FFD400]" />
                  <span>Wallet</span>
                </button>

                <button
                  id="public-nav-how-it-works"
                  onClick={() => handleNavClick('how-it-works')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'how-it-works'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>How It Works</span>
                </button>

                <button
                  id="public-nav-refer-earn"
                  onClick={() => handleNavClick('refer-earn')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'refer-earn' || currentView === 'referrals'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0 text-[#FFD400]" />
                  <span>Refer & Earn</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md bg-[#FFD400] text-[#0B1F4D]">
                    ₹{referralRewardAmount}
                  </span>
                </button>

                <button
                  id="public-nav-incentives"
                  onClick={() => handleNavClick('incentives')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'incentives'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0 text-[#FFD400]" />
                  <span>Incentive Plans</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-[#E60012] text-[#FFFFFF]">
                    Up to ₹3,000
                  </span>
                </button>

                <button
                  id="public-nav-community"
                  onClick={() => handleNavClick('community')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'community'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>Community</span>
                </button>

                <button
                  id="public-nav-about"
                  onClick={() => handleNavClick('about')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'about'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>About Us</span>
                </button>
              </>
            )}

            {/* LOGGED-IN NORMAL USER MENU */}
            {isNormalUser && (
              <>
                <button
                  id="nav-home"
                  onClick={() => handleNavClick('home')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'home'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Home className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>{t('nav.home', 'Home')}</span>
                </button>

                <button
                  id="nav-dashboard"
                  onClick={() => handleNavClick('dashboard')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>{t('nav.dashboard', 'Dashboard')}</span>
                </button>

                <button
                  id="nav-tasks"
                  onClick={() => handleNavClick('tasks')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'tasks'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>{t('nav.tasks', 'Tasks')}</span>
                </button>

                <button
                  id="nav-explore-tasks"
                  onClick={() => handleNavClick('available-tasks')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'available-tasks'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Compass className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>{t('nav.exploreTasks', 'Explore Tasks')}</span>
                </button>

                <button
                  id="nav-wallet"
                  onClick={() => handleNavClick('wallet')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'wallet' || currentView === 'withdrawals'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Wallet className="w-4 h-4 shrink-0 text-[#FFD400]" />
                  <span>{t('nav.wallet', 'Wallet')}</span>
                </button>

                <button
                  id="nav-how-it-works"
                  onClick={() => handleNavClick('how-it-works')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'how-it-works'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>{t('nav.howItWorks', 'How It Works')}</span>
                </button>

                <button
                  id="nav-refer-earn"
                  onClick={() => handleNavClick('referrals')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'referrals' || currentView === 'refer-earn'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0 text-[#FFD400]" />
                  <span>{t('nav.referEarn', 'Refer & Earn')}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md bg-[#FFD400] text-[#0B1F4D]">
                    ₹{referralRewardAmount}
                  </span>
                </button>

                <button
                  id="nav-incentives"
                  onClick={() => handleNavClick('incentives')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'incentives' || currentView === 'incentive-plans'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0 text-[#FFD400]" />
                  <span>Incentive Plans</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-[#E60012] text-[#FFFFFF]">
                    Bonus
                  </span>
                </button>

                <button
                  id="nav-community"
                  onClick={() => handleNavClick('community')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'community'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>{t('nav.community', 'Community')}</span>
                </button>

                <button
                  id="nav-about-us"
                  onClick={() => handleNavClick('about')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'about'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>{t('nav.aboutUs', 'About Us')}</span>
                </button>

                <button
                  id="nav-profile"
                  onClick={() => handleNavClick('profile')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    currentView === 'profile'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <UserIcon className="w-4 h-4 shrink-0 text-[#0057D9]" />
                  <span>{t('nav.profile', 'Profile')}</span>
                </button>

                <button
                  id="nav-logout-top"
                  onClick={onLogout}
                  className="px-3 py-2 text-xs xl:text-sm font-bold text-[#E60012] hover:text-[#FFFFFF] hover:bg-[#E60012] rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  title="Sign Out of Account"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>{t('nav.logout', 'Logout')}</span>
                </button>
              </>
            )}

            {/* ADMIN CONSOLE MENU (When in Admin) */}
            {isAdmin && currentView.startsWith('admin-') && (
              <>
                <button
                  id="admin-nav-dashboard"
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'admin-dashboard' 
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md' 
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Layers className="w-4 h-4 text-[#0057D9]" />
                  <span>Dashboard</span>
                </button>
                <button
                  id="admin-nav-tasks"
                  onClick={() => handleNavClick('admin-tasks')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'admin-tasks' 
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md' 
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-[#0057D9]" />
                  <span>Tasks</span>
                </button>
                <button
                  id="admin-nav-campaigns"
                  onClick={() => handleNavClick('admin-campaigns')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'admin-campaigns' 
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md' 
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#FFD400]" />
                  <span>Campaigns</span>
                </button>
                <button
                  id="admin-nav-submissions"
                  onClick={() => handleNavClick('admin-submissions')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'admin-submissions' 
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md' 
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <FileCheck className="w-4 h-4 text-[#0057D9]" />
                  <span>Submissions</span>
                </button>
                <button
                  id="admin-nav-withdrawals"
                  onClick={() => handleNavClick('admin-withdrawals')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'admin-withdrawals' 
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md' 
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-[#FFD400]" />
                  <span>Withdrawals</span>
                </button>
                <button
                  id="admin-nav-users"
                  onClick={() => handleNavClick('admin-users')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'admin-users' 
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md' 
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Users className="w-4 h-4 text-[#0057D9]" />
                  <span>Users</span>
                </button>
                <button
                  id="admin-nav-settings"
                  onClick={() => handleNavClick('admin-settings')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'admin-settings' 
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md' 
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Settings className="w-4 h-4 text-[#0057D9]" />
                  <span>Settings</span>
                </button>
                <button
                  id="admin-switch-public"
                  onClick={() => handleNavClick('home')}
                  className="ml-2 px-3 py-1.5 text-xs font-bold rounded-xl border border-[#0057D9] text-[#FFFFFF] hover:bg-[#0057D9] transition-colors flex items-center gap-1.5"
                  title="Preview public user-facing site"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public View</span>
                </button>
              </>
            )}

            {/* CLIENT PORTAL MENU */}
            {isClient && (
              <>
                <button
                  id="client-nav-dashboard"
                  onClick={() => handleNavClick('client-dashboard')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'client-dashboard'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Layers className="w-4 h-4 text-[#0057D9]" />
                  <span>Dashboard</span>
                </button>
                <button
                  id="client-nav-campaigns"
                  onClick={() => handleNavClick('client-campaigns')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'client-campaigns'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-[#0057D9]" />
                  <span>Campaigns</span>
                </button>
                <button
                  id="client-nav-new-campaign"
                  onClick={() => handleNavClick('client-create-campaign')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'client-create-campaign'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-[#FFD400]" />
                  <span>New Campaign</span>
                </button>
                <button
                  id="client-nav-wallet"
                  onClick={() => handleNavClick('client-wallet')}
                  className={`px-3 py-2 text-xs xl:text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'client-wallet'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40 font-bold'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-[#FFD400]" />
                  <span>Wallet</span>
                </button>
              </>
            )}
          </nav>

          {/* ========================================================
              RIGHT ACTION CONTROLS
              Exclusively in 5 colors:
              1. White #FFFFFF
              2. Navy Blue #0B1F4D
              3. Blue #0057D9
              4. Yellow #FFD400
              5. Red #E60012
              ======================================================== */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

            {/* Dark/Light Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                showToast(t('settings.preferencesUpdated', 'Preferences updated.'));
              }}
              className="p-2 rounded-xl border border-[#0057D9]/50 bg-[#0B1F4D] text-[#FFFFFF] hover:bg-[#0057D9]/40 transition-colors cursor-pointer"
              title={isDark ? t('settings.light', 'Light') : t('settings.dark', 'Dark')}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#FFD400]" />
              ) : (
                <Moon className="w-4 h-4 text-[#FFFFFF]" />
              )}
            </button>

            {/* IF USER IS LOGGED IN */}
            {user ? (
              <>
                {/* Available Balance Pill (Direct 1-click shortcut to Wallet) */}
                {isNormalUser && wallet && (
                  <div 
                    id="header-wallet-pill"
                    onClick={() => handleNavClick('wallet')}
                    className="flex items-center gap-1.5 bg-[#FFD400] text-[#0B1F4D] font-black border border-[#FFD400] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                    title="Click to open Wallet & Payouts"
                  >
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0B1F4D] shrink-0" />
                    <span className="text-xs font-black hidden md:inline">
                      {t('nav.wallet', 'Wallet')}:
                    </span>
                    <span className="text-xs font-black font-mono">
                      ₹{wallet.availableBalance}
                    </span>
                  </div>
                )}

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    id="btn-notifications"
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setUserDropdownOpen(false);
                    }}
                    className="relative p-2 rounded-xl border border-[#0057D9]/50 bg-[#0B1F4D] text-[#FFFFFF] hover:bg-[#0057D9]/40 transition-colors cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E60012] text-[#FFFFFF] text-[10px] font-black flex items-center justify-center shadow-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0B1F4D] rounded-2xl shadow-2xl border border-[#0057D9] text-[#FFFFFF] z-50 overflow-hidden">
                      <div className="px-4 py-3 bg-[#0B1F4D] border-b border-[#0057D9] flex items-center justify-between">
                        <span className="font-bold text-sm text-[#FFFFFF]">
                          {t('common.notifications', 'Notifications')} ({unreadCount} unread)
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={onMarkAllNotificationsRead}
                            className="text-xs text-[#FFD400] hover:underline font-bold"
                          >
                            {t('common.markAllRead', 'Mark all read')}
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-[#0057D9]/40">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-[#FFFFFF]/80">
                            {t('common.noNotifications', 'No notifications yet')}
                          </div>
                        ) : (
                          notifications.slice(0, 6).map(n => (
                            <div
                              key={n.id}
                              onClick={() => {
                                onMarkNotificationRead(n.id);
                                if (n.link) {
                                  handleNavClick(n.link.replace('/', ''));
                                }
                                setNotificationsOpen(false);
                              }}
                              className={`p-3.5 hover:bg-[#0057D9]/40 cursor-pointer transition-colors ${
                                !n.isRead ? 'bg-[#0057D9]/20' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-[#FFFFFF] leading-snug">{n.title}</h4>
                                <span className="text-[10px] text-[#FFD400] shrink-0">
                                  {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-[#FFFFFF]/90 mt-1 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Dropdown */}
                <div className="relative hidden sm:block">
                  <button
                    id="btn-user-dropdown"
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-[#0057D9]/50 bg-[#0B1F4D] hover:bg-[#0057D9]/40 text-[#FFFFFF] transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FFFFFF] text-[#0B1F4D] flex items-center justify-center font-black text-xs shadow-xs">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-[#FFFFFF] truncate max-w-[100px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#FFFFFF]" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#0B1F4D] rounded-2xl shadow-2xl border border-[#0057D9] text-[#FFFFFF] z-50 py-1.5">
                      <div className="px-4 py-2.5 border-b border-[#0057D9]">
                        <p className="text-xs font-black text-[#FFFFFF]">{user.name}</p>
                        <p className="text-[11px] text-[#FFFFFF]/80 truncate">{user.email}</p>
                        {user.referralCode && (
                          <p className="text-[10px] font-mono mt-1 text-[#FFD400] bg-[#0057D9]/30 px-2 py-0.5 rounded-md inline-block border border-[#0057D9] font-bold">
                            Code: {user.referralCode}
                          </p>
                        )}
                      </div>

                      {isClient ? (
                        <>
                          <button
                            onClick={() => handleNavClick('client-dashboard')}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#0057D9]/40 flex items-center gap-2"
                          >
                            <Layers className="w-3.5 h-3.5 text-[#0057D9]" />
                            Campaign Dashboard
                          </button>
                          <button
                            onClick={() => handleNavClick('client-wallet')}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#0057D9]/40 flex items-center gap-2"
                          >
                            <Wallet className="w-3.5 h-3.5 text-[#FFD400]" />
                            Account Balance
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleNavClick('dashboard')}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#0057D9]/40 flex items-center gap-2 cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5 text-[#0057D9]" />
                            {t('nav.dashboard', 'Dashboard')}
                          </button>
                          <button
                            onClick={() => handleNavClick('profile')}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#0057D9]/40 flex items-center gap-2"
                          >
                            <UserIcon className="w-3.5 h-3.5 text-[#0057D9]" />
                            {t('nav.profile', 'Profile')}
                          </button>
                          <button
                            onClick={() => handleNavClick('wallet')}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#0057D9]/40 flex items-center gap-2"
                          >
                            <Wallet className="w-3.5 h-3.5 text-[#FFD400]" />
                            {t('nav.wallet', 'Wallet')}
                          </button>
                          <button
                            onClick={() => handleNavClick('referrals')}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#0057D9]/40 flex items-center gap-2"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-[#FFD400]" />
                                {t('nav.referEarn', 'Refer & Earn')} ₹{referralRewardAmount}
                              </span>
                              <span className="text-[10px] font-black text-[#0B1F4D] bg-[#FFD400] px-1.5 py-0.5 rounded shadow-xs">
                                ₹{wallet?.referralRewards ?? 0}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleNavClick('incentives')}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#0057D9]/40 flex items-center gap-2"
                          >
                            <Award className="w-3.5 h-3.5 text-[#FFD400]" />
                            <span>Incentive Plans</span>
                          </button>
                        </>
                      )}

                      <div className="border-t border-[#0057D9] my-1" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[#E60012] hover:bg-[#E60012] hover:text-[#FFFFFF] flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('nav.logout', 'Logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* LOGGED OUT STATE */
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* Public Notification Bell Icon */}
                <button
                  id="btn-public-notifications"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative p-2 rounded-xl border border-[#0057D9]/50 bg-[#0B1F4D] text-[#FFFFFF] hover:bg-[#0057D9]/40 transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E60012] text-[#FFFFFF] text-[9px] font-bold flex items-center justify-center shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover for Public */}
                {notificationsOpen && (
                  <div className="absolute right-4 mt-12 w-80 bg-[#0B1F4D] rounded-2xl shadow-2xl border border-[#0057D9] z-50 overflow-hidden text-[#FFFFFF]">
                    <div className="px-4 py-3 bg-[#0B1F4D] border-b border-[#0057D9] flex items-center justify-between">
                      <span className="font-bold text-xs text-[#FFFFFF]">
                        Platform Announcements
                      </span>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[#FFFFFF] hover:text-[#FFD400]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 space-y-2 text-xs text-[#FFFFFF]/90">
                      <div className="p-2.5 rounded-xl bg-[#0057D9]/20 border border-[#0057D9]">
                        <p className="font-bold text-[#FFFFFF]">🚀 Welcome to DSK TaskMarketer!</p>
                        <p className="text-[11px] text-[#FFFFFF]/80 mt-0.5">Complete verified tasks and earn instant wallet payouts.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Login Button */}
                <button
                  id="btn-nav-login"
                  onClick={() => handleNavClick('login')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#FFFFFF] bg-[#0057D9]/40 hover:bg-[#0057D9] rounded-full border border-[#0057D9] shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  Login
                </button>

                {/* Sign Up Button */}
                <button
                  id="btn-nav-register"
                  onClick={() => handleNavClick('register')}
                  className="px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-black bg-[#FFD400] hover:opacity-90 text-[#0B1F4D] rounded-full shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl border border-[#0057D9]/50 bg-[#0B1F4D] text-[#FFFFFF] hover:bg-[#0057D9]/40 transition-colors cursor-pointer flex items-center justify-center ml-1"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#FFFFFF]" /> : <Menu className="w-5 h-5 text-[#FFFFFF]" />}
            </button>

          </div>
        </div>

        {/* ========================================================
            RESPONSIVE MOBILE / TABLET MENU DRAWER
            Strict 5 Approved Colors ONLY:
            1. White #FFFFFF
            2. Navy Blue #0B1F4D
            3. Blue #0057D9
            4. Yellow #FFD400
            5. Red #E60012
            ======================================================== */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-[#0057D9]/40 bg-[#0B1F4D] px-3 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
            <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-[#FFD400]">
              Navigation Menu
            </div>

            {/* LOGGED OUT MOBILE MENU */}
            {!user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleNavClick('home')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'home'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-[#0057D9]" />
                    <span>Home</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('available-tasks')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'tasks' || currentView === 'available-tasks'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-[#0057D9]" />
                    <span>Tasks</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('available-tasks')}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer text-[#FFFFFF] hover:bg-[#0057D9]/40"
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-[#0057D9]" />
                    <span>Explore Tasks</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('wallet')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'wallet'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-[#FFD400]" />
                    <span>Wallet</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'how-it-works'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-[#0057D9]" />
                    <span>How It Works</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('refer-earn')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'refer-earn' || currentView === 'referrals'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#FFD400]" />
                    <span>Refer & Earn</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-[#FFD400] text-[#0B1F4D]">
                    ₹{referralRewardAmount}
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('incentives')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'incentives'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-[#FFD400]" />
                    <span>Incentive Plans</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-[#E60012] text-[#FFFFFF]">
                    Up to ₹3,000
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('community')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'community'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-[#0057D9]" />
                    <span>Community</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('about')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'about'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-[#0057D9]" />
                    <span>About Us</span>
                  </div>
                </button>
              </div>
            )}

            {/* LOGGED IN USER MOBILE MENU */}
            {user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleNavClick('home')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'home'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-[#0057D9]" />
                    <span>{t('nav.home', 'Home')}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#0057D9]" />
                    <span>{t('nav.dashboard', 'Dashboard')}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('tasks')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'tasks'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-[#0057D9]" />
                    <span>{t('nav.tasks', 'Tasks')}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('available-tasks')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'available-tasks'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-[#0057D9]" />
                    <span>{t('nav.exploreTasks', 'Explore Tasks')}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('wallet')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'wallet' || currentView === 'withdrawals'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-[#FFD400]" />
                    <span>{t('nav.wallet', 'Wallet')}</span>
                  </div>
                  {wallet && (
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-[#FFD400] text-[#0B1F4D]">
                      ₹{wallet.availableBalance}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'how-it-works'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-[#0057D9]" />
                    <span>{t('nav.howItWorks', 'How It Works')}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('referrals')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'referrals' || currentView === 'refer-earn'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#FFD400]" />
                    <span>{t('nav.referEarn', 'Refer & Earn')}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-[#FFD400] text-[#0B1F4D]">
                    ₹{referralRewardAmount}
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('incentives')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'incentives' || currentView === 'incentive-plans'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-[#FFD400]" />
                    <span>Incentive Plans</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-[#E60012] text-[#FFFFFF]">
                    Bonus
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('community')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'community'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-[#0057D9]" />
                    <span>{t('nav.community', 'Community')}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('about')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'about'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-[#0057D9]" />
                    <span>{t('nav.aboutUs', 'About Us')}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('profile')}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'profile'
                      ? 'bg-[#FFFFFF] text-[#0B1F4D] font-black shadow-md'
                      : 'text-[#FFFFFF] hover:bg-[#0057D9]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserIcon className="w-4 h-4 text-[#0057D9]" />
                    <span>{t('nav.profile', 'Profile')}</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer text-[#E60012] hover:text-[#FFFFFF] hover:bg-[#E60012]"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.logout', 'Logout')}</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
};
