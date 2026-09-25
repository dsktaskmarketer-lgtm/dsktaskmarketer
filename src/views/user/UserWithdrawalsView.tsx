import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowDownToLine, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  Building, 
  Smartphone,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { WalletSummary, WithdrawalItem, User, WithdrawalStatus } from '../../types';
import { useTranslation } from '../../locales';

interface UserWithdrawalsViewProps {
  user: User;
  wallet: WalletSummary;
  withdrawals: WithdrawalItem[];
  onRequestWithdrawal: (data: {
    amount: number;
    paymentMethod: 'upi' | 'bank_transfer';
    upiId?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    accountHolderName?: string;
  }) => Promise<void>;
}

export const UserWithdrawalsView: React.FC<UserWithdrawalsViewProps> = ({
  user,
  wallet,
  withdrawals,
  onRequestWithdrawal,
}) => {
  const { t } = useTranslation();
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [amount, setAmount] = useState<number>(wallet?.minimumWithdrawalLimit ?? 200);
  const [upiId, setUpiId] = useState((user as any)?.upiId || user?.payoutDetails?.upiId || '');
  const [accountNumber, setAccountNumber] = useState((user as any)?.bankAccountNumber || user?.payoutDetails?.bankAccount || '');
  const [ifsc, setIfsc] = useState((user as any)?.bankIfsc || user?.payoutDetails?.ifsc || '');
  const [holderName, setHolderName] = useState((user as any)?.accountHolderName || user?.payoutDetails?.accountHolderName || user?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (!upiId) setUpiId((user as any).upiId || user.payoutDetails?.upiId || '');
      if (!accountNumber) setAccountNumber((user as any).bankAccountNumber || user.payoutDetails?.bankAccount || '');
      if (!ifsc) setIfsc((user as any).bankIfsc || user.payoutDetails?.ifsc || '');
      if (!holderName) setHolderName((user as any).accountHolderName || user.payoutDetails?.accountHolderName || user.name || '');
    }
  }, [user]);

  const minLimit = wallet?.minimumWithdrawalLimit ?? 200;
  const availableBal = wallet?.availableBalance ?? 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (amount > availableBal) {
      setError("Insufficient balance.");
      return;
    }

    if (amount < minLimit) {
      setError(`Minimum withdrawal amount is ₹${minLimit}`);
      return;
    }

    if (method === 'upi' && !upiId.trim()) {
      setError("Please enter a valid UPI ID (e.g. yourname@okhdfcbank)");
      return;
    }

    if (method === 'bank_transfer' && (!accountNumber.trim() || !ifsc.trim() || !holderName.trim())) {
      setError("Please fill in Account Holder Name, Bank Account Number, and IFSC code");
      return;
    }

    try {
      setLoading(true);
      await onRequestWithdrawal({
        amount: Number(amount),
        paymentMethod: method,
        upiId: method === 'upi' ? upiId.trim() : undefined,
        bankAccountNumber: method === 'bank_transfer' ? accountNumber.trim() : undefined,
        bankIfsc: method === 'bank_transfer' ? ifsc.trim().toUpperCase() : undefined,
        accountHolderName: method === 'bank_transfer' ? holderName.trim() : undefined,
      });
      setSuccessMsg("Withdrawal request submitted successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to process withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const renderStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'paid':
      case 'processed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            {t('status.paid', 'Paid')}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            {t('status.approved', 'Approved (Awaiting Payment)')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="w-3 h-3" />
            {t('status.rejected', 'Rejected & Refunded')}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {t('status.cancelled', 'Cancelled')}
          </span>
        );
      case 'pending':
      case 'requested':
      case 'processing':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            {t('status.pending', 'Pending Review')}
          </span>
        );
    }
  };

  return (
    <div className="w-full px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md inline-block mb-1 border border-blue-200 dark:border-blue-800">
          Payouts
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {t('withdrawals.title', 'Withdraw Rewards')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('withdrawals.subtitle', 'Transfer your verified available rewards directly to your UPI ID or Bank Account.')}
        </p>
      </div>

      {/* Main Grid: Withdrawal Form & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-700/60 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t('dashboard.availableBalance', 'Available Unlocked Balance')}
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                ₹{availableBal}
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400">Minimum Limit</span>
              <div className="font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">₹{minLimit}</div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-5 text-xs">
            {/* Amount Selection */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {t('withdrawals.amountToWithdraw', 'Withdrawal Amount (₹)')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  required
                  min={minLimit}
                  max={availableBal}
                  value={amount !== undefined && amount !== null ? amount : ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                <span>Available: ₹{availableBal}</span>
                <button
                  type="button"
                  onClick={() => setAmount(availableBal)}
                  className="font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Withdraw All Available
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                {t('withdrawals.payoutMethod', 'Select Transfer Method')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('upi')}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    method === 'upi'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                >
                  <Smartphone className={`w-5 h-5 ${method === 'upi' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Instant UPI</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Direct transfer to VPA handle</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('bank_transfer')}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    method === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                >
                  <Building className={`w-5 h-5 ${method === 'bank_transfer' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Bank Transfer</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">IMPS / NEFT to account</p>
                  </div>
                </button>
              </div>
            </div>

            {/* UPI ID Field */}
            {method === 'upi' && (
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {t('withdrawals.enterUpi', 'Your Verified UPI ID')}
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. mobile@upi or username@okhdfcbank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            )}

            {/* Bank Transfer Fields */}
            {method === 'bank_transfer' && (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('withdrawals.accountHolder', 'Account Holder Name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="Name as registered with your bank"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {t('withdrawals.accountNumber', 'Bank Account Number')}
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 50100234567890"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {t('withdrawals.ifsc', 'Bank IFSC Code')}
                    </label>
                    <input
                      type="text"
                      required
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value)}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Anti-Sensitive-Data Notice */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800/60 rounded-xl text-yellow-900 dark:text-yellow-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                <span>Zero Confidential Information Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                DSK TaskMarketer never asks for your Net Banking Passwords, ATM PINs, UPI MPINs, Card CVVs, or OTPs. Payout disbursements only require recipient routing details.
              </p>
            </div>

            <button
              id="submit-withdrawal-btn"
              type="submit"
              disabled={loading || availableBal < minLimit}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{loading ? t('common.processing', 'Processing...') : `${t('withdrawals.requestPayout', 'Request Payout of')} ₹${amount || 0}`}</span>
            </button>
          </form>
        </div>

        {/* Payout Policy Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white rounded-3xl p-6 space-y-4 shadow-md">
            <h4 className="font-black text-base">{t('withdrawals.guidelines', 'Payout Guidelines')}</h4>
            <ul className="space-y-2.5 text-xs text-blue-100 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-black">•</span>
                <span>Minimum withdrawal threshold is ₹{minLimit}.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-black">•</span>
                <span>Payouts are verified and disbursed within 24 to 48 business hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-black">•</span>
                <span>0% transaction fees or deduction charges.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-black">•</span>
                <span>Recipient name on bank account must align with KYC guidelines.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {t('withdrawals.historyTitle', 'Withdrawal Request History')}
        </h3>

        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
            No withdrawal requests logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Request ID</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Destination</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Details & Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {withdrawals.map(item => {
                  let normStatus: WithdrawalStatus = item.status;
                  if (item.status === 'requested' || item.status === 'processing') normStatus = 'pending';
                  else if (item.status === 'processed') normStatus = 'paid';

                  const paymentRef = item.paymentReference || item.transactionReference || item.payoutReference || (item as any).utrNumber;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 pr-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        #{item.id}
                      </td>
                      <td className="py-4 pr-4 text-slate-500 dark:text-slate-400">
                        {new Date(item.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 pr-4 text-slate-700 dark:text-slate-300 font-medium">
                        {item.paymentMethod === 'upi' ? (
                          <span className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            UPI: {item.upiId || (item as any)?.payoutDetails?.upiId || 'UPI'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-blue-600" />
                            A/C: •••• {(item.bankAccountNumber || (item as any)?.payoutDetails?.bankAccount || '')?.slice(-4)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 font-black text-sm text-slate-900 dark:text-white">
                        ₹{item.amount}
                      </td>
                      <td className="py-4 pr-4">
                        {renderStatusBadge(normStatus)}
                      </td>
                      <td className="py-4 text-right">
                        {normStatus === 'paid' && (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                              <span>UTR: {paymentRef || 'Verified'}</span>
                              {paymentRef && (
                                <button
                                  type="button"
                                  onClick={() => copyUtr(paymentRef)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5"
                                  title="Copy UTR"
                                >
                                  {copiedUtr === paymentRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                            {item.paidDate && (
                              <span className="text-[10px] text-slate-400">
                                Disbursed on {item.paidDate}
                              </span>
                            )}
                          </div>
                        )}

                        {normStatus === 'rejected' && (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 max-w-[220px] text-right">
                              {item.rejectionReason || 'Details rejected. Refunded to wallet.'}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              +₹{item.amount} Refunded to balance
                            </span>
                          </div>
                        )}

                        {normStatus === 'approved' && (
                          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                            Approved. Queued for transfer.
                          </span>
                        )}

                        {normStatus === 'pending' && (
                          <span className="text-[11px] text-slate-400">
                            Under compliance audit
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
