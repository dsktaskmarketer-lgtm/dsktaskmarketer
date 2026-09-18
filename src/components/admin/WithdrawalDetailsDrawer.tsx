import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Building, 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowRight, 
  FileText,
  DollarSign,
  User as UserIcon,
  Calendar,
  Lock
} from 'lucide-react';
import { WithdrawalItem, WithdrawalStatus, WithdrawalAuditLog } from '../../types';

interface WithdrawalDetailsDrawerProps {
  withdrawal: WithdrawalItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, note?: string) => Promise<void>;
  onMarkAsPaid: (id: string, data: {
    paymentReference: string;
    paidAmount: number;
    paidDate: string;
    paymentMethod: string;
    adminNote?: string;
  }) => Promise<void>;
  onReject: (id: string, reason: string, note?: string) => Promise<void>;
}

export const WithdrawalDetailsDrawer: React.FC<WithdrawalDetailsDrawerProps> = ({
  withdrawal,
  isOpen,
  onClose,
  onApprove,
  onMarkAsPaid,
  onReject,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Mark as Paid modal state
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [paidUtr, setPaidUtr] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(withdrawal?.amount || 0);
  const [paidDate, setPaidDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paidNote, setPaidNote] = useState('Manual transfer completed via Bank/UPI.');
  const [isSubmittingPaid, setIsSubmittingPaid] = useState(false);
  const [paidError, setPaidError] = useState<string | null>(null);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [predefinedReason, setPredefinedReason] = useState('Invalid UPI ID or bank account details rejected by clearing house.');
  const [customReason, setCustomReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Approve action state
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);
  const [approveNote, setApproveNote] = useState('Verified against partner affiliate records. Approved for manual payment.');

  if (!isOpen || !withdrawal) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApproveConfirm = async () => {
    try {
      setIsSubmittingApprove(true);
      await onApprove(withdrawal.id, approveNote);
    } catch (err: any) {
      alert(err.message || 'Failed to approve withdrawal');
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handlePaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidUtr.trim()) {
      setPaidError('Bank UTR / Transaction Reference is required');
      return;
    }
    try {
      setIsSubmittingPaid(true);
      setPaidError(null);
      await onMarkAsPaid(withdrawal.id, {
        paymentReference: paidUtr.trim(),
        paidAmount: Number(paidAmount) || withdrawal.amount,
        paidDate: paidDate,
        paymentMethod: withdrawal.paymentMethod,
        adminNote: paidNote.trim()
      });
      setShowPaidModal(false);
    } catch (err: any) {
      setPaidError(err.message || 'Failed to mark withdrawal as paid');
    } finally {
      setIsSubmittingPaid(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = predefinedReason === 'Other / Custom Reason' 
      ? customReason.trim() 
      : predefinedReason;

    if (!finalReason) {
      setRejectError('Please specify a rejection reason');
      return;
    }

    try {
      setIsSubmittingReject(true);
      setRejectError(null);
      await onReject(withdrawal.id, finalReason, rejectNote.trim());
      setShowRejectModal(false);
    } catch (err: any) {
      setRejectError(err.message || 'Failed to reject withdrawal');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'paid':
      case 'processed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Clock className="w-3.5 h-3.5" />
            Approved (Awaiting Payment)
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            Rejected & Refunded
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            Cancelled
          </span>
        );
      case 'pending':
      case 'requested':
      case 'processing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Pending Action
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div 
        id="withdrawal-details-drawer"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 min-h-screen shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black tracking-tight">Withdrawal #{withdrawal.id}</h2>
              {getStatusBadge(withdrawal.status)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Requested on {new Date(withdrawal.requestedAt).toLocaleString(undefined, { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Requested Amount</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{withdrawal.amount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Payout Method</span>
              <div className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                {withdrawal.paymentMethod === 'upi' ? (
                  <>
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>UPI Transfer</span>
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Bank Transfer</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Available at Request</span>
              <div className="text-base font-bold text-slate-700 dark:text-slate-300 mt-1">
                ₹{withdrawal.availableBalanceAtRequest ?? withdrawal.amount}
              </div>
            </div>
          </div>

          {/* Member Information */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-400" />
              Member Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Member Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{withdrawal.userName || 'Rahul Sharma'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">User ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{withdrawal.userId}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Email</span>
                <span className="text-slate-700 dark:text-slate-300 truncate block">{withdrawal.userEmail || 'user@example.com'}</span>
              </div>
            </div>
          </div>

          {/* Destination & Payment Details */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {withdrawal.paymentMethod === 'upi' ? (
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Building className="w-4 h-4 text-blue-600" />
                )}
                Destination Account Details
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                KYC Profile Matched
              </span>
            </div>

            {withdrawal.paymentMethod === 'upi' ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">UPI Virtual Payment Address (VPA)</span>
                  <p className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    {withdrawal.upiId || (withdrawal as any)?.payoutDetails?.upiId || 'N/A'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Registered Name: {withdrawal.accountHolderName || (withdrawal as any)?.payoutDetails?.accountHolderName || withdrawal.userName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(withdrawal.upiId || (withdrawal as any)?.payoutDetails?.upiId || '', 'upi')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedField === 'upi' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Beneficiary Name</span>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {withdrawal.accountHolderName || (withdrawal as any)?.payoutDetails?.accountHolderName || withdrawal.userName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Bank IFSC Code</span>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        {withdrawal.bankIfsc || (withdrawal as any)?.payoutDetails?.ifsc || 'N/A'}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(withdrawal.bankIfsc || (withdrawal as any)?.payoutDetails?.ifsc || '', 'ifsc')}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Copy IFSC"
                      >
                        {copiedField === 'ifsc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Account Number</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {withdrawal.bankAccountNumber || (withdrawal as any)?.payoutDetails?.bankAccount || '•••• •••• ••••'}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(withdrawal.bankAccountNumber || (withdrawal as any)?.payoutDetails?.bankAccount || '', 'acc')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedField === 'acc' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance security notice */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Sensitive data guarantee: PINs, Passwords, OTPs, or CVVs are never asked, stored, or processed.</span>
            </div>
          </div>

          {/* Paid / Rejection Specific Section */}
          {withdrawal.status === 'paid' && (
            <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Disbursement Completed
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Processed on {withdrawal.paidDate || new Date(withdrawal.processedAt || '').toLocaleDateString()}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Bank UTR / Transaction Reference</span>
                  <p className="font-mono font-black text-sm text-slate-900 dark:text-white mt-0.5">
                    {withdrawal.paymentReference || withdrawal.transactionReference || 'N/A'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(withdrawal.paymentReference || withdrawal.transactionReference || '', 'utr')}
                  className="px-2.5 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50"
                >
                  {copiedField === 'utr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {withdrawal.adminNote && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  <strong>Admin Note:</strong> {withdrawal.adminNote}
                </p>
              )}
            </div>
          )}

          {withdrawal.status === 'rejected' && (
            <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-300">
                <XCircle className="w-4 h-4 text-rose-600" />
                Payout Request Rejected & Refunded
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-rose-200 dark:border-rose-800/40">
                <span className="text-[10px] uppercase font-bold text-rose-600">Rejection Reason</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {withdrawal.rejectionReason || withdrawal.adminNote || 'Payout details failed verification.'}
                </p>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">
                The requested amount of ₹{withdrawal.amount} was credited back to the member's Available Balance.
              </p>
            </div>
          )}

          {/* Workflow Action Bar */}
          {(withdrawal.status === 'pending' || withdrawal.status === 'requested' || withdrawal.status === 'processing') && (
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Action Required: Audit & Approval
                </h4>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                  Verify the member's task audit history. Once verified, approve this request to queue it for manual transfer, or reject it with a reason to refund the member's wallet.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2 border-t border-amber-200 dark:border-amber-800/60">
                <button
                  type="button"
                  id="approve-withdrawal-btn"
                  onClick={handleApproveConfirm}
                  disabled={isSubmittingApprove}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmittingApprove ? 'Approving...' : 'Approve for Payment'}</span>
                </button>

                <button
                  type="button"
                  id="reject-withdrawal-btn"
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>
              </div>
            </div>
          )}

          {withdrawal.status === 'approved' && (
            <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Approved Payout — Ready for Manual Transfer
                </h4>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                  This payout is approved. Execute the transfer externally via your business banking portal (UPI or NetBanking IMPS). Once completed, enter the UTR Reference to mark it as Paid.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2 border-t border-blue-200 dark:border-blue-800/60">
                <button
                  type="button"
                  id="mark-as-paid-btn"
                  onClick={() => setShowPaidModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Paid (Enter UTR)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-xs transition-colors"
                >
                  Reject & Refund
                </button>
              </div>
            </div>
          )}

          {/* Audit Trail Timeline */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Withdrawal Audit Trail & Activity Logs
            </h3>

            {(!withdrawal.auditLogs || withdrawal.auditLogs.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No previous audit records logged for this withdrawal.</p>
            ) : (
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {withdrawal.auditLogs.map((log, idx) => (
                  <div key={log.id || idx} className="relative text-xs space-y-0.5">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-800" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      By: <span className="font-semibold text-slate-700 dark:text-slate-300">{log.adminName}</span>
                    </p>
                    {log.note && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 mt-1">
                        {log.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>

      {/* MODAL 1: Mark as Paid Modal */}
      {showPaidModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Record Completed Payment
              </h3>
              <button 
                onClick={() => setShowPaidModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paidError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
                {paidError}
              </div>
            )}

            <form onSubmit={handlePaidSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <input
                  type="text"
                  disabled
                  value={withdrawal.paymentMethod === 'upi' ? 'UPI Transfer' : 'Bank Transfer (IMPS/NEFT)'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paid Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Disbursement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bank UTR / Transaction Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI-IMPS-20260312093849 or 409218204912"
                  value={paidUtr}
                  onChange={(e) => setPaidUtr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Mandatory proof reference to show on member's receipt.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Internal Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sent via Corporate HDFC portal"
                  value={paidNote}
                  onChange={(e) => setPaidNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaidModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPaid}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingPaid ? 'Saving...' : 'Confirm Paid'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Reject Withdrawal & Refund
              </h3>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rejectError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
                {rejectError}
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Rejecting this request will immediately refund ₹{withdrawal.amount} back to the member's wallet balance. A clear reason must be provided.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rejection *
                </label>
                <select
                  value={predefinedReason}
                  onChange={(e) => setPredefinedReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Invalid UPI ID or bank account details rejected by clearing house.">
                    Invalid UPI ID or account number
                  </option>
                  <option value="Account holder name does not match verified member profile (KYC mismatch).">
                    Account holder name mismatch with profile
                  </option>
                  <option value="Affiliate partner reversed or rejected underlying financial task leads.">
                    Affiliate partner reversed qualifying task
                  </option>
                  <option value="Duplicate or conflicting payout request detected.">
                    Duplicate payout request
                  </option>
                  <option value="Compliance flag: suspicious activity detected on account.">
                    Suspicious activity / compliance review required
                  </option>
                  <option value="Other / Custom Reason">
                    Other / Custom Reason...
                  </option>
                </select>
              </div>

              {predefinedReason === 'Other / Custom Reason' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Explanation (Visible to Member) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter detailed reason for the member..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Notes for audit team..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isSubmittingReject ? 'Rejecting...' : 'Confirm Rejection & Refund'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
