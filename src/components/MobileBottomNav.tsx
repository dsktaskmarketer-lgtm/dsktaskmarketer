import React from 'react';
import { 
  Home, 
  CheckSquare, 
  Wallet, 
  Users, 
  User as UserIcon,
  LogIn
} from 'lucide-react';
import { User } from '../types';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  user,
}) => {
  // Navigation tabs matching the reference image's mobile screen
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      view: 'home',
      requiresAuth: false,
    },
    {
      id: 'task',
      label: 'Tasks',
      icon: CheckSquare,
      view: user ? 'tasks' : 'available-tasks',
      requiresAuth: false,
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      view: 'wallet',
      requiresAuth: false,
    },
    {
      id: 'referral',
      label: 'Referral',
      icon: Users,
      view: 'referrals',
      requiresAuth: false,
    },
    {
      id: 'profile',
      label: user ? 'Profile' : 'Sign In',
      icon: user ? UserIcon : LogIn,
      view: user ? 'profile' : 'login',
      requiresAuth: false,
    },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.id === 'home' && currentView === 'home') return true;
    if (item.id === 'task' && (currentView === 'tasks' || currentView === 'available-tasks')) return true;
    if (item.id === 'wallet' && (currentView === 'wallet' || currentView === 'withdrawals')) return true;
    if (item.id === 'referral' && currentView === 'referrals') return true;
    if (item.id === 'profile' && (currentView === 'profile' || currentView === 'login' || currentView === 'register')) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden py-1 px-2 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`mobile-bottom-nav-${item.id}`}
              onClick={() => onNavigate(item.view)}
              className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] relative cursor-pointer group"
            >
              {active && (
                <span className="absolute -top-1 w-8 h-1 bg-red-600 rounded-full animate-in fade-in duration-200" />
              )}
              <div className={`p-1 rounded-xl transition-all ${
                active 
                  ? 'text-red-600 dark:text-red-500 scale-105' 
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-tight font-bold transition-colors ${
                active 
                  ? 'text-red-600 dark:text-red-500 font-extrabold' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
