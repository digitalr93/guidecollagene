import type { AffiliateClickPayload } from './affiliate';

/**
 * Sends an affiliate click event to /api/click via sendBeacon (non-blocking).
 * Falls back to fetch if sendBeacon is unavailable.
 */
export function trackAffiliateClick(payload: AffiliateClickPayload): void {
  if (typeof window === 'undefined') return;

  const data = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([data], { type: 'application/json' });
    navigator.sendBeacon('/api/click', blob);
  } else {
    // Fallback: fire-and-forget fetch
    fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true,
    }).catch(() => {
      // Intentionally swallow errors — tracking is best-effort
    });
  }
}
