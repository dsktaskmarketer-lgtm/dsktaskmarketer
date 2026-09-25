/**
 * URL Validation and Navigation Utility for DSK TaskMarketer
 * Ensures safe, valid partner redirect URLs with mobile browser compatibility.
 */

export interface UrlValidationResult {
  valid: boolean;
  url: string;
  error?: string;
}

/**
 * Validates and normalizes an external URL (ensures valid http/https protocol).
 */
export function validateAndNormalizeUrl(rawUrl?: string | null): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      valid: false,
      url: '',
      error: 'Destination URL is missing or empty.'
    };
  }

  let trimmed = rawUrl.trim();

  // If protocol is missing, prepend https://
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        url: '',
        error: 'Only HTTP and HTTPS web URLs are permitted.'
      };
    }

    // Disallow javascript:, data:, or invalid hostnames
    if (!parsed.hostname || parsed.hostname.length < 3 || !parsed.hostname.includes('.')) {
      return {
        valid: false,
        url: '',
        error: 'Please enter a valid domain address (e.g., https://partner.com/apply).'
      };
    }

    return {
      valid: true,
      url: parsed.toString()
    };
  } catch {
    return {
      valid: false,
      url: '',
      error: 'Invalid web address format.'
    };
  }
}

/**
 * Opens an external destination safely across desktop and mobile browsers.
 * Uses direct window.open with a fallback anchor click to prevent mobile browser pop-up blocking.
 */
export function openExternalUrl(url: string, target = '_blank'): boolean {
  const check = validateAndNormalizeUrl(url);
  if (!check.valid || !check.url) {
    console.error('[URL Helper] Cannot open invalid destination URL:', url);
    return false;
  }

  const destination = check.url;

  try {
    // Attempt window.open first
    const win = window.open(destination, target, 'noopener,noreferrer');
    if (win && !win.closed) {
      return true;
    }
  } catch (err) {
    console.warn('[URL Helper] window.open failed, attempting anchor fallback:', err);
  }

  // Mobile browser fallback: create an unblockable invisible <a> tag and click it
  try {
    const link = document.createElement('a');
    link.href = destination;
    link.target = target;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 100);
    return true;
  } catch (fallbackErr) {
    console.error('[URL Helper] Fallback link click failed:', fallbackErr);
    // Last resort
    window.location.href = destination;
    return true;
  }
}
