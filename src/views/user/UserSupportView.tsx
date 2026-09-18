import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { SupportTicket, PlatformSettings } from '../../types';

interface UserSupportViewProps {
  tickets: SupportTicket[];
  settings: PlatformSettings;
  onNavigate: (view: string) => void;
}

export const UserSupportView: React.FC<UserSupportViewProps> = ({
  tickets,
  settings,
  onNavigate,
}) => {
  const [openTicketId, setOpenTicketId] = useState<string | null>(tickets[0]?.id || null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            Open
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block mb-1">
            Help Desk
          </span>
          <h1 className="text-2xl font-black text-slate-900">Support Tickets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review status updates and official agent responses to your support inquiries.
          </p>
        </div>

        <button
          onClick={() => onNavigate('contact')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">No support tickets logged</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              If you have any questions about task verification or withdrawal processing, create a ticket.
            </p>
            <button
              onClick={() => onNavigate('contact')}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Open a Ticket
            </button>
          </div>
        ) : (
          tickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
            >
              <div
                onClick={() => setOpenTicketId(openTicketId === ticket.id ? null : ticket.id)}
                className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">ID: {ticket.id}</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {ticket.category}
                    </span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{ticket.subject}</h3>
                  <span className="text-[11px] text-slate-400">
                    Logged on {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openTicketId === ticket.id ? 'rotate-180 text-emerald-600' : ''}`} />
              </div>

              {openTicketId === ticket.id && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 text-xs space-y-4 bg-slate-50/40">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Your Message:</span>
                    <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 leading-relaxed">
                      {ticket.message}
                    </p>
                  </div>

                  {ticket.adminResponse ? (
                    <div>
                      <span className="font-bold text-emerald-800 block mb-1">Support Agent Response:</span>
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-950 leading-relaxed">
                        {ticket.adminResponse}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      Agent review pending. We will respond within 24 business hours.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* WhatsApp Help banner */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm">Need real-time immediate guidance?</h4>
          <p className="text-xs text-slate-400">Official WhatsApp support is available {settings.supportHours}.</p>
        </div>
        <a
          href={settings.whatsappSupportLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
        >
          <span>Chat on WhatsApp</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
