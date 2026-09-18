import React from 'react';
import { Wallet, ArrowDownRight, TrendingUp, ShieldCheck, CreditCard } from 'lucide-react';
import { User, WalletSummary } from '../../types';

interface ClientWalletViewProps {
  user: User;
  wallet: WalletSummary | null;
}

export const ClientWalletView: React.FC<ClientWalletViewProps> = ({
  user,
  wallet
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Advertiser Campaign Balance</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage funds allocated for performance reward payouts and campaign budgets
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-indigo-300 text-xs mb-3">
            <span>Available Campaign Funds</span>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black">
            ₹{wallet?.availableBalance || 0}
          </div>
          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
            Reserved for automatic task-reward credits as user submissions are verified.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Disbursed Rewards</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{wallet?.totalEarnings || 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Verified customer acquisitions completed
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Escrow protected payout guarantee</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Escrow & Billing Instructions</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          To top up your campaign balance for high-volume customer acquisition, contact your dedicated account manager or remit to the verified DSK Escrow Account. Rewards are debited only when you explicitly approve user task proofs.
        </p>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300">
          <div>Account Name: DSK TASKMARKETER ESCROW AC</div>
          <div>Bank: HDFC Bank Ltd</div>
          <div>IFSC: HDFC0001234</div>
          <div>Mode: RTGS / NEFT / IMPS / Corporate UPI</div>
        </div>
      </div>
    </div>
  );
};
