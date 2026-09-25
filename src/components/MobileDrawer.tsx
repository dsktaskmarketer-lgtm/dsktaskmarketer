import React, { useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  Shield, 
  User as UserIcon, 
  LogOut, 
  X, 
  Wallet, 
  ChevronRight,
  Users,
  Sun,
  Moon,
  Home,
  Briefcase,
  Layers,
  CheckSquare,
  Compass,
  HelpCircle,
  MessageSquare,
  Info,
  Gift,
  BarChart3,
  Award,
  Copy,
  Check,
  PlusCircle,
  TrendingUp,
  Sparkles
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

// Framer Motion Animation Variants for Hardware Acceleration
const backdropVariants: Variants = {
  hidden: { 
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  visible: { 
    opacity: 1,
    transition: { duration: 0.25, ease: [0, 0, 0.2, 1] }
  }
};

const drawerVariants: Variants = {
  hidden: { 
    x: '100%',
    opacity: 0.95,
    transition: { 
      type: 'spring',
      damping: 34,
      stiffness: 380,
      mass: 0.8
    }
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: { 
      type: 'spring',
      damping: 32,
      stiffness: 340,
      mass: 0.8,
      staggerChildren: 0.03,
      delayChildren: 0.05
    }
  },
  exit: {
    x: '100%',
    opacity: 0.95,
    transition: { 
      type: 'spring',
      damping: 36,
      stiffness: 400,
      mass: 0.7
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: 'spring', 
      damping: 24, 
      stiffness: 320 
    } 
  }
};

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  wallet,
  currentView,
  onNavigate,
  onLogout,
  settings
}) => {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [copiedCode, setCopiedCode] = React.useState(false);

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

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isNormalUser = user && !isAdmin && !isClient;

  const handleNav = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const copyReferral = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`Referral code ${code} copied!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div 
          id="mobile-drawer-root"
          className="lg:hidden fixed inset-0 z-50 overflow-hidden" 
          role="dialog" 
          aria-modal="true"
        >
          {/* Hardware-Accelerated Backdrop with subtle blur so it never obstructs spatial orientation */}
          <motion.div 
            id="mobile-drawer-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{ 
              willChange: 'opacity',
              transform: 'translateZ(0)'
            }}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel with Framer Motion Spring & Swipe-to-Dismiss */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 pointer-events-none">
            <motion.aside 
              id="mobile-drawer-panel"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 75 || info.velocity.x > 350) {
                  onClose();
                }
              }}
              style={{ 
                willChange: 'transform',
                transform: 'translate3d(0,0,0)',
                backfaceVisibility: 'hidden'
              }}
              className="pointer-events-auto w-[85vw] max-w-[360px] sm:max-w-[390px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200/80 dark:border-slate-800 h-full select-none relative"
            >
              
              {/* Swipe-to-dismiss Drag Pill Indicator */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-slate-300 dark:bg-slate-700 rounded-full opacity-60 pointer-events-none" />

              {/* Drawer Header: DSK Brand Mark, Platform Title & Dismiss Button */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/90 dark:border-slate-800/90 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs border border-white/20">
                    DSK
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-sm text-slate-900 dark:text-white truncate block leading-tight">
                      {settings?.platformName || 'DSK TaskMarketer'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Verified Platform
                    </span>
                  </div>
                </div>
                <button
                  id="mobile-drawer-close-btn"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content with Fluid Micro-Stagger */}
              <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3.5 overscroll-contain">
                
                {/* User Session Profile & Wallet Status (When Logged In) */}
                {user && (
                  <motion.div 
                    variants={itemVariants}
                    className="p-3.5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-850 dark:to-slate-900 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs border border-white/30">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate leading-tight">{user.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                        </div>
                      </div>
                      
                      {user.referralCode && (
                        <button
                          onClick={() => copyReferral(user.referralCode!)}
                          className="flex items-center gap-1 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-950/90 px-2 py-1 rounded-lg shrink-0 border border-blue-300/80 dark:border-blue-700/80 hover:bg-blue-200 transition-colors cursor-pointer"
                          title="Copy referral code"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{user.referralCode}</span>
                        </button>
                      )}
                    </div>

                    {isNormalUser && wallet && (
                      <div className="flex items-center justify-between p-2.5 bg-amber-500/10 dark:bg-amber-950/40 rounded-xl border border-amber-300/60 dark:border-amber-700/50">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black shadow-2xs">
                            <Wallet className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider leading-none">Available Balance</div>
                            <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">₹{wallet.availableBalance.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNav('wallet')}
                          className="px-2.5 py-1 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          Wallet
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Top Quick Actions Bento Grid (1-Tap Fast Jump) */}
                <motion.div variants={itemVariants} className="grid grid-cols-4 gap-1.5">
                  <button
                    id="mobile-quick-tasks"
                    onClick={() => handleNav(user ? 'tasks' : 'available-tasks')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 hover:border-blue-400 transition-all text-center cursor-pointer group active:scale-95"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate w-full">Tasks</span>
                  </button>

                  <button
                    id="mobile-quick-explore"
                    onClick={() => handleNav('available-tasks')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50 hover:border-teal-400 transition-all text-center cursor-pointer group active:scale-95"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                      <Compass className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate w-full">Explore</span>
                  </button>

                  <button
                    id="mobile-quick-incentives"
                    onClick={() => handleNav('incentives')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600/70 hover:border-amber-500 transition-all text-center cursor-pointer group relative shadow-2xs active:scale-95"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition-transform font-black">
                      <Award className="w-3.5 h-3.5 text-slate-950" />
                    </div>
                    <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 truncate w-full">Incentives</span>
                    <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-red-600 text-white text-[8px] font-black rounded-full shadow-2xs animate-pulse">
                      NEW
                    </span>
                  </button>

                  <button
                    id="mobile-quick-wallet"
                    onClick={() => handleNav(user ? 'wallet' : 'login')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 hover:border-indigo-400 transition-all text-center cursor-pointer group active:scale-95"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate w-full">{user ? 'Wallet' : 'Login'}</span>
                  </button>
                </motion.div>

                {/* Featured 3-Plan Monthly Incentive Quick Access Banner */}
                <motion.div 
                  variants={itemVariants}
                  id="mobile-drawer-incentive-banner"
                  onClick={() => handleNav('incentives')}
                  className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 shadow-md border border-amber-300 dark:border-amber-500/40 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/15 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-950 uppercase tracking-wider">Monthly Incentives</span>
                          <span className="text-[9px] font-black bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded-full">3 Plans</span>
                        </div>
                        <p className="text-[11px] font-extrabold text-slate-900/90 truncate">Earn Up to ₹3,700+/mo Extra Bonus</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-950/15 flex items-center justify-center text-slate-950 shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>

                {/* Public Visitor Menu (When Not Logged In) */}
                {!user && (
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 flex items-center justify-between">
                      <span>Explore DSK TaskMarketer</span>
                    </div>

                    {/* Home */}
                    <button
                      id="mobile-public-home"
                      onClick={() => handleNav('home')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'home'
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 font-black'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                          <Home className="w-3.5 h-3.5" />
                        </div>
                        <span>Home</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Incentive Plans */}
                    <button
                      id="mobile-public-incentives"
                      onClick={() => handleNav('incentives')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'incentives' || currentView === 'incentive-plans'
                          ? 'bg-amber-100 dark:bg-amber-950/90 text-amber-950 dark:text-white border-2 border-amber-500 font-black'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-2xs">
                          <Award className="w-3.5 h-3.5" />
                        </div>
                        <span>Incentive Plans</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950">
                          Bonus
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>

                    {/* Explore Tasks */}
                    <button
                      id="mobile-public-explore-tasks"
                      onClick={() => handleNav('available-tasks')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'available-tasks'
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 font-black'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-2xs">
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <span>Explore Tasks</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* How It Works */}
                    <button
                      id="mobile-public-how-it-works"
                      onClick={() => handleNav('how-it-works')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'how-it-works'
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 font-black'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-2xs">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </div>
                        <span>How It Works</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Community */}
                    <button
                      id="mobile-public-community"
                      onClick={() => handleNav('community')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'community'
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 font-black'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <span>Community</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* About Us */}
                    <button
                      id="mobile-public-about"
                      onClick={() => handleNav('about')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'about'
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 font-black'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shadow-2xs">
                          <Info className="w-3.5 h-3.5" />
                        </div>
                        <span>About Us</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Auth CTAs */}
                    <div className="pt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleNav('login')}
                        className="py-2.5 px-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 font-extrabold text-xs text-slate-900 dark:text-white text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => handleNav('register')}
                        className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 font-black text-xs text-white text-center shadow-md shadow-red-600/30 transition-all hover:scale-102 active:scale-95 cursor-pointer"
                      >
                        Sign Up Free
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Complete Authenticated Navigation Menu */}
                {isNormalUser && (
                  <motion.div variants={itemVariants} className="space-y-1">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 flex items-center justify-between">
                      <span>{t('nav.menu', 'Navigation Menu')}</span>
                    </div>

                    {/* 1. Home */}
                    <button 
                      id="mobile-nav-home"
                      onClick={() => handleNav('home')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'home' 
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'home' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
                          <Home className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.home', 'Home')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* 2. Dashboard */}
                    <button 
                      id="mobile-nav-dashboard"
                      onClick={() => handleNav('dashboard')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'dashboard' 
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                          <BarChart3 className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.dashboard', 'Dashboard')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* 3. Tasks */}
                    <button 
                      id="mobile-nav-tasks"
                      onClick={() => handleNav('tasks')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'tasks'
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'tasks' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
                          <CheckSquare className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.tasks', 'Tasks')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* 4. Explore Tasks */}
                    <button 
                      id="mobile-nav-explore-tasks"
                      onClick={() => handleNav('available-tasks')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'available-tasks'
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'available-tasks' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.exploreTasks', 'Explore Tasks')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* 5. Incentive Plans (Highlighted) */}
                    <button 
                      id="mobile-nav-incentives"
                      onClick={() => handleNav('incentives')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'incentives' || currentView === 'incentive-plans'
                          ? 'bg-amber-100 dark:bg-amber-950/90 text-amber-950 dark:text-white border-2 border-amber-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'incentives' || currentView === 'incentive-plans' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'}`}>
                          <Award className="w-3.5 h-3.5" />
                        </div>
                        <span>Incentive Plans</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950">
                          Bonus
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>

                    {/* 6. Wallet */}
                    <button 
                      id="mobile-nav-wallet"
                      onClick={() => handleNav('wallet')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'wallet' || currentView === 'withdrawals'
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'wallet' || currentView === 'withdrawals' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.wallet', 'Wallet')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* 7. Refer & Earn */}
                    <button 
                      id="mobile-nav-refer-earn"
                      onClick={() => handleNav('referrals')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'referrals' || currentView === 'refer-earn'
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'referrals' || currentView === 'refer-earn' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'}`}>
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.referEarn', 'Refer & Earn')}</span>
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        ₹{settings?.referralRewardAmount ?? 50}
                      </span>
                    </button>

                    {/* 8. How It Works */}
                    <button 
                      id="mobile-nav-how-it-works"
                      onClick={() => handleNav('how-it-works')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'how-it-works' 
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'how-it-works' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
                          <HelpCircle className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.howItWorks', 'How It Works')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* 9. Community */}
                    <button 
                      id="mobile-nav-community"
                      onClick={() => handleNav('community')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'community' 
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'community' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400'}`}>
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.community', 'Community')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* 10. Profile */}
                    <button 
                      id="mobile-nav-profile"
                      onClick={() => handleNav('profile')} 
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                        currentView === 'profile' 
                          ? 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-white border-2 border-blue-500 shadow-2xs font-black' 
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${currentView === 'profile' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.profile', 'Profile')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Logout */}
                    <button 
                      id="mobile-nav-logout"
                      onClick={() => {
                        onLogout();
                        onClose();
                      }} 
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <span>{t('nav.logout', 'Logout')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-rose-400" />
                    </button>
                  </motion.div>
                )}

                {/* Client Portal Options */}
                {isClient && (
                  <motion.div variants={itemVariants} className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 px-2 mb-1">
                      Partner Portal
                    </div>
                    <button onClick={() => handleNav('client-dashboard')} className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                      <span className="flex items-center gap-2.5"><Layers className="w-4 h-4 text-blue-500" /> Dashboard</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button onClick={() => handleNav('client-campaigns')} className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                      <span className="flex items-center gap-2.5"><Briefcase className="w-4 h-4 text-blue-500" /> My Campaigns</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button onClick={() => handleNav('client-create-campaign')} className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                      <span className="flex items-center gap-2.5"><PlusCircle className="w-4 h-4 text-emerald-500" /> New Campaign</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </motion.div>
                )}

                {/* Admin Portal Shortcut (If Admin) */}
                {isAdmin && (
                  <motion.div variants={itemVariants} className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 px-2 mb-1">
                      Administrator
                    </div>
                    <button onClick={() => handleNav('admin-dashboard')} className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold rounded-xl text-red-700 dark:text-red-300 bg-red-50/70 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer">
                      <span className="flex items-center gap-2.5"><Shield className="w-4 h-4 text-red-600" /> Admin Control Panel</span>
                      <ChevronRight className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </motion.div>
                )}

                {/* Theme Mode Switcher */}
                <motion.div variants={itemVariants} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      {isDark ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                      Appearance
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isDark ? 'Dark' : 'Light'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDark) toggleTheme();
                        showToast('Theme set to Light mode');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !isDark
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
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
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 text-white shadow-2xs border border-slate-700'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Dark</span>
                    </button>
                  </div>
                </motion.div>

              </div>
            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
