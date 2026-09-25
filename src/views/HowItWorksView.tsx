import React from 'react';
import { 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  FileCheck, 
  Clock, 
  Wallet, 
  ShieldCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface HowItWorksViewProps {
  onNavigate: (view: string) => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: "01",
      title: "Discover & Review Eligibility",
      desc: "Browse our catalog of financial product tasks (credit cards, banking, demat accounts, loans, apps). Read the age, employment, income, and KYC requirements carefully before starting to ensure you qualify.",
      note: "Eligibility criteria are set directly by the financial institution."
    },
    {
      num: "02",
      title: "Initialize Task & Visit Partner Portal",
      desc: "Click 'Start Task' on any offer. The system registers your activity record, creates a unique reference (e.g. DSK-TRK-XXXXX), and opens the approved partner application portal.",
      note: "Complete all application steps in one continuous session for accurate tracking."
    },
    {
      num: "03",
      title: "Complete the Required Qualifying Action",
      desc: "Fill in the official partner application accurately. Complete any required verification (e.g., Aadhaar OTP, video KYC, or initial minimum transaction if applicable for apps).",
      note: "Never share confidential banking passwords or OTPs with anyone."
    },
    {
      num: "04",
      title: "Submit Authentic Proof",
      desc: "Return to DSK TaskMarketer and open 'Submit Proof'. Enter your official Application/Reference Number issued by the provider, date of completion, and upload a screenshot of the final success screen.",
      note: "Do not upload sensitive data (PAN card scans, banking statements, PINs)."
    },
    {
      num: "05",
      title: "Partner Reconciliation & Audit Verification",
      desc: "Our verification team audits submissions against partner affiliate reconciliation reports. Your submission moves from 'Pending Review' to 'Under Verification', and finally to 'Approved'.",
      note: "Partner reconciliation cycles generally take 3 to 7 business days."
    },
    {
      num: "06",
      title: "Receive Reward & Withdraw Funds",
      desc: "Upon verification, the reward amount is credited to your Available Balance. You can request instant withdrawal to your verified UPI ID or direct bank transfer once you meet the minimum balance threshold.",
      note: "No hidden charges or processing deductions."
    }
  ];

  return (
    <div className="w-full px-4 md:px-6 py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          Lifecycle Walkthrough
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How DSK TaskMarketer Works
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          A step-by-step transparent guide to completing financial product tasks, submitting proof, and withdrawing verified rewards.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div 
            key={idx}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start gap-6 relative"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-800 text-white flex items-center justify-center font-black text-xl shrink-0">
              {step.num}
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-bold text-slate-900">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {step.desc}
              </p>
              <div className="pt-2">
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                  Tip: {step.note}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Warning */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
        <h4 className="font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          Important Financial Notice
        </h4>
        <p className="leading-relaxed">
          DSK TaskMarketer is not an issuing bank, credit provider, or financial advisor. Approval of credit cards, personal loans, or bank accounts is subject to the sole credit and risk appraisal of the partner financial institution. Starting a task or submitting proof does not guarantee bank approval or reward disbursement until partner confirmation is completed.
        </p>
      </div>

      {/* Action CTA */}
      <div className="text-center pt-4">
        <button
          onClick={() => onNavigate('available-tasks')}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors inline-flex items-center gap-2"
        >
          <span>Explore Live Tasks Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
