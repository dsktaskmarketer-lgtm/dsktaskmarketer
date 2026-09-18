import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ExternalLink,
  ShieldCheck, 
  Building, 
  Smartphone,
  Eye,
  Filter,
  DollarSign,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { WithdrawalItem, WithdrawalStatus } from '../../types';
import { WithdrawalDetailsDrawer } from '../../components/admin/WithdrawalDetailsDrawer';
import { useTranslation } from '../../locales';

interface AdminWithdrawalsViewProps {
  withdrawals: WithdrawalItem[];
  onProcessWithdrawal?: (id: string, ref: string) => Promise<void>;
  onRejectWithdrawal?: (id: string, reason: string) => Promise<void>;
  onUpdateStatus?: (id: string, status: string, options?: any) => Promise<void>;
  onRefresh?: () => void;
}

export const AdminWithdrawalsView: React.FC<AdminWithdrawalsViewProps> = ({
  withdrawals,
  onProcessWithdrawal,
  onRejectWithdrawal,
  onUpdateStatus,
  onRefresh
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Normalize statuses
  const normalizedWithdrawals = withdrawals.map(w => {
    let normalizedStatus: WithdrawalStatus = w.status;
    if (w.status === 'requested' || w.status === 'processing') {
      normalizedStatus = 'pending';
    } else if (w.status === 'processed') {
      normalizedStatus = 'paid';
    }
    return {
      ...w,
      status: normalizedStatus,
      paymentMethod: w.paymentMethod || ((w as any).payoutMethod as any) || 'upi',
      upiId: w.upiId || (w as any).payoutDetails?.upiId,
      accountHolderName: w.accountHolderName || (w as any).payoutDetails?.accountHolderName,
      bankAccountNumber: w.bankAccountNumber || (w as any).payoutDetails?.bankAccount,
      bankIfsc: w.bankIfsc || (w as any).payoutDetails?.ifsc,
    };
  });

  const filtered = normalizedWithdrawals.filter(w => {
    const matchesFilter = filter === 'all' 
      ? true 
      : filter === 'pending'
        ? (w.status === 'pending')
        : w.status === filter;

    const matchesMethod = methodFilter === 'all' || w.paymentMethod === methodFilter;

    const matchesSearch = !search ||
      w.id.toLowerCase().includes(search.toLowerCase()) ||
      (w.userName && w.userName.toLowerCase().includes(search.toLowerCase())) ||
      w.userId.toLowerCase().includes(search.toLowerCase()) ||
      (w.upiId && w.upiId.toLowerCase().includes(search.toLowerCase())) ||
      (w.bankAccountNumber && w.bankAccountNumber.toLowerCase().includes(search.toLowerCase())) ||
      (w.paymentReference && w.paymentReference.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesMethod && matchesSearch;
  });

  // Calculate high-level metrics
  const totalCount = normalizedWithdrawals.length;
  const pendingCount = normalizedWithdrawals.filter(w => w.status === 'pending').length;
  const approvedCount = normalizedWithdrawals.filter(w => w.status === 'approved').length;
  const paidCount = normalizedWithdrawals.filter(w => w.status === 'paid').length;
  const totalPaidSum = normalizedWithdrawals
    .filter(w => w.status === 'paid')
    .reduce((sum, w) => sum + (w.paidAmount || w.amount), 0);

  const handleOpenDetails = (item: WithdrawalItem) => {
    setSelectedWithdrawal(item);
    setIsDrawerOpen(true);
  };

  const handleApprove = async (id: string, note?: string) => {
    if (onUpdateStatus) {
      await onUpdateStatus(id, 'approved', { adminNote: note });
    }
    // Update local state if needed
    if (selectedWithdrawal && selectedWithdrawal.id === id) {
      setSelectedWithdrawal(prev => prev ? { ...prev, status: 'approved', adminNote: note } : null);
    }
    if (onRefresh) onRefresh();
  };

  const handleMarkAsPaid = async (id: string, data: {
    paymentReference: string;
    paidAmount: number;
    paidDate: string;
    paymentMethod: string;
    adminNote?: string;
  }) => {
    if (onUpdateStatus) {
      await onUpdateStatus(id, 'paid', data);
    } else if (onProcessWithdrawal) {
      await onProcessWithdrawal(id, data.paymentReference);
    }
    if (selectedWithdrawal && selectedWithdrawal.id === id) {
      setSelectedWithdrawal(prev => prev ? { 
        ...prev, 
        status: 'paid', 
        paymentReference: data.paymentReference,
        paidAmount: data.paidAmount,
        paidDate: data.paidDate,
        adminNote: data.adminNote 
      } : null);
    }
    if (onRefresh) onRefresh();
  };

  const handleReject = async (id: string, reason: string, note?: string) => {
    if (onUpdateStatus) {
      await onUpdateStatus(id, 'rejected', { rejectionReason: reason, adminNote: note });
    } else if (onRejectWithdrawal) {
      await onRejectWithdrawal(id, reason);
    }
    if (selectedWithdrawal && selectedWithdrawal.id === id) {
      setSelectedWithdrawal(prev => prev ? { 
        ...prev, 
        status: 'rejected', 
        rejectionReason: reason, 
        adminNote: note 
      } : null);
    }
    if (onRefresh) onRefresh();
  };

  const renderStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            Approved (Awaiting Payment)
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="w-3 h-3" />
            Rejected & Refunded
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md inline-block mb-1">
            Operations & Treasury
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('admin.withdrawals', 'Withdrawal Operations')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit member task verifications, approve payouts, disburse via manual UPI/Bank transfer, and record UTR references.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Pending Review</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 flex items-baseline gap-2">
            {pendingCount}
            <span className="text-xs font-normal text-slate-400">requests</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Approved (Ready to Pay)</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 flex items-baseline gap-2">
            {approvedCount}
            <span className="text-xs font-normal text-slate-400">queued</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total Disbursed (Paid)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-2">
            {paidCount}
            <span className="text-xs font-normal text-slate-400">payouts</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total Volume Paid</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{totalPaidSum.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, member name, email, UPI ID, or account number..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI Transfers</option>
              <option value="bank_transfer">Bank Transfers</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'all' 
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Requests ({totalCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'pending' 
                ? 'bg-amber-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'approved' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Approved / Ready to Pay ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'paid' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Paid ({paidCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === 'rejected' 
                ? 'bg-rose-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Rejected ({normalizedWithdrawals.filter(w => w.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold">No withdrawal requests match current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3.5 px-6">ID & Member</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Requested Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filtered.map(w => (
                  <tr 
                    key={w.id} 
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetails(w)}
                  >
                    <td className="py-4 px-6 font-mono font-bold text-slate-700 dark:text-slate-200">
                      <div>#{w.id}</div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-normal">
                        {w.userName || w.userId}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-black text-slate-900 dark:text-white text-sm">
                      ₹{w.amount}
                    </td>
                    <td className="py-4 px-4">
                      {w.paymentMethod === 'upi' ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono font-semibold">{w.upiId || 'UPI'}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-800 dark:text-slate-200 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-bold">{w.accountHolderName}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            A/C: {w.bankAccountNumber ? `••••${w.bankAccountNumber.slice(-4)}` : '••••'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(w.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4">
                      {renderStatusBadge(w.status)}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(w)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Review</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Details & Action Drawer */}
      <WithdrawalDetailsDrawer
        withdrawal={selectedWithdrawal}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={handleApprove}
        onMarkAsPaid={handleMarkAsPaid}
        onReject={handleReject}
      />
    </div>
  );
};
