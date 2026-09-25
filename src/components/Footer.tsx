import React from 'react';
import { ShieldCheck, AlertCircle, Lock, Mail, Phone, ExternalLink } from 'lucide-react';
import { PlatformSettings } from '../types';
import { useTranslation } from '../locales';

interface FooterProps {
  settings: PlatformSettings;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 pt-6 sm:pt-12 pb-5 sm:pb-8 border-t border-slate-800 w-full overflow-hidden">
      <div className="w-full px-3.5 sm:px-6">
        {/* Compliance & Anti-Fraud Banner */}
        <div className="bg-slate-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-10 border border-slate-700/60 shadow-inner w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl text-blue-400 shrink-0">
              <ShieldCheck className="w-5 sm:w-7 h-5 sm:h-7" />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Safe & Transparent Financial Rewards Facilitator</span>
                <span className="text-[8px] sm:text-[10px] uppercase font-semibold bg-blue-900/60 text-blue-300 px-1.5 sm:px-2 py-0.5 rounded">Verified Standard</span>
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed">
                DSK TaskMarketer never asks for confidential banking secrets including ATM PINs, OTP codes, card CVVs, net banking credentials, or passwords. Financial product approvals (loans, credit cards, demat accounts, insurance) are evaluated solely by the respective financial institutions under their internal credit and risk guidelines.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Column Desktop Layout Proportionally Maintained */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-8 mb-4 sm:mb-10 text-xs sm:text-sm w-full">
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2 space-y-2 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 sm:w-9 h-7 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-white via-slate-200 to-blue-400 flex items-center justify-center text-slate-900 font-black text-xs sm:text-sm">
                DSK
              </div>
              <div>
                <span className="font-extrabold text-white text-xs sm:text-base tracking-tight">{settings.platformName}</span>
                <p className="text-[9px] sm:text-xs text-slate-400 font-medium">Digital Success Key Private Limited</p>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 leading-snug sm:leading-relaxed max-w-sm">
              Connecting consumers with eligible financial products through approved partner networks. Complete verified tasks, submit legitimate proof, and receive verified rewards.
            </p>
            <div className="flex items-center gap-2.5 sm:gap-4 text-[9px] sm:text-xs text-slate-400 pt-0 sm:pt-1">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-400" /> 256-bit Encrypted
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 sm:gap-1.5">
                <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-400" /> Audit Verified
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 space-y-1.5 sm:space-y-3">
            <h5 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">Explore</h5>
            <ul className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('available-tasks')} className="hover:text-blue-400 transition-colors cursor-pointer text-left">
                  {t('nav.availableTasks', 'Available Tasks')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-blue-400 transition-colors cursor-pointer text-left">
                  {t('nav.howItWorks', 'How It Works')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('refer-earn')} className="hover:text-blue-400 transition-colors cursor-pointer text-left">
                  {t('nav.referEarn', 'Refer & Earn')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('community')} className="hover:text-blue-400 transition-colors cursor-pointer text-left">
                  {t('nav.community', 'DSK Community')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('advertise')} className="text-blue-400 font-bold hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer text-left">
                  <span>Advertise</span>
                  <span className="text-[8px] bg-blue-950/80 border border-blue-500/40 text-blue-300 px-1 py-0.2 rounded">Partner</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="col-span-1 space-y-1.5 sm:space-y-3">
            <h5 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">Legal</h5>
            <ul className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-blue-400 transition-colors cursor-pointer text-left">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-blue-400 transition-colors cursor-pointer text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('affiliate-disclosure')} className="hover:text-blue-400 transition-colors cursor-pointer text-left">
                  Affiliate Disclosure
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('financial-disclaimer')} className="hover:text-blue-400 transition-colors cursor-pointer text-left">
                  Financial Disclaimer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-blue-400 transition-colors cursor-pointer text-left">
                  Help Center & FAQs
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div className="col-span-2 sm:col-span-1 space-y-1.5 sm:space-y-3">
            <h5 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">Support Desk</h5>
            <ul className="space-y-1 sm:space-y-2.5 text-[10px] sm:text-xs text-slate-400">
              <li className="flex items-center gap-1.5 sm:gap-2">
                <Mail className="w-3 sm:w-4 h-3 sm:h-4 text-blue-400 shrink-0" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:underline truncate text-[10px] sm:text-xs">
                  {settings.supportEmail}
                </a>
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2">
                <Phone className="w-3 sm:w-4 h-3 sm:h-4 text-blue-400 shrink-0" />
                <span className="text-[10px] sm:text-xs">{settings.whatsappSupportNumber}</span>
              </li>
              <li className="pt-0.5">
                <a
                  href={settings.whatsappSupportLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] sm:text-xs transition-colors"
                >
                  WhatsApp Support
                  <ExternalLink className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Detailed Disclaimers Text */}
        <div className="border-t border-slate-800 pt-3.5 sm:pt-6 pb-2.5 sm:pb-4 text-[10px] sm:text-[11px] text-slate-400 space-y-1.5 sm:space-y-2 leading-relaxed">
          <p>
            <strong>Financial Disclaimer:</strong> DSK TaskMarketer is not a bank, non-banking financial company (NBFC), insurance broker, or investment advisory. Tasks listed on this website correspond to performance marketing and affiliate agreements with regulated third parties. Eligibility, interest rates, credit limits, card approvals, and policy issuance remain under the sole purview of the respective issuing provider. No representation or warranty is made that starting a task guarantees card/loan approval or income.
          </p>
          <p>
            <strong>Reward Conditions:</strong> Rewards advertised (e.g. ₹500*) are conditional incentives payable only after qualifying terms are satisfied and confirmed by the respective affiliate partner network during scheduled reconciliation audits.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800/80 pt-3 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-slate-400">
          <p>© {new Date().getFullYear()} DSK TaskMarketer • Digital Success Key. All rights reserved.</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400">
            Engineered with strict data privacy & compliance standards.
          </p>
        </div>
      </div>
    </footer>
  );
};
