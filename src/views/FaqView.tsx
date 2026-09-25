import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  HelpCircle, 
  ShieldCheck, 
  Search, 
  X, 
  CheckCircle2, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Sparkles,
  Wallet,
  Users,
  FileCheck,
  Building2,
  ExternalLink
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  categoryIcon: React.ElementType;
  q: string;
  a: string;
  highlights?: string[];
}

export const FaqView: React.FC = () => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'faq-1': true });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, 'yes' | 'no'>>({});

  const faqData: FaqItem[] = useMemo(() => [
    {
      id: "faq-1",
      category: "General Platform",
      categoryIcon: HelpCircle,
      q: "What is DSK TaskMarketer?",
      a: "DSK TaskMarketer (Digital Success Key) is a verified financial affiliate marketing and task-based rewards platform. We curate genuine opportunities for financial products (credit cards, digital banking, demat accounts, loans, fintech apps) from authorized partner networks. When you successfully perform qualifying actions, you earn verified cash rewards credited directly to your wallet.",
      highlights: ["100% genuine platform", "Verified partner networks", "Direct wallet payouts"]
    },
    {
      id: "faq-2",
      category: "General Platform",
      categoryIcon: HelpCircle,
      q: "Is registration free on DSK TaskMarketer?",
      a: "Yes! Creating an account and participating on DSK TaskMarketer is 100% completely free. We will never ask you for any registration fee, joining deposit, or upfront payment under any circumstances.",
      highlights: ["100% Free forever", "No upfront deposits", "No hidden charges"]
    },
    {
      id: "faq-3",
      category: "Compliance & Safety",
      categoryIcon: ShieldCheck,
      q: "Are financial products (credit cards, loans) guaranteed to be approved?",
      a: "No. All financial product decisions, approvals, credit limits, and eligibility assessments are determined exclusively by the respective issuing bank or financial institution based on their underwriting criteria, CIBIL score, and risk policies. DSK TaskMarketer acts as a marketing partner and has no influence over credit decisions.",
      highlights: ["Bank underwriting applies", "No approval guarantees", "Honest transparency"]
    },
    {
      id: "faq-4",
      category: "Compliance & Safety",
      categoryIcon: ShieldCheck,
      q: "Does DSK TaskMarketer ever ask for banking passwords or OTPs?",
      a: "Never! We enforce a strict zero-sensitive-data policy. We will NEVER ask you for your net banking passwords, UPI MPIN, card CVV, or one-time verification passwords (OTPs). For task verification, you only submit public reference/application numbers and non-sensitive confirmation screenshots.",
      highlights: ["Zero sensitive data policy", "Never share OTP or MPIN", "Safe and secure"]
    },
    {
      id: "faq-5",
      category: "Tasks & Proofs",
      categoryIcon: FileCheck,
      q: "What proof is required after completing a task?",
      a: "To verify your task completion, you need to submit the Application or Lead Reference Number received on the partner's final success page or via official confirmation SMS/Email, along with a clear screenshot of the final completion screen.",
      highlights: ["Application Reference ID", "Completion screenshot", "Accurate submission date"]
    },
    {
      id: "faq-6",
      category: "Tasks & Proofs",
      categoryIcon: FileCheck,
      q: "How long does task verification take?",
      a: "Task verification relies on automated affiliate reconciliation reports shared by our banking and affiliate network partners. Audits typically take between 2 to 5 business days. Once verified by the partner, your reward is immediately credited to your balance.",
      highlights: ["2 to 5 business days", "Automated affiliate reconciliation", "Real-time status tracking"]
    },
    {
      id: "faq-7",
      category: "Rewards & Withdrawals",
      categoryIcon: Wallet,
      q: "How can I withdraw my earned rewards?",
      a: "As soon as your earnings transition to 'Available Balance', you can instantly request a payout to your verified UPI ID (Google Pay, PhonePe, Paytm) or direct Bank Account (NEFT/IMPS). Withdrawals are processed rapidly with zero deductions.",
      highlights: ["Instant UPI transfers", "Direct Bank Account (NEFT/IMPS)", "0% deduction fees"]
    },
    {
      id: "faq-8",
      category: "Rewards & Withdrawals",
      categoryIcon: Wallet,
      q: "Is there any withdrawal fee or service tax deducted?",
      a: "No! DSK TaskMarketer does not deduct any transaction or withdrawal fees from your rewards. You receive 100% of your verified reward amount in your bank or UPI account.",
      highlights: ["Zero withdrawal fee", "100% payout guarantee"]
    },
    {
      id: "faq-9",
      category: "Referral Program",
      categoryIcon: Users,
      q: "How does the Refer & Earn program work?",
      a: "Share your unique referral code or link with friends and followers. When a referred user signs up and successfully completes their first verified task, both you and your friend earn referral cash bonuses and qualify for monthly incentive leaderboards!",
      highlights: ["Lifetime referral links", "Instant bonus on first task", "Monthly leaderboard prizes"]
    },
    {
      id: "faq-10",
      category: "Referral Program",
      categoryIcon: Users,
      q: "Can I refer multiple friends or family members?",
      a: "Yes! You can refer as many genuine individuals as you wish. Each individual must use their own unique phone number, email, and valid KYC details. Self-referrals and duplicate accounts are strictly prohibited and flagged by our anti-fraud system.",
      highlights: ["Unlimited referrals", "Unique genuine users required", "Anti-fraud protection"]
    }
  ], []);

  // Categories list
  const categories = useMemo(() => {
    const cats = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];
    return cats;
  }, [faqData]);

  // Toggle single accordion or multiple
  const toggleFaq = (id: string) => {
    setOpenIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Expand all / Collapse all
  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    faqData.forEach(item => {
      allOpen[item.id] = true;
    });
    setOpenIds(allOpen);
  };

  const collapseAll = () => {
    setOpenIds({});
  };

  // Filtered FAQs based on category & search
  const filteredFaqs = useMemo(() => {
    return faqData.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const qLower = searchQuery.toLowerCase().trim();
      if (!qLower) return matchesCategory;

      const matchesSearch = 
        item.q.toLowerCase().includes(qLower) || 
        item.a.toLowerCase().includes(qLower) ||
        item.category.toLowerCase().includes(qLower) ||
        (item.highlights && item.highlights.some(h => h.toLowerCase().includes(qLower)));

      return matchesCategory && matchesSearch;
    });
  }, [faqData, selectedCategory, searchQuery]);

  const handleFeedback = (id: string, type: 'yes' | 'no') => {
    setHelpfulFeedback(prev => ({ ...prev, [id]: type }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-10 space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* ==========================================
          HEADER BANNER
          ========================================== */}
      <div className="text-center space-y-2 sm:space-y-3 relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-xs">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Knowledge Base & Support Center</span>
        </div>
        
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Frequently Asked <span className="text-blue-600 dark:text-[#FFC400]">Questions</span>
        </h1>
        
        <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
          Everything you need to know about completing tasks, submitting proofs, earning commissions, and instant wallet withdrawals.
        </p>
      </div>

      {/* ==========================================
          SEARCH BAR & QUICK CONTROLS
          ========================================== */}
      <div className="space-y-3">
        <div className="relative max-w-2xl mx-auto w-full">
          <Search className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword (e.g. proof, withdrawal, approval, UPI, safety)..."
            className="w-full pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm text-slate-900 dark:text-white shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Filter */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-102'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Result Counter & Expand/Collapse Toggle */}
        <div className="flex items-center justify-between max-w-4xl mx-auto px-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredFaqs.length}</strong> {filteredFaqs.length === 1 ? 'question' : 'questions'}
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <button
              onClick={expandAll}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              onClick={collapseAll}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          INTERACTIVE ACCORDION LIST
          Uses smooth CSS grid row animation
          ========================================== */}
      <div className="space-y-3 max-w-4xl mx-auto w-full">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
              No matching questions found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              We couldn't find any questions matching "{searchQuery}". Try searching with different terms or select "All" categories.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = !!openIds[faq.id];
            const feedback = helpfulFeedback[faq.id];
            const Icon = faq.categoryIcon;

            return (
              <div
                key={faq.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 shadow-xs hover:shadow-md ${
                  isOpen 
                    ? 'border-blue-400 dark:border-blue-500/60 ring-1 ring-blue-400/30 dark:ring-blue-500/20' 
                    : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Accordion Header / Trigger Button */}
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-2xl transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 pr-1">
                    {/* Category Icon Badge */}
                    <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">
                        {faq.category}
                      </span>
                      <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-white block leading-snug">
                        {faq.q}
                      </span>
                    </div>
                  </div>

                  {/* Smooth Rotating Chevron Icon */}
                  <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isOpen 
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 rotate-180' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                  }`}>
                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                  </div>
                </button>

                {/* Accordion Content Container with smooth CSS grid transition */}
                <div 
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                      
                      {/* Answer Paragraph */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        {faq.a}
                      </p>

                      {/* Key Highlights / Badges */}
                      {faq.highlights && faq.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {faq.highlights.map((h, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs font-semibold"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{h}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Interactive Feedback Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="text-[10px] sm:text-xs">Was this answer helpful?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleFeedback(faq.id, 'yes')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              feedback === 'yes'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>Yes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(faq.id, 'no')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              feedback === 'no'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <ThumbsDown className="w-3 h-3" />
                            <span>No</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ==========================================
          CONTACT SUPPORT CTA FOOTER CARD
          ========================================== */}
      <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-7 shadow-lg shadow-blue-600/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-yellow-300 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>24/7 Dedicated Support</span>
          </div>
          <h3 className="text-base sm:text-xl font-black">
            Still have questions or need assistance?
          </h3>
          <p className="text-xs text-blue-100 max-w-lg font-medium">
            Our support desk is available around the clock to help with task audits, proofs, wallet inquiries, and account verification.
          </p>
        </div>

        <a
          href="mailto:dsktaskmarketer@gmail.com"
          className="px-5 py-2.5 bg-[#FFC400] hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-amber-400/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <MessageSquare className="w-4 h-4 text-slate-950" />
          <span>Contact Support Desk</span>
        </a>
      </div>

    </div>
  );
};
