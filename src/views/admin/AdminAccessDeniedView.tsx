import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { User } from '../../types';

interface AdminAccessDeniedViewProps {
  user: User | null;
  onReturnToUserApp: () => void;
  onLogoutAndGoToAdminLogin: () => void;
}

export const AdminAccessDeniedView: React.FC<AdminAccessDeniedViewProps> = ({
  user,
  onReturnToUserApp,
  onLogoutAndGoToAdminLogin,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg bg-slate-900 border border-rose-900/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-20 h-20 bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-900/20">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
          Error 403 • Forbidden Area
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">
          Administrator Privileges Required
        </h1>

        <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-md mx-auto">
          The Administrative Management Console is restricted exclusively to authorized platform administrators.
          Your current session (<span className="text-slate-200 font-semibold">{user?.email || 'Anonymous'}</span>) 
          is registered with role <span className="text-amber-400 font-mono font-bold uppercase">{user?.role || 'Guest'}</span>.
        </p>

        <div className="mt-5 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-left text-[11px] text-slate-400 space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Security Policy:</span>
            <span className="text-rose-400 font-bold">RLS & RBAC Enforced</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Administrative Data:</span>
            <span className="text-slate-300">Protected / Access Blocked</span>
          </div>
        </div>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onReturnToUserApp}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to User Dashboard</span>
          </button>

          <button
            onClick={onLogoutAndGoToAdminLogin}
            className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Switch to Admin Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
