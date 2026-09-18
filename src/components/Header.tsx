import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Wallet, 
  Sparkles, 
  ChevronDown, 
  Users, 
  Settings, 
  Sun, 
  Moon, 
  FileCheck,
  Briefcase,
  Layers,
  Home,
  CheckSquare,
  Compass,
  HelpCircle,
  MessageSquare,
  Info,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  Gift,
  BarChart3
} from 'lucide-react';
import { User, WalletSummary, NotificationItem, PlatformSettings } from '../types';
import { useTranslation } from '../locales';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { MobileDrawer } from './MobileDrawer';

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
  const { theme, isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isNormalUser = user && !isAdmin && !isClient;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 xl:gap-5 shrink-0">
            <button
              id="brand-logo-btn"
              onClick={() => {
                if (isAdmin && currentView.startsWith('admin-')) onNavigate('admin-dashboard');
                else onNavigate('home');
              }}
              className="flex items-center gap-2.5 focus:outline-hidden text-left group cursor-pointer"
            >
              {customLogo || settings?.logoUrl ? (
                <img
                  src={customLogo || settings?.logoUrl}
                  alt={settings?.platformName || 'DSK TaskMarketer'}
                  className="h-9 sm:h-10 max-w-[150px] object-contain"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs font-black text-sm">
                  DSK
                </div>
              )}
              <div className="hidden sm:block">
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  {settings?.platformName || 'DSK TaskMarketer'}
                  {isClient && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-900/50">
                      Partner Portal
                    </span>
                  )}
                </span>
              </div>
            </button>
          </div>

          {/* ========================================================
              MIDDLE NAVIGATION MENU: ONLY VISIBLE WHEN USER IS LOGGED IN!
              When logged out: Absolutely NO authenticated menu is shown.
              ======================================================== */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto no-scrollbar py-1">
              {/* ADMIN CONSOLE MENU */}
              {isAdmin && currentView.startsWith('admin-') ? (
                <>
                  <button
                    id="admin-nav-dashboard"
                    onClick={() => onNavigate('admin-dashboard')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'admin-dashboard' 
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black' 
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    id="admin-nav-tasks"
                    onClick={() => onNavigate('admin-tasks')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'admin-tasks' 
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black' 
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Tasks</span>
                  </button>
                  <button
                    id="admin-nav-campaigns"
                    onClick={() => onNavigate('admin-campaigns')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'admin-campaigns' 
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black' 
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Campaigns</span>
                  </button>
                  <button
                    id="admin-nav-submissions"
                    onClick={() => onNavigate('admin-submissions')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'admin-submissions' 
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black' 
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileCheck className="w-4 h-4 text-blue-500" />
                    <span>Submissions</span>
                  </button>
                  <button
                    id="admin-nav-withdrawals"
                    onClick={() => onNavigate('admin-withdrawals')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'admin-withdrawals' 
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black' 
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-indigo-500" />
                    <span>Withdrawals</span>
                  </button>
                  <button
                    id="admin-nav-users"
                    onClick={() => onNavigate('admin-users')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'admin-users' 
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black' 
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4 text-teal-500" />
                    <span>Users</span>
                  </button>
                  <button
                    id="admin-nav-settings"
                    onClick={() => onNavigate('admin-settings')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'admin-settings' 
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black' 
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Settings</span>
                  </button>
                  
                  {/* Switch to Public Site */}
                  <button
                    id="admin-switch-public"
                    onClick={() => onNavigate('home')}
                    className="ml-2 px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors flex items-center gap-1.5"
                    title="Preview public user-facing site"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Public View</span>
                  </button>
                </>
              ) : isClient ? (
                /* CLIENT PORTAL MENU */
                <>
                  <button
                    id="client-nav-dashboard"
                    onClick={() => onNavigate('client-dashboard')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'client-dashboard'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    id="client-nav-campaigns"
                    onClick={() => onNavigate('client-campaigns')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'client-campaigns'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Campaigns</span>
                  </button>
                  <button
                    id="client-nav-new-campaign"
                    onClick={() => onNavigate('client-create-campaign')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'client-create-campaign'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>New Campaign</span>
                  </button>
                  <button
                    id="client-nav-wallet"
                    onClick={() => onNavigate('client-wallet')}
                    className={`px-3 py-2 text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                      currentView === 'client-wallet'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 shadow-2xs font-black'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-indigo-600" />
                    <span>Wallet</span>
                  </button>
                </>
              ) : (
                /* ========================================================
                   COMPLETE LOGGED-IN NORMAL USER MENU (Requirement 1 & 6):
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
                   ======================================================== */
                <>
                  {/* 1. Home */}
                  <button
                    id="nav-home"
                    onClick={() => onNavigate('home')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'home'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('nav.home', 'Home')}</span>
                  </button>

                  {/* 2. Dashboard */}
                  <button
                    id="nav-dashboard"
                    onClick={() => onNavigate('dashboard')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'dashboard'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{t('nav.dashboard', 'Dashboard')}</span>
                  </button>

                  {/* 3. Tasks */}
                  <button
                    id="nav-tasks"
                    onClick={() => onNavigate('tasks')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'tasks'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('nav.tasks', 'Tasks')}</span>
                  </button>

                  {/* 4. Explore Tasks */}
                  <button
                    id="nav-explore-tasks"
                    onClick={() => onNavigate('available-tasks')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'available-tasks'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>{t('nav.exploreTasks', 'Explore Tasks')}</span>
                  </button>

                  {/* 4. Wallet (Dedicated Requirement 2) */}
                  <button
                    id="nav-wallet"
                    onClick={() => onNavigate('wallet')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'wallet' || currentView === 'withdrawals'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{t('nav.wallet', 'Wallet')}</span>
                  </button>

                  {/* 5. How It Works */}
                  <button
                    id="nav-how-it-works"
                    onClick={() => onNavigate('how-it-works')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'how-it-works'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{t('nav.howItWorks', 'How It Works')}</span>
                  </button>

                  {/* 6. Refer & Earn */}
                  <button
                    id="nav-refer-earn"
                    onClick={() => onNavigate('referrals')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'referrals' || currentView === 'refer-earn'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{t('nav.referEarn', 'Refer & Earn')}</span>
                  </button>

                  {/* 7. Community */}
                  <button
                    id="nav-community"
                    onClick={() => onNavigate('community')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'community'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>{t('nav.community', 'Community')}</span>
                  </button>

                  {/* 8. About Us */}
                  <button
                    id="nav-about-us"
                    onClick={() => onNavigate('about')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'about'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Info className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                    <span>{t('nav.aboutUs', 'About Us')}</span>
                  </button>

                  {/* 9. Profile / Account */}
                  <button
                    id="nav-profile"
                    onClick={() => onNavigate('profile')}
                    className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentView === 'profile'
                        ? 'text-emerald-950 dark:text-white bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 shadow-xs font-black'
                        : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                    <span>{t('nav.profile', 'Profile')}</span>
                  </button>

                  {/* 10. Logout */}
                  <button
                    id="nav-logout-top"
                    onClick={onLogout}
                    className="px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-extrabold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    title="Sign Out of Account"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>{t('nav.logout', 'Logout')}</span>
                  </button>
                </>
              )}
            </nav>
          )}

          {/* ========================================================
              RIGHT ACTION CONTROLS:
              - When Logged Out: ONLY [Sign Up] and [Sign In] (+ Theme)
              - When Logged In: Notifications, Wallet Balance, Profile Avatar, Mobile Hamburger
              ======================================================== */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Dark/Light Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                showToast(t('settings.preferencesUpdated', 'Preferences updated.'));
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDark ? t('settings.light', 'Light') : t('settings.dark', 'Dark')}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              )}
            </button>

            {/* IF USER IS LOGGED IN */}
            {user ? (
              <>
                {/* Available Balance Pill (Direct 1-click shortcut to Wallet) */}
                {isNormalUser && wallet && (
                  <div 
                    id="header-wallet-pill"
                    onClick={() => onNavigate('wallet')}
                    className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 rounded-full cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-colors shadow-2xs"
                    title="Click to open Wallet & Payouts"
                  >
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hidden md:inline">
                      {t('nav.wallet', 'Wallet')}:
                    </span>
                    <span className="text-xs font-black text-emerald-950 dark:text-emerald-100 font-mono">
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
                    className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {t('common.notifications', 'Notifications')} ({unreadCount} unread)
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={onMarkAllNotificationsRead}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                          >
                            {t('common.markAllRead', 'Mark all read')}
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            {t('common.noNotifications', 'No notifications yet')}
                          </div>
                        ) : (
                          notifications.slice(0, 6).map(n => (
                            <div
                              key={n.id}
                              onClick={() => {
                                onMarkNotificationRead(n.id);
                                if (n.link) {
                                  onNavigate(n.link.replace('/', ''));
                                }
                                setNotificationsOpen(false);
                              }}
                              className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                                !n.isRead ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{n.title}</h4>
                                <span className="text-[10px] text-slate-500 shrink-0">
                                  {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
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
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        {user.referralCode && (
                          <p className="text-[10px] font-mono mt-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md inline-block border border-emerald-200 dark:border-emerald-800">
                            Code: {user.referralCode}
                          </p>
                        )}
                      </div>

                      {isClient ? (
                        <>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onNavigate('client-dashboard');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            Campaign Dashboard
                          </button>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onNavigate('client-wallet');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            Account Balance
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onNavigate('dashboard');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            {t('nav.dashboard', 'Dashboard')}
                          </button>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onNavigate('profile');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <UserIcon className="w-3.5 h-3.5" />
                            {t('nav.profile', 'Profile')}
                          </button>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onNavigate('wallet');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            {t('nav.wallet', 'Wallet')}
                          </button>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onNavigate('referrals');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            {t('nav.referEarn', 'Refer & Earn')}
                          </button>
                        </>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('nav.logout', 'Logout')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Hamburger Menu Trigger (Mobile only when logged in) */}
                <div className="flex lg:hidden items-center">
                  <button
                    id="mobile-menu-hamburger-btn"
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                  >
                    {mobileMenuOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* ========================================================
                 LOGGED OUT STATE (Requirement 3 & 7):
                 Only [Sign Up] and [Sign In]
                 NO authenticated menu.
                 Both buttons clearly visible on both mobile and desktop!
                 ======================================================== */
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  id="btn-nav-login"
                  onClick={() => onNavigate('login')}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                >
                  {t('nav.signIn', 'Sign In')}
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => onNavigate('register')}
                  className="px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  {t('nav.signUp', 'Sign Up')}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Slide-out Mobile Drawer: ONLY used when user is logged in to show the full menu */}
      {user && (
        <MobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
          wallet={wallet}
          unreadCount={unreadCount}
          currentView={currentView}
          onNavigate={onNavigate}
          onLogout={onLogout}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          settings={settings}
        />
      )}
    </header>
  );
};
