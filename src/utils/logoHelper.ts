/**
 * Business Logo processing and synchronization helper.
 * Handles high-resolution image compression for crisp navbar display (max-height: 40px),
 * transparent PNG/SVG preservation, and reliable localStorage persistence.
 */

export const STORAGE_KEY_LOGO = 'dsk_custom_logo';

export function getStoredLogo(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_LOGO) || '';
  } catch {
    return '';
  }
}

export function setStoredLogo(logoDataUrl: string): void {
  try {
    if (logoDataUrl && logoDataUrl.trim()) {
      localStorage.setItem(STORAGE_KEY_LOGO, logoDataUrl.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_LOGO);
    }
  } catch (e) {
    console.warn('LocalStorage quota warning:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dsk_logo_updated'));
  }
}

export function removeStoredLogo(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LOGO);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dsk_logo_updated'));
  }
}

/**
 * Optimizes an uploaded logo file (PNG, JPG, SVG, WEBP).
 * Converts to a lightweight, crystal-clear Data URL scaled to navbar dimensions
 * (max height: 120px, preserving aspect ratio and alpha transparency).
 */
export function processLogoFile(file: File): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return reject(new Error('Unsupported format. Please upload PNG, JPG, SVG, or WEBP.'));
    }

    // For SVG images, read directly as data URL to preserve vector sharpness
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = (e.target?.result as string) || '';
        resolve({ dataUrl: result, sizeKb: Math.round(file.size / 1024) });
      };
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsDataURL(file);
      return;
    }

    // For raster images (PNG, JPG, WEBP), render to canvas at 2x crisp retina resolution
    // (max-height: 120px is 3x the 40px navbar height, ensuring ultra-crispness while weighing only 15-40KB)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const maxH = 120;
        let w = img.naturalWidth || img.width || 200;
        let h = img.naturalHeight || img.height || 60;

        if (h > maxH) {
          w = Math.round((w * maxH) / h);
          h = maxH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to direct read
          const reader = new FileReader();
          reader.onload = (e) => resolve({ dataUrl: e.target?.result as string, sizeKb: Math.round(file.size / 1024) });
          reader.onerror = () => reject(new Error('Canvas unavailable'));
          reader.readAsDataURL(file);
          return;
        }

        // Clean transparent canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // PNG preserves transparency for icons and wordmarks
        const optimizedDataUrl = canvas.toDataURL('image/png', 0.95);
        const approxKb = Math.round((optimizedDataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl: optimizedDataUrl, sizeKb: approxKb });
      } catch (err) {
        // Fallback to FileReader
        const reader = new FileReader();
        reader.onload = (e) => resolve({ dataUrl: e.target?.result as string, sizeKb: Math.round(file.size / 1024) });
        reader.onerror = () => reject(err);
        reader.readAsDataURL(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = (e) => resolve({ dataUrl: e.target?.result as string, sizeKb: Math.round(file.size / 1024) });
      reader.onerror = () => reject(new Error('Failed to load image'));
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}
