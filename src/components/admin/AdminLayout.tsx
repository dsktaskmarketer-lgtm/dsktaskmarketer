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
  Database,
  Briefcase,
  Award,
  FileSpreadsheet
} from 'lucide-react';
import { User, PlatformSettings } from '../../types';
import { BrandLogo } from '../BrandLogo';

export type AdminTab = 
  | 'overview' 
  | 'users' 
  | 'tasks' 
  | 'campaigns'
  | 'submissions' 
  | 'wallet' 
  | 'withdrawals' 
  | 'referrals' 
  | 'incentives'
  | 'reports'
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
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'campaigns', label: 'Partner Enquiries', icon: <Briefcase className="w-4 h-4" /> },
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
    { id: 'incentives', label: 'Monthly Incentives', icon: <Award className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-blue-50/40 text-blue-950 flex flex-col lg:flex-row font-sans selection:bg-blue-600 selection:text-white">
      {/* ========================================================
          DESKTOP SIDEBAR (Navy Blue Palette)
          ======================================================== */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 bg-[#0B1F4D] text-white shrink-0 sticky top-0 h-screen border-r border-blue-900 shadow-2xl z-40 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-blue-800/80">
          <button
            onClick={() => onTabChange('overview')}
            className="flex flex-col items-start gap-1.5 text-left cursor-pointer group w-full"
          >
            <BrandLogo size="md" variant="white" showTagline={false} />
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-600 text-white rounded-md shadow-xs">
                Admin Console
              </span>
              <span className="text-[10px] text-yellow-400 font-mono font-bold">
                Super Admin
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-blue-200">
            Navigation Menu
          </div>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#0B1F4D] shadow-md font-black translate-x-1'
                    : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-blue-700' : 'text-blue-300 group-hover:text-white'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive 
                      ? 'bg-red-600 text-white shadow-xs' 
                      : 'bg-yellow-400 text-[#0B1F4D] shadow-xs'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Info & Actions */}
        <div className="p-4 border-t border-blue-800/80 space-y-3 bg-[#07152F]">
          {/* Admin Account Pill */}
          <div className="px-3 py-2 rounded-xl bg-blue-900/60 border border-blue-700/60 text-xs flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[10px] text-yellow-400 uppercase tracking-wider font-bold">Logged In As</div>
              <div className="text-xs font-bold text-white truncate font-mono">{user.email}</div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 animate-pulse" title="Online" />
          </div>

          {/* View User Website Link */}
          <button
            id="admin-btn-view-user-app"
            onClick={onNavigateToUserApp}
            className="w-full py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold transition-all border border-blue-500/50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-yellow-300" />
            <span>View Public User Website</span>
          </button>

          {/* Dedicated Red Logout Button */}
          <button
            id="admin-btn-logout"
            onClick={onAdminLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-md shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Logout Administrator</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          MOBILE TOP NAVBAR
          ======================================================== */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0B1F4D] text-white border-b border-blue-900 shadow-md">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-2 text-left cursor-pointer"
          >
            <BrandLogo size="sm" variant="white" showTagline={false} />
            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-red-600 text-white rounded">
              Admin
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToUserApp}
              className="p-2 rounded-lg bg-blue-800 text-white border border-blue-600 text-xs"
              title="View Public App"
            >
              <ExternalLink className="w-4 h-4 text-yellow-300" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-blue-800 text-white border border-blue-600 focus:outline-none"
              aria-label="Toggle Admin Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-blue-900 bg-[#07152F] p-4 space-y-1.5 animate-in slide-in-from-top duration-200">
            <div className="text-[10px] uppercase font-bold text-yellow-400 px-2 pb-1">Administrator Navigation</div>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#0B1F4D] font-black'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                  {tab.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 border-t border-blue-800 space-y-2">
              <button
                onClick={onAdminLogout}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MAIN ADMIN CONTENT CANVAS
          ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Strip on desktop */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-blue-100 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Executive Management
            </span>
            <span className="text-xs text-[#0B1F4D]/70 font-medium">
              Real-time audit, task verifications, and financial controls
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700">
              <Database className="w-3 h-3 text-blue-600" />
              <span>Supabase RLS Active</span>
            </div>

            <button
              onClick={onNavigateToUserApp}
              className="px-3.5 py-1.5 text-xs font-extrabold text-blue-700 hover:bg-blue-50 rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>User Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full px-4 md:px-6 py-8 bg-blue-50/30">
          {children}
        </main>

        {/* Admin Footer */}
        <footer className="border-t border-blue-100 bg-white py-4 px-8 text-center text-[11px] text-[#0B1F4D]/70 font-medium flex items-center justify-between">
          <span>DSK TaskMarketer Administrator System</span>
          <span className="text-blue-700 font-bold">Role-Based Access Control • Database Enforced</span>
        </footer>
      </div>
    </div>
  );
};
