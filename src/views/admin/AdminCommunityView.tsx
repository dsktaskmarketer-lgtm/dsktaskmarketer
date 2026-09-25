import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Edit3, 
  X, 
  Share2 
} from 'lucide-react';
import { CommunityLink } from '../../types';

interface AdminCommunityViewProps {
  communityLinks: CommunityLink[];
  onAddLink: (link: Omit<CommunityLink, 'id'>) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
}

export const AdminCommunityView: React.FC<AdminCommunityViewProps> = ({
  communityLinks,
  onAddLink,
  onDeleteLink,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<CommunityLink['platform']>('telegram');
  const [url, setUrl] = useState('');
  const [memberCount, setMemberCount] = useState('12,000+');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onAddLink({
        title,
        description,
        platform,
        url,
        memberCount,
        isActive: true,
      });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setUrl('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block mb-1">
            Community Hub
          </span>
          <h1 className="text-2xl font-black text-slate-900">DSK Social Channels</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure official channels for Telegram, WhatsApp groups, YouTube updates, and Instagram alerts.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Channel</span>
        </button>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {communityLinks.map(link => (
          <div
            key={link.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {link.platform}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {link.memberCount} Members
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{link.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{link.description}</p>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 mt-2"
              >
                <span>Visit Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={() => {
                if (confirm(`Remove channel "${link.title}"?`)) onDeleteLink(link.id);
              }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Add Community Channel</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900 bg-white"
                >
                  <option value="telegram">Telegram</option>
                  <option value="whatsapp">WhatsApp Group / Channel</option>
                  <option value="youtube">YouTube Channel</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Channel Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Official VIP Telegram Channel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what is shared here..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Channel / Group URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://t.me/example"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Member Count Display</label>
                <input
                  type="text"
                  value={memberCount}
                  onChange={(e) => setMemberCount(e.target.value)}
                  placeholder="e.g. 15,000+ Members"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Save Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
