import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Wallet, 
  Users, 
  Sparkles, 
  ExternalLink, 
  ChevronDown, 
  HelpCircle, 
  Clock, 
  Lock, 
  MessageSquare, 
  AlertCircle 
} from 'lucide-react';
import { Task, TaskCategory, SocialLink, PlatformSettings, User } from '../types';
import { TaskCard } from '../components/TaskCard';
import { useTranslation } from '../locales';

interface HomeViewProps {
  user?: User | null;
  tasks: Task[];
  categories: TaskCategory[];
  socialLinks: SocialLink[];
  settings: PlatformSettings;
  onNavigate: (view: string) => void;
  onViewTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  tasks,
  categories,
  socialLinks,
  settings,
  onNavigate,
  onViewTask,
  onStartTask,
}) => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does DSK TaskMarketer work?",
      a: "You discover verified financial product tasks (e.g. credit card applications, zero-balance bank accounts, demat accounts). You review eligibility, start the task to visit the approved partner portal, complete the qualifying action, and submit legitimate proof (like your application reference number). After affiliate confirmation and audit verification, your reward is credited to your wallet balance."
    },
    {
      q: "Are rewards or financial approvals guaranteed?",
      a: "No. Eligibility and credit/card approval are determined solely by the financial institution or partner under their respective credit guidelines. Rewards are conditional incentives subject to applicable partner program terms and successful audit verification."
    },
    {
      q: "Will DSK TaskMarketer ever ask for my banking passwords or OTPs?",
      a: "Never. DSK TaskMarketer has a strict zero-sensitive-data policy. We will NEVER ask for banking passwords, UPI MPINs, debit/credit card CVVs, or OTP codes. Proof of task completion only requires public application reference numbers or status screenshots."
    },
    {
      q: "How can I withdraw my earned rewards?",
      a: "Once your rewards are approved by the partner audit, they reflect in your Available Balance. You can request payout to your verified UPI ID or direct bank transfer once your balance meets the minimum threshold."
    },
    {
      q: "How does the Refer & Earn program work?",
      a: "Share your unique referral code or link with colleagues and friends. When they register and complete their first verified, approved task, you receive a referral reward as per the active campaign."
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/60 pt-12 pb-16 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('home.badge', 'Digital Success Key • Verified Performance Affiliate Platform')}</span>
            </div>

            {/* Brand Title & Tagline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {t('home.heroTitle', 'DSK TaskMarketer')}
              </h1>
              <p className="text-lg sm:text-xl font-extrabold text-emerald-700 tracking-tight">
                "{t('home.tagline', 'Complete Tasks • Earn Rewards')}"
              </p>
            </div>

            {/* Core Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              {t('home.heroDesc', 'Discover eligible financial tasks, complete the required actions through approved partner links, submit required proof, and earn rewards after verification.')}
            </p>

            {/* Hero CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="hero-btn-explore-tasks"
                onClick={() => onNavigate('available-tasks')}
                className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>{t('home.exploreTasks', 'Explore Tasks')} →</span>
              </button>
              {user ? (
                <button
                  id="hero-btn-dashboard"
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto px-7 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>{t('home.dashboard', 'Dashboard')} →</span>
                </button>
              ) : (
                <button
                  id="hero-btn-register"
                  onClick={() => onNavigate('register')}
                  className="w-full sm:w-auto px-7 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {t('home.registerNow', 'Register Now')}
                </button>
              )}
            </div>

            {/* Security Assurance Chips */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Sensitive Data Requested</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Affiliate Audit Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Direct UPI & Bank Payouts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (4 Step Process) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Transparent Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {t('home.howItWorks', 'How It Works in 4 Simple Steps')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Our systematic tracking and verification process ensures clarity and security at every stage.
          </p>
        </div>

        <div className="overflow-x-auto pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 min-w-min sm:min-w-0">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3 relative w-[260px] sm:w-auto shrink-0 sm:shrink">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Check Eligibility</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore available financial offers (credit cards, accounts, demat). Review age, income, and required KYC criteria before starting.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3 relative w-[260px] sm:w-auto shrink-0 sm:shrink">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-base">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Start Verified Task</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click 'Start Task' to receive your unique tracking reference and navigate to the approved partner application portal.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3 relative w-[260px] sm:w-auto shrink-0 sm:shrink">
              <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black text-base">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Submit Required Proof</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete the partner action and submit your legitimate application reference number and confirmation screenshot.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3 relative w-[260px] sm:w-auto shrink-0 sm:shrink">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-base">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">Receive Verified Reward</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upon affiliate confirmation and audit verification, rewards are credited directly to your available balance for withdrawal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED TASKS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Live Offers
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-2">
              {t('home.featuredTasks', 'Featured Financial Tasks')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Browse approved affiliate campaigns across top financial institutions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('available-tasks')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto"
            >
              View all {tasks.length} tasks
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Structured Two-Column Task Grid across all screens */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-6">
          {tasks.slice(0, 6).map(task => (
            <TaskCard
              key={task.id}
              task={task}
              category={categories.find(c => c.id === task.categoryId)}
              onViewDetails={onViewTask}
              onStartTask={onStartTask}
            />
          ))}
        </div>
      </section>

      {/* 4. REFER & EARN BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Community Growth Program
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Refer Friends & Earn ₹{settings.referralRewardAmount} Per Qualifying Referral
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Invite friends to DSK TaskMarketer. When your referred friend completes their first verified and approved task, receive ₹{settings.referralRewardAmount} directly into your wallet.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate(user ? 'referrals' : 'refer-earn')}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {t('referrals.shareLink', 'Get Referral Link')}
              </button>
              <span className="text-xs text-slate-400">
                Qualifying action required • Anti-fraud rules apply
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY DSK TASKMARKETER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Trust & Security
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Why Choose DSK TaskMarketer?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A responsible affiliate rewards platform built on financial compliance and data safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Zero Confidential Data</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never ask for passwords, PINs, CVV, or OTPs. We only collect public application tracking numbers for verification.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Transparent Audit Trail</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every submission is tracked in an immutable ledger. Clear statuses keep you informed through review, verification, and reward credit.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Reliable Payouts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Withdraw available rewards directly to your bank account or UPI ID with rapid processing and zero hidden charges.
            </p>
          </div>
        </div>
      </section>

      {/* 6. DSK COMMUNITY CHANNELS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl p-8 sm:p-10 border border-slate-200/80">
          <div className="max-w-2xl mb-8 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Stay Connected
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Join the DSK Community
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Receive instant updates on new verified tasks, tips on form filling, and exclusive campaign bonuses across our official social channels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {socialLinks.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {link.displayName}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {link.description || 'Official community channel'}
                  </p>
                </div>
                <span className="mt-4 text-xs font-bold text-emerald-600 flex items-center gap-1">
                  Join Channel →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {t('home.faqTitle', 'Frequently Asked Questions')}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-600' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. SUPPORT CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-black">Need assistance with a task or submission?</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
              Our dedicated support team is available {settings.supportHours} to assist with task guidelines and verification queries.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('contact')}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Contact Support
            </button>
            <a
              href={settings.whatsappSupportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>WhatsApp Support</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
