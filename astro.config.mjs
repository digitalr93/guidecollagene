// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://guidecollagene.fr',
  output: 'static',

  // 301 redirects — anciennes URLs WordPress
  redirects: {
    // Articulations
    '/les-bienfaits-du-collagene-pour-les-articulations':  '/guide/collagene-articulations',
    '/les-bienfaits-du-collagene-pour-les-articulations/': '/guide/collagene-articulations',

    // Types
    '/les-differents-types-de-collagene':  '/guide/collagene-type-1-2-3',
    '/les-differents-types-de-collagene/': '/guide/collagene-type-1-2-3',

    // Cheveux
    '/le-collagene-pour-les-cheveux':  '/guide/collagene-cheveux',
    '/le-collagene-pour-les-cheveux/': '/guide/collagene-cheveux',

    // Qu'est-ce que / formation
    '/pourquoi-la-production-de-collagene-diminue-avec-lage':  '/guide/qu-est-ce-que-le-collagene',
    '/pourquoi-la-production-de-collagene-diminue-avec-lage/': '/guide/qu-est-ce-que-le-collagene',
    '/comment-se-forme-le-collagene-dans-le-corps':            '/guide/qu-est-ce-que-le-collagene',
    '/comment-se-forme-le-collagene-dans-le-corps/':           '/guide/qu-est-ce-que-le-collagene',
    '/quest-ce-que-le-collagene':                              '/guide/qu-est-ce-que-le-collagene',
    '/quest-ce-que-le-collagene/':                             '/guide/qu-est-ce-que-le-collagene',

    // Ongles
    '/collagene-et-ongles':  '/guide/collagene-ongles',
    '/collagene-et-ongles/': '/guide/collagene-ongles',

    // Acide hyaluronique
    '/collagene-et-acide-hyaluronique':  '/guide/collagene-acide-hyaluronique',
    '/collagene-et-acide-hyaluronique/': '/guide/collagene-acide-hyaluronique',

    // Marin vs bovin
    '/collagene-marin-ou-bovin-lequel-choisir':  '/guide/collagene-marin-vs-bovin',
    '/collagene-marin-ou-bovin-lequel-choisir/': '/guide/collagene-marin-vs-bovin',

    // Dosage
    '/dose-collagene-par-jour':  '/guide/comment-prendre-collagene',
    '/dose-collagene-par-jour/': '/guide/comment-prendre-collagene',

    // Effets secondaires / dangers
    '/le-collagene-marin-dangers-et-precautions-a-connaitre':  '/guide/effets-secondaires-collagene',
    '/le-collagene-marin-dangers-et-precautions-a-connaitre/': '/guide/effets-secondaires-collagene',
    '/collagene-marin-contre-indication':                      '/guide/collagene-marin-contre-indication',
    '/collagene-marin-contre-indication/':                     '/guide/collagene-marin-contre-indication',
    '/collagene-marin-hypertension':                           '/guide/collagene-marin-contre-indication',
    '/collagene-marin-hypertension/':                          '/guide/collagene-marin-contre-indication',

    // Peau
    '/les-bienfaits-du-collagene-pour-la-peau':                    '/guide/collagene-peau-anti-age',
    '/les-bienfaits-du-collagene-pour-la-peau/':                   '/guide/collagene-peau-anti-age',
    '/creme-a-base-de-collagene-un-allie-anti-age-pour-la-peau':   '/guide/creme-collagene',
    '/creme-a-base-de-collagene-un-allie-anti-age-pour-la-peau/':  '/guide/creme-collagene',
    '/collagene-7-bienfaits-prouves-pour-la-peau-et-la-sante':     '/guide/bienfaits-collagene',
    '/collagene-7-bienfaits-prouves-pour-la-peau-et-la-sante/':    '/guide/bienfaits-collagene',

    // Comparatif marin
    '/comparateur-collagene-marin-2026':  '/guide/meilleur-collagene-marin',
    '/comparateur-collagene-marin-2026/': '/guide/meilleur-collagene-marin',

    // Arthrose
    '/meilleur-collagene-arthrose':  '/guide/meilleur-collagene-arthrose',
    '/meilleur-collagene-arthrose/': '/guide/meilleur-collagene-arthrose',

    // Vitamine C
    '/collagene-marin-vitamine-c':  '/guide/collagene-acide-hyaluronique',
    '/collagene-marin-vitamine-c/': '/guide/collagene-acide-hyaluronique',

    // Ménopause
    '/collagene-menopause':  '/guide/collagene-menopause',
    '/collagene-menopause/': '/guide/collagene-menopause',

    // Poids
    '/collagene-fait-il-grossir':  '/guide/collagene-prise-de-poids',
    '/collagene-fait-il-grossir/': '/guide/collagene-prise-de-poids',
    '/collagene-prise-de-poids':   '/guide/collagene-prise-de-poids',
    '/collagene-prise-de-poids/':  '/guide/collagene-prise-de-poids',

    // Vegan
    '/collagene-vegan':  '/guide/collagene-vegan',
    '/collagene-vegan/': '/guide/collagene-vegan',

    // Fatigue / Sommeil
    '/collagene-fatigue':  '/guide/collagene-fatigue',
    '/collagene-fatigue/': '/guide/collagene-fatigue',
    '/collagene-sommeil':  '/guide/collagene-sommeil',
    '/collagene-sommeil/': '/guide/collagene-sommeil',

    // Tripeptides
    '/tripeptides-de-collagene':  '/guide/collagene-type-1-2-3',
    '/tripeptides-de-collagene/': '/guide/collagene-type-1-2-3',

    // Catégories WP
    '/category/tout-savoir-sur-le-collagene':        '/guide',
    '/category/tout-savoir-sur-le-collagene/':       '/guide',
    '/category/tout-savoir-sur-le-collagene/page/2': '/guide',
    '/category/beaute':                              '/guide',
    '/category/beaute/':                             '/guide',
    '/category/beaute/page/2':                       '/guide',
    '/category/bienfaits':                           '/guide',
    '/category/bienfaits/':                          '/guide',
    '/category/uncategorized':                       '/guide',
    '/category/uncategorized/':                      '/guide',
    '/category/uncategorized/page/2':                '/guide',

    // Auteur
    '/author/administrateur':        '/guide',
    '/author/administrateur/':       '/guide',
    '/author/administrateur/page/2': '/guide',
    '/author/administrateur/page/3': '/guide',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/api/'),
    }),
  ],

  adapter: vercel({
    functionPerRoute: false,
    edgeMiddleware: false,
  }),
});
