import React from 'react';
import { 
  Users, 
  Send, 
  Video, 
  Camera, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle,
  Bell,
  Sparkles,
  Info
} from 'lucide-react';
import { SocialLink } from '../types';

interface CommunityViewProps {
  socialLinks: SocialLink[];
}

export const CommunityView: React.FC<CommunityViewProps> = ({ socialLinks }) => {
  const getSocialIcon = (iconName: string, platform: string) => {
    switch (platform) {
      case 'telegram_channel':
      case 'telegram_group':
        return <Send className="w-5 h-5 text-sky-600" />;
      case 'youtube':
        return <Video className="w-5 h-5 text-red-600" />;
      case 'instagram':
        return <Camera className="w-5 h-5 text-pink-600" />;
      case 'whatsapp_community':
        return <MessageSquare className="w-5 h-5 text-emerald-600" />;
      default:
        return <Users className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          DSK TaskMarketer Network
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Official DSK Community
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Financial Tips, Offer Alerts & Live Task Guidance. Join our verified member groups to receive prompt updates and application advice.
        </p>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Community Guidelines:</strong> Our official groups are meant strictly for financial tips, task notifications, and platform support. Never share personal passwords, PINs, or confidential banking numbers in any public or community group.
        </p>
      </div>

      {/* Social Links Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {socialLinks.map(link => (
          <div
            key={link.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  {getSocialIcon(link.icon, link.platform)}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                  Official Channel
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {link.displayName}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {link.description || "Join for the latest verified task alerts and guidelines."}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Verified Link</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Join Official Group</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
