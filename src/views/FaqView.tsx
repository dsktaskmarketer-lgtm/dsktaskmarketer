import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Search } from 'lucide-react';

export const FaqView: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqData = [
    {
      category: "General Platform",
      q: "What is DSK TaskMarketer?",
      a: "DSK TaskMarketer (Digital Success Key) is a financial affiliate marketing and task-based rewards platform. We curate verified tasks for financial products (credit cards, banking, loans, demat accounts, apps) from authorized affiliate networks. When users successfully perform qualifying actions, we reward them after affiliate audit confirmation."
    },
    {
      category: "General Platform",
      q: "Is registration free on DSK TaskMarketer?",
      a: "Yes! Creating an account on DSK TaskMarketer is 100% free. We will never ask you for any fee, deposit, or upfront charge to view or complete tasks."
    },
    {
      category: "Compliance & Approvals",
      q: "Are financial products (credit cards, loans) guaranteed to be approved?",
      a: "No. All financial product decisions, approvals, credit limits, and eligibility assessments are determined exclusively by the respective bank or financial institution based on their underwriting criteria and risk policies. DSK TaskMarketer has no influence over credit decisions."
    },
    {
      category: "Compliance & Approvals",
      q: "Does DSK TaskMarketer ask for banking passwords or OTPs?",
      a: "Never. We enforce a strict zero-sensitive-data rule. We never ask for your net banking passwords, UPI MPIN, card CVV, or one-time verification passwords (OTPs). Proof submission only asks for your public application reference number and confirmation screenshot."
    },
    {
      category: "Tasks & Proofs",
      q: "What proof is required after completing a task?",
      a: "Usually, you need to submit the Application/Reference Number shown on the final confirmation screen or in the SMS from the provider, the date you completed the action, and a screenshot of the final completion page."
    },
    {
      category: "Tasks & Proofs",
      q: "How long does verification take?",
      a: "Task verification relies on affiliate reconciliation audit reports shared by our partners. This typically takes between 3 to 7 business days, depending on the financial institution's verification cycle."
    },
    {
      category: "Rewards & Withdrawals",
      q: "How can I withdraw my earned rewards?",
      a: "Once rewards transition from 'Under Verification' to 'Approved', the funds are immediately credited to your Available Balance. You can request a withdrawal to your verified UPI ID or bank account when your balance reaches the minimum withdrawal limit."
    },
    {
      category: "Rewards & Withdrawals",
      q: "Are there any withdrawal fees?",
      a: "No, DSK TaskMarketer does not deduct any transaction or withdrawal fees. You receive 100% of your verified reward amount."
    },
    {
      category: "Referral Program",
      q: "How does the referral bonus work?",
      a: "When your friend signs up with your referral code and successfully completes their first verified task, the referral reward is automatically added to your wallet."
    },
    {
      category: "Referral Program",
      q: "Can I refer multiple family members?",
      a: "Yes, as long as they are distinct adult individuals who meet the task eligibility guidelines with their own genuine documents. Self-referrals and duplicate accounts are strictly flagged by our anti-fraud system."
    }
  ];

  const filteredFaqs = faqData.filter(item => 
    !searchQuery || 
    item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          Knowledge Base
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Help & Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Find clear answers regarding tasks, eligibility, proof submission, reward confirmation, and payouts.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-xl mx-auto">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions (e.g. withdrawals, proof, OTP, timing)..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 shadow-xs"
        />
      </div>

      {/* FAQ Accordions */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No questions found matching your search. Please reach out to our support desk.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openIdx === idx ? 'rotate-180 text-emerald-600' : ''}`} />
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mr-2">
                    {faq.category}
                  </span>
                  {faq.a}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
