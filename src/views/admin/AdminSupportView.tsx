import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Send, 
  X, 
  Search 
} from 'lucide-react';
import { SupportTicket } from '../../types';

interface AdminSupportViewProps {
  tickets: SupportTicket[];
  onReplyTicket: (id: string, response: string, status?: SupportTicket['status']) => Promise<void>;
}

export const AdminSupportView: React.FC<AdminSupportViewProps> = ({
  tickets,
  onReplyTicket,
}) => {
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(tickets[0] || null);
  const [responseText, setResponseText] = useState('');
  const [replyStatus, setReplyStatus] = useState<SupportTicket['status']>('resolved');
  const [submitting, setSubmitting] = useState(false);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !responseText.trim()) return;
    try {
      setSubmitting(true);
      await onReplyTicket(activeTicket.id, responseText.trim(), replyStatus);
      setResponseText('');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            Open
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block mb-1">
          Inquiries
        </span>
        <h1 className="text-2xl font-black text-slate-900">Member Support Tickets</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Respond to user inquiries concerning verification status, affiliate terms, or withdrawal questions.
        </p>
      </div>

      {/* Split View: Tickets List & Active Ticket Discussion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets Sidebar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
            <span>All Tickets ({tickets.length})</span>
            <span className="text-[10px] font-mono text-slate-400">
              {tickets.filter(t => t.status === 'open').length} Open
            </span>
          </div>

          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
            {tickets.map(t => (
              <div
                key={t.id}
                onClick={() => {
                  setActiveTicket(t);
                  setResponseText(t.adminResponse || '');
                }}
                className={`p-4 cursor-pointer transition-colors text-xs space-y-1 ${
                  activeTicket?.id === t.id ? 'bg-emerald-50/50 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400">{t.id}</span>
                  {getStatusBadge(t.status)}
                </div>
                <h4 className="font-bold text-slate-900 line-clamp-1">{t.subject}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{t.message}</p>
                <span className="text-[10px] text-slate-400 block pt-0.5">From: {t.userName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Details & Reply Area */}
        <div className="lg:col-span-2">
          {activeTicket ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-400">{activeTicket.id}</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {activeTicket.category}
                    </span>
                    {getStatusBadge(activeTicket.status)}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{activeTicket.subject}</h2>
                  <p className="text-xs text-slate-500">
                    From <strong>{activeTicket.userName}</strong> ({activeTicket.userEmail}) • {new Date(activeTicket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Message from user */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Member Query:</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed">
                  {activeTicket.message}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-4 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Agent Official Reply</span>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-500 font-medium">Update Status:</label>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value as any)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="resolved">Resolved</option>
                      <option value="in_progress">In Progress</option>
                      <option value="open">Keep Open</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={4}
                  required
                  value={responseText || ''}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your official resolution response to the member..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Sending...' : 'Send Official Response'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-xs text-slate-500">
              Select a ticket from the left panel to inspect and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
