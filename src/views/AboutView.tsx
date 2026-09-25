import React from 'react';
import { ShieldCheck, Lock, Award, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { PlatformSettings } from '../types';

interface AboutViewProps {
  settings: PlatformSettings;
  onNavigate: (view: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ settings, onNavigate }) => {
  return (
    <div className="w-full px-4 md:px-6 py-12 space-y-10 text-slate-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          About Our Platform
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          About DSK TaskMarketer
        </h1>
        <p className="text-sm text-slate-600 font-medium">
          Digital Success Key • Performance Affiliate Marketing & Verified Financial Tasks
        </p>
      </div>

      {/* Core Mission */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          DSK TaskMarketer is built to create a mutually beneficial bridge between authorized financial institutions and value-seeking consumers. Financial service providers (banks, brokers, insurers, fintechs) reward performance affiliates for customer onboarding. At DSK TaskMarketer, we pass a transparent portion of this marketing reward back to our users upon verified completion of eligible tasks.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We maintain rigorous standards of integrity: we never charge users to complete tasks, we reject deceptive get-rich-quick claims, and we uphold absolute transparency regarding financial product approvals and eligibility.
        </p>
      </div>

      {/* Principles & Standards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Zero Data Compromise</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We will never request banking passwords, card PINs, OTP codes, or CVVs. All verification uses official reference numbers only.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Regulatory Compliance</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We operate in full accordance with affiliate marketing guidelines. Product underwriting and credit approvals remain strictly with the respective regulated financial institutions.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">No Guaranteed Approvals</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We clearly inform all users that card, loan, or account approval depends on the bank's independent risk evaluation, not our platform.
          </p>
        </div>
      </div>

      {/* Transparency Pledge */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-4">
        <h3 className="text-xl font-bold">Our Transparency Pledge</h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {settings?.complianceDisclaimer || 'DSK TaskMarketer is an affiliate marketing platform that provides performance-based rewards for verified customer actions.'}
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('available-tasks')}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            Explore Available Tasks
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Contact Compliance Officer
          </button>
        </div>
      </div>
    </div>
  );
};
