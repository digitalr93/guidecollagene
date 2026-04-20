import { SITE_URL } from './seo';

export interface AffiliateParams {
  productId: string;
  productSlug: string;
  merchant: string;
  affiliateUrl: string;
  sourcePage?: string;
  position?: number;
}

export interface AffiliateClickPayload {
  clickId: string;
  productId: string;
  merchant: string;
  destinationUrl: string;
  sourcePage: string;
  referrer: string;
  device: string;
  timestamp: string;
}

/**
 * Generates a unique click ID for affiliate tracking.
 */
export function generateClickId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Builds the final affiliate URL with UTM params.
 * The actual affiliate tag is injected server-side via env vars.
 */
export function buildAffiliateUrl(params: AffiliateParams): string {
  const { affiliateUrl, productId, sourcePage = '/', position } = params;

  const url = new URL(affiliateUrl);

  // UTM tracking — source uniquement
  url.searchParams.set('utm_source', 'guidecollagene');

  return url.toString();
}

/**
 * Builds the intermediate redirect URL so we can track the click
 * before forwarding the user to the affiliate destination.
 */
export function buildRedirectUrl(params: AffiliateParams): string {
  const clickId = generateClickId();
  const redirectUrl = new URL(`${SITE_URL}/api/click`);
  redirectUrl.searchParams.set('cid', clickId);
  redirectUrl.searchParams.set('pid', params.productId);
  redirectUrl.searchParams.set('merchant', params.merchant);
  redirectUrl.searchParams.set('dest', buildAffiliateUrl(params));
  if (params.sourcePage) {
    redirectUrl.searchParams.set('src', params.sourcePage);
  }
  return redirectUrl.toString();
}

export function getDeviceType(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(ua)) return 'mobile';
  if (/tablet/.test(ua)) return 'tablet';
  return 'desktop';
}
