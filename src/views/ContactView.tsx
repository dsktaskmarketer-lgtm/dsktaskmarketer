import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  HelpCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { PlatformSettings, User } from '../types';

interface ContactViewProps {
  settings: PlatformSettings;
  user: User | null;
  onSubmitTicket: (data: { subject: string; message: string; category: string }) => Promise<void>;
  onNavigate: (view: string) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({
  settings,
  user,
  onSubmitTicket,
  onNavigate,
}) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Task Verification');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Please fill out both subject and message");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmitTicket({
        subject: subject.trim(),
        message: message.trim(),
        category,
      });
      setSuccess(true);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || "Failed to create support ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 md:px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          Support Desk
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Help & Support Center
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Need help with a task, submission verification, referral reward, or withdrawal? We're here to assist you through multiple dedicated channels.
        </p>
      </div>

      {/* 3-Tier Support Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Self-Service FAQ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-3 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Tier 1: FAQs & Guides</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Find fast answers to common questions regarding task steps, tracking IDs, verification windows, and payouts.
            </p>
          </div>
          <button
            onClick={() => onNavigate('faq')}
            className="w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            Browse FAQs
          </button>
        </div>

        {/* Tier 2: Ticket Desk */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-3 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Tier 2: Support Ticket</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Log a formal support ticket with our verification agents for audit inquiries or proof clarification.
            </p>
          </div>
          <a
            href="#ticket-form"
            className="w-full py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 text-center transition-colors"
          >
            Submit Ticket Below
          </a>
        </div>

        {/* Tier 3: Direct WhatsApp */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-3 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Tier 3: WhatsApp Support</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct chat assistance with our member support desk. Available {settings.supportHours}.
            </p>
          </div>
          <a
            href={settings.whatsappSupportLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs text-center flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Chat on WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Support Ticket Submission Form */}
      <div id="ticket-form" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Create a Support Ticket</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Average response time: within 24 business hours.
          </p>
        </div>

        {/* Anti-Sensitive-Data Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Security Notice:</strong> Never include confidential banking credentials (such as PIN, password, OTP, or CVV) in your support ticket.
          </p>
        </div>

        {success ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-emerald-900 text-base">Support Ticket Created Successfully</h3>
            <p className="text-xs text-emerald-700 max-w-sm mx-auto">
              Our support team has received your ticket and will review it shortly. You can track this in your dashboard.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-2 text-xs font-bold text-emerald-800 underline"
            >
              Submit another query
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Issue Category</label>
                <select
                  value={category || ''}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-800 bg-white"
                >
                  <option value="Task Verification">Task Verification / Proof Status</option>
                  <option value="Reward Calculation">Reward Ledger & Earnings</option>
                  <option value="Withdrawal Inquiry">Withdrawal / Payout Query</option>
                  <option value="Referral Tracking">Referral Tracking</option>
                  <option value="Account & Security">Account & Login</option>
                  <option value="General Inquiry">General Question</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject || ''}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Inquiry regarding Credit Card submission verification"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Description / Message</label>
              <textarea
                required
                rows={4}
                value={message || ''}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your query in detail, including your Task ID or Application Reference Number if applicable."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
