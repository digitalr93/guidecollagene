export const SITE_NAME = 'Guide Collagène';
export const SITE_URL = 'https://guidecollagene.fr';
export const SITE_DESCRIPTION =
  'Le guide de référence sur le collagène : comparatifs, avis produits, conseils nutritionnels et guides d\'achat experts.';
export const SITE_TWITTER = '@guidecollagene';
export const SITE_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

export interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noindex?: boolean;
  publishedAt?: Date;
  updatedAt?: Date;
  author?: string;
}

export function buildTitle(pageTitle: string): string {
  if (pageTitle === SITE_NAME) return pageTitle;
  return `${pageTitle} | ${SITE_NAME}`;
}

export function buildCanonical(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
