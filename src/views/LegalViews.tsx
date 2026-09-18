import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { PlatformSettings } from '../types';

interface LegalViewsProps {
  type: 'terms' | 'privacy' | 'affiliate-disclosure' | 'financial-disclaimer';
  settings: PlatformSettings;
  onNavigate: (view: string) => void;
}

export const LegalViews: React.FC<LegalViewsProps> = ({ type, settings, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<string>(type);

  const getTitle = () => {
    switch (activeTab) {
      case 'terms': return "Terms & Conditions";
      case 'privacy': return "Privacy Policy";
      case 'affiliate-disclosure': return "Affiliate Disclosure";
      case 'financial-disclaimer': return "Financial Services Disclaimer";
      default: return "Legal Documentation";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('terms')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
            activeTab === 'terms' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Terms & Conditions
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
            activeTab === 'privacy' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setActiveTab('affiliate-disclosure')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
            activeTab === 'affiliate-disclosure' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Affiliate Disclosure
        </button>
        <button
          onClick={() => setActiveTab('financial-disclaimer')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
            activeTab === 'financial-disclaimer' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Financial Disclaimer
        </button>
      </div>

      {/* Document Container */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-6 text-slate-700 leading-relaxed text-xs sm:text-sm">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{getTitle()}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Last Updated: January 2026 • Digital Success Key Private Limited
          </p>
        </div>

        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">1. Acceptance of Terms</h3>
            <p>
              By accessing or creating an account on DSK TaskMarketer ("Platform", "we", "us"), you agree to abide by these Terms and Conditions. If you do not accept these terms, please discontinue using the service immediately.
            </p>

            <h3 className="font-bold text-slate-900 text-base">2. Platform Nature & Performance Rewards</h3>
            <p>
              DSK TaskMarketer operates as a performance marketing aggregator. Users are invited to discover, inspect, and voluntarily complete tasks associated with financial services. Tasks are subject to third-party partner verification. Completing a task or submitting an application does not create an employer-employee, agency, or partnership relationship.
            </p>

            <h3 className="font-bold text-slate-900 text-base">3. User Obligations & Authenticity</h3>
            <p>
              Users must provide accurate, truthful, and lawful information during registration, task initiation, and proof submission. Any intentional provision of fabricated application IDs, falsified confirmation screenshots, duplicate identities, or automated bot activities constitutes a material breach resulting in immediate account termination, forfeiture of pending or approved rewards, and potential legal reporting.
            </p>

            <h3 className="font-bold text-slate-900 text-base">4. Reward Allocation & Audit Reconciliation</h3>
            <p>
              Advertised rewards (e.g. ₹650*) are conditional incentives. Payouts are made exclusively upon successful reconciliation and receipt of partner affiliate reports. DSK TaskMarketer reserves the right to reject submissions if the third-party affiliate network reports cancellation, duplicate application, or failed KYC.
            </p>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">1. Our Commitment to Data Privacy</h3>
            <p>
              DSK TaskMarketer respects user privacy and adheres to data minimization principles. We only collect the minimal information necessary to administer your user profile, track qualifying task submissions, and disburse verified rewards.
            </p>

            <h3 className="font-bold text-slate-900 text-base">2. Strict Zero-Sensitive-Data Standard</h3>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
              We NEVER request, store, or process confidential financial secrets including banking passwords, ATM PINs, UPI MPINs, card CVVs, or One-Time Passwords (OTPs).
            </div>

            <h3 className="font-bold text-slate-900 text-base">3. Information Collected</h3>
            <p>
              We collect: (a) Registration details: Name, Email address, and Phone number; (b) Task verification data: Application Reference Number and confirmation screenshots; (c) Payout information: User-specified UPI ID or Bank Account Number and IFSC for disbursement.
            </p>

            <h3 className="font-bold text-slate-900 text-base">4. Sharing with Third Parties</h3>
            <p>
              We do not sell, rent, or lease your personal data. Application reference numbers may be cross-checked with authorized partner networks solely for the purpose of validating referral tracking and reward reconciliation.
            </p>
          </div>
        )}

        {activeTab === 'affiliate-disclosure' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Affiliate Program Disclosure</h3>
            <p>
              {settings.affiliateDisclosureText}
            </p>
            <p>
              When you click on an approved task link on DSK TaskMarketer and subsequently submit an application with the partner, we may receive financial compensation or commission from the affiliate network or bank. A portion of this commission is distributed to you as a reward after satisfactory verification.
            </p>
            <p>
              Our presentation of tasks does not constitute an endorsement, recommendation, or warranty of the financial product. Users must independently assess whether a credit card, loan, bank account, or demat account matches their individual financial requirements and risk appetite.
            </p>
          </div>
        )}

        {activeTab === 'financial-disclaimer' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Financial Services & Regulatory Disclaimer</h3>
            <p>
              {settings.complianceDisclaimer}
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-900">Key Regulatory Clarifications:</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>DSK TaskMarketer is NOT a bank, NBFC, financial institution, or investment advisor.</li>
                <li>Credit card and loan approval, interest rates, loan tenure, and credit limits are determined exclusively by the respective issuing bank according to their risk underwriting policies.</li>
                <li>DSK TaskMarketer does NOT make credit decisions, and no employee or affiliate partner can promise or guarantee loan or credit card approvals.</li>
                <li>Rewards are conditional on affiliate partner reconciliation and audit verification.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
