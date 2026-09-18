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
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compliance & Anti-Fraud Banner */}
        <div className="bg-slate-800/80 rounded-2xl p-5 mb-10 border border-slate-700/60 shadow-inner">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Safe & Transparent Financial Rewards Facilitator
                <span className="text-[10px] uppercase font-semibold bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded">Verified Standard</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                DSK TaskMarketer never asks for confidential banking secrets including ATM PINs, OTP codes, card CVVs, net banking credentials, or passwords. Financial product approvals (loans, credit cards, demat accounts, insurance) are evaluated solely by the respective financial institutions under their internal credit and risk guidelines.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10 text-sm">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white via-slate-200 to-emerald-400 flex items-center justify-center text-slate-900 font-black">
                DSK
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight">{settings.platformName}</span>
                <p className="text-xs text-slate-400 font-medium">Digital Success Key Private Limited</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Connecting consumers with eligible financial products through approved partner networks. Complete verified tasks, submit legitimate proof, and receive verified rewards.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-bit Encrypted
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Audit Verified
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">Explore</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('available-tasks')} className="hover:text-emerald-400 transition-colors">
                  {t('nav.availableTasks', 'Available Tasks')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-emerald-400 transition-colors">
                  {t('nav.howItWorks', 'How It Works')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('refer-earn')} className="hover:text-emerald-400 transition-colors">
                  {t('nav.referEarn', 'Refer & Earn Program')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('community')} className="hover:text-emerald-400 transition-colors">
                  {t('nav.community', 'DSK Community Channels')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-emerald-400 transition-colors">
                  About Us
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">Legal & Transparency</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-emerald-400 transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('affiliate-disclosure')} className="hover:text-emerald-400 transition-colors">
                  Affiliate Disclosure
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('financial-disclaimer')} className="hover:text-emerald-400 transition-colors">
                  Financial Disclaimer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-emerald-400 transition-colors">
                  Help Center & FAQs
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">Support Desk</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:underline truncate">
                  {settings.supportEmail}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{settings.whatsappSupportNumber}</span>
              </li>
              <li className="text-[11px] text-slate-400 pt-1 leading-normal">
                {settings.supportHours}
              </li>
              <li className="pt-1">
                <a
                  href={settings.whatsappSupportLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  Official WhatsApp Support
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Detailed Disclaimers Text */}
        <div className="border-t border-slate-800 pt-6 pb-4 text-[11px] text-slate-400 space-y-2 leading-relaxed">
          <p>
            <strong>Financial Disclaimer:</strong> DSK TaskMarketer is not a bank, non-banking financial company (NBFC), insurance broker, or investment advisory. Tasks listed on this website correspond to performance marketing and affiliate agreements with regulated third parties. Eligibility, interest rates, credit limits, card approvals, and policy issuance remain under the sole purview of the respective issuing provider. No representation or warranty is made that starting a task guarantees card/loan approval or income.
          </p>
          <p>
            <strong>Reward Conditions:</strong> Rewards advertised (e.g. ₹500*) are conditional incentives payable only after qualifying terms are satisfied and confirmed by the respective affiliate partner network during scheduled reconciliation audits.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} DSK TaskMarketer • Digital Success Key. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">
            Engineered with strict data privacy & compliance standards.
          </p>
        </div>
      </div>
    </footer>
  );
};
