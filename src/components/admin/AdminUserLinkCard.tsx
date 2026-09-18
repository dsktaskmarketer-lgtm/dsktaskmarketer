import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Share2, Link as LinkIcon } from 'lucide-react';
import { getPublicTaskUrl, shareOrCopy, copyToClipboard } from '../../utils/shareHelper';
import { useToast } from '../../context/ToastContext';

interface AdminUserLinkCardProps {
  taskId: string;
  taskTitle?: string;
  partnerName?: string;
  rewardAmount?: number;
  compact?: boolean;
  onNavigate?: (view: string, id?: string) => void;
}

export const AdminUserLinkCard: React.FC<AdminUserLinkCardProps> = ({
  taskId,
  taskTitle = 'Financial Task',
  partnerName,
  rewardAmount,
  compact = false,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const publicUrl = getPublicTaskUrl(taskId);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(publicUrl);
    if (success) {
      setCopied(true);
      showToast('User link copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate('task-detail', taskId);
    } else if (typeof window !== 'undefined') {
      window.open(`/task/${encodeURIComponent(taskId)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const rewardText = rewardAmount ? ` - Earn ₹${rewardAmount}` : '';
    const partnerText = partnerName ? ` from ${partnerName}` : '';
    await shareOrCopy(
      {
        title: `${taskTitle}${rewardText}`,
        text: `Complete verified task "${taskTitle}"${partnerText} on DSK TaskMarketer and earn performance rewards:`,
        url: publicUrl
      },
      (msg, type) => showToast(msg, type)
    );
  };

  if (compact) {
    return (
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <LinkIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            User Link
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-1 text-[11px] font-bold rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1 shadow-2xs"
              title="Copy public user link"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpen}
              className="px-2 py-1 text-[11px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
              title="View user page"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-1 text-[11px] font-bold rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs"
              title="Share user page"
            >
              <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 truncate bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200/80 dark:border-slate-700/80 select-all">
          {publicUrl}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="mt-3 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            User Link
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            (Public User-Facing URL)
          </span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
          Public Access
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
          {publicUrl}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            title="Copy public link to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Copy User Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpen}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            title="Open public user page directly"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View User Page</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            title="Share with native share dialog or copy fallback"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
