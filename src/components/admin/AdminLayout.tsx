import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Users, 
  CheckSquare, 
  FileCheck, 
  Wallet, 
  ArrowUpRight, 
  Gift, 
  Settings, 
  LogOut, 
  ExternalLink,
  Shield,
  Menu,
  X,
  Database
} from 'lucide-react';
import { User, PlatformSettings } from '../../types';

export type AdminTab = 
  | 'overview' 
  | 'users' 
  | 'tasks' 
  | 'submissions' 
  | 'wallet' 
  | 'withdrawals' 
  | 'referrals' 
  | 'settings';

interface AdminLayoutProps {
  user: User;
  settings?: PlatformSettings;
  activeTab: AdminTab;
  pendingWithdrawalsCount?: number;
  pendingSubmissionsCount?: number;
  onTabChange: (tab: AdminTab) => void;
  onAdminLogout: () => void;
  onNavigateToUserApp: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  settings,
  activeTab,
  pendingWithdrawalsCount = 0,
  pendingSubmissionsCount = 0,
  onTabChange,
  onAdminLogout,
  onNavigateToUserApp,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks / Campaigns', icon: <CheckSquare className="w-4 h-4" /> },
    { 
      id: 'submissions', 
      label: 'Submissions', 
      icon: <FileCheck className="w-4 h-4" />, 
      badge: pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined 
    },
    { id: 'wallet', label: 'Wallet / Earnings', icon: <Wallet className="w-4 h-4" /> },
    { 
      id: 'withdrawals', 
      label: 'Withdrawals', 
      icon: <ArrowUpRight className="w-4 h-4" />, 
      badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : undefined 
    },
    { id: 'referrals', label: 'Referrals', icon: <Gift className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Admin Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onTabChange('overview')}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs font-black text-sm border border-emerald-400/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                    <span>{settings?.platformName || 'DSK TaskMarketer'}</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 rounded border border-rose-800">
                      Admin Portal
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                    Super Administrator Console
                  </div>
                </div>
              </button>
            </div>

            {/* Right: Security info, User App link & Logout button */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Security Pill */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-emerald-400">
                <Database className="w-3 h-3 text-emerald-500" />
                <span>Supabase RLS Active</span>
              </div>

              {/* Verified Admin User Pill */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-slate-200">{user.email}</span>
              </div>

              {/* View Public User App button */}
              <button
                onClick={onNavigateToUserApp}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="Open Public User Website"
              >
                <span>View User App</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dedicated Admin Logout button */}
              <button
                onClick={onAdminLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 hover:text-white text-xs font-bold transition-all border border-rose-800/80 flex items-center gap-1.5 cursor-pointer"
                title="Sign out of Administrator Console"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar (Desktop) */}
        <div className="hidden lg:block border-t border-slate-800/80 bg-slate-900/60 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive 
                        ? 'bg-white text-emerald-950' 
                        : 'bg-rose-500 text-white animate-pulse'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900 p-4 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-extrabold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                  {tab.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-[11px] text-slate-600 font-mono">
        DSK TaskMarketer Admin Subsystem • Database-enforced RLS & RBAC Security • {new Date().getFullYear()}
      </footer>
    </div>
  );
};
