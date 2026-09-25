/**
 * Share & Link Utility for DSK TaskMarketer
 * Handles native Web Share API with robust fallback to clipboard copying.
 */

export function getPublicTaskUrl(taskId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/task/${encodeURIComponent(taskId)}`;
  }
  return `/task/${taskId}`;
}

export function getPublicCampaignUrl(campaignId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/task/${encodeURIComponent(campaignId)}`;
  }
  return `/task/${campaignId}`;
}

export interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

export async function shareOrCopy(
  options: ShareOptions,
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void
): Promise<'shared' | 'copied' | 'failed'> {
  // Try native share API first if supported
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return 'shared';
    } catch (err: any) {
      // If user aborted or dismissed the share sheet, do not fallback or treat as error
      if (err.name === 'AbortError') {
        return 'failed';
      }
      // Otherwise fall through to clipboard copy
    }
  }

  // Fallback: Copy link to clipboard
  const copied = await copyToClipboard(options.url);
  if (copied) {
    if (onNotify) {
      onNotify('User link copied', 'success');
    }
    return 'copied';
  } else {
    if (onNotify) {
      onNotify('Unable to copy link', 'error');
    }
    return 'failed';
  }
}
