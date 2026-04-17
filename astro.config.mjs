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
    '/les-bienfaits-du-collagene-pour-les-articulations':  '/guide/collagene-articulations',
    '/les-bienfaits-du-collagene-pour-les-articulations/': '/guide/collagene-articulations',
    '/les-differents-types-de-collagene':                  '/guide/collagene-type-1-2-3',
    '/les-differents-types-de-collagene/':                 '/guide/collagene-type-1-2-3',
    '/le-collagene-pour-les-cheveux':                      '/guide/collagene-cheveux',
    '/le-collagene-pour-les-cheveux/':                     '/guide/collagene-cheveux',
    '/pourquoi-la-production-de-collagene-diminue-avec-lage':  '/guide/qu-est-ce-que-le-collagene',
    '/pourquoi-la-production-de-collagene-diminue-avec-lage/': '/guide/qu-est-ce-que-le-collagene',
    '/collagene-et-ongles':                                '/guide/collagene-ongles',
    '/collagene-et-ongles/':                               '/guide/collagene-ongles',
    '/collagene-et-acide-hyaluronique':                    '/guide/collagene-acide-hyaluronique',
    '/collagene-et-acide-hyaluronique/':                   '/guide/collagene-acide-hyaluronique',
    '/collagene-marin-ou-bovin-lequel-choisir':            '/guide/collagene-marin-vs-bovin',
    '/collagene-marin-ou-bovin-lequel-choisir/':           '/guide/collagene-marin-vs-bovin',
    '/dose-collagene-par-jour':                            '/guide/comment-prendre-collagene',
    '/dose-collagene-par-jour/':                           '/guide/comment-prendre-collagene',
    '/comment-se-forme-le-collagene-dans-le-corps':        '/guide/qu-est-ce-que-le-collagene',
    '/comment-se-forme-le-collagene-dans-le-corps/':       '/guide/qu-est-ce-que-le-collagene',
    '/le-collagene-marin-dangers-et-precautions-a-connaitre':  '/guide/effets-secondaires-collagene',
    '/le-collagene-marin-dangers-et-precautions-a-connaitre/': '/guide/effets-secondaires-collagene',
    '/les-bienfaits-du-collagene-pour-la-peau':            '/guide/collagene-peau-anti-age',
    '/les-bienfaits-du-collagene-pour-la-peau/':           '/guide/collagene-peau-anti-age',
    '/category/tout-savoir-sur-le-collagene':              '/guide',
    '/category/tout-savoir-sur-le-collagene/':             '/guide',
    '/category/beaute':                                    '/guide',
    '/category/beaute/':                                   '/guide',
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
