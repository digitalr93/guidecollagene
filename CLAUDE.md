# CLAUDE.md — guidecollagene.fr

Guide de référence pour tous les agents Claude travaillant sur ce projet.

## Vue d'ensemble

Site Astro.js (SSG + SSR hybride) de référence sur les compléments de collagène.
Orientation principale : **SEO + affiliation**. Chaque décision technique doit servir l'un ou l'autre.

- **URL prod** : https://guidecollagene.fr
- **Repo** : https://github.com/digitalr93/guidecollagene
- **Hébergement** : Vercel (Hobby)
- **DB** : Supabase (tracking affiliation)

---

## Stack technique

| Outil | Version | Usage |
|---|---|---|
| Astro | ^6 | Framework principal (SSG + SSR) |
| Tailwind CSS | v4 | Styling (via @tailwindcss/vite) |
| TypeScript | strict | Tout le code TS est strict |
| @astrojs/vercel | adapter | Déploiement Vercel |
| @astrojs/sitemap | intégration | Sitemap auto |
| @astrojs/rss | intégration | Feed RSS |
| Supabase | via REST | Tracking clics/conversions |

**Node requis : >=22.12.0** (nvm recommandé)

---

## Architecture des fichiers

```
src/
├── content/           # Content Collections (Astro)
│   ├── articles/      # Guides SEO (.md)
│   ├── produits/      # Fiches produit (.md)
│   └── auteurs/       # Profils auteurs E-E-A-T (.md)
├── content.config.ts  # Schémas Zod des collections
├── layouts/
│   ├── BaseLayout.astro     # Layout de base (SEO, header, footer)
│   ├── ArticleLayout.astro  # Layout articles + JSON-LD Article + FAQ
│   └── ProductLayout.astro  # Layout produit + JSON-LD Product
├── pages/
│   ├── index.astro
│   ├── comparatif.astro
│   ├── guide/[slug].astro
│   ├── produit/[slug].astro
│   ├── categorie/[slug].astro
│   ├── rss.xml.js
│   └── api/
│       ├── click.ts        # SSR — tracking clics affiliés
│       └── conversion.ts   # SSR — postback réseau affilié
├── components/
│   ├── layout/      # Header, Footer
│   ├── affiliate/   # AffiliateButton (tracking sendBeacon)
│   └── seo/         # SchemaOrg (à étoffer)
├── lib/
│   ├── seo.ts        # Constantes SEO + helpers
│   ├── affiliate.ts  # Build URL affiliée + UTM + clickId
│   └── tracking.ts   # sendBeacon vers /api/click
└── styles/
    └── global.css    # Tailwind v4 + tokens + utilities
```

---

## Conventions de code

### TypeScript
- Mode **strict** partout.
- Pas de `any`. Utiliser `unknown` si le type est incertain.
- Props de composants Astro via `interface Props { ... }` dans le frontmatter.

### Astro
- **SSG par défaut** (`output: 'static'`). Seuls `/api/*` sont SSR (`export const prerender = false`).
- Utiliser `getCollection()` + `render()` d'`astro:content` pour les pages dynamiques.
- Importer `global.css` uniquement depuis `BaseLayout.astro`.
- Pas d'`@astrojs/image` — utiliser les balises `<img>` natives avec attributs `loading` et `width/height`.

### Tailwind CSS v4
- Tailwind v4 utilise `@import "tailwindcss"` (pas de `@tailwind base/components/utilities`).
- Les plugins et thème sont configurés via CSS (`@layer`, `@theme`) et non `tailwind.config.js`.
- Utiliser les classes utilitaires Tailwind directement ; créer des composants CSS dans `@layer components` pour les patterns répétés.

### Affiliation
- **Tout lien affilié** doit passer par `<AffiliateButton>` ou `<AffiliateLink>`.
- Attributs obligatoires : `rel="nofollow noopener sponsored"` + `target="_blank"`.
- Le composant injecte automatiquement le tracking `sendBeacon`.
- Disclosure obligatoire à proximité de tout lien affilié.
- Ne jamais hardcoder les tags affiliés en clair dans le code — passer par des variables d'env.

### SEO
- Chaque page doit avoir un `title` unique, une `description` entre 120 et 160 caractères, et un `canonical` explicite.
- JSON-LD Schema.org injecté dans les layouts selon le type de page :
  - Articles → `Article` + `FAQPage` (si FAQ) + `BreadcrumbList`
  - Produits → `Product` + `AggregateRating` + `BreadcrumbList`
  - Homepage → `WebSite`
- Pas de texte redondant entre `<title>` et `<h1>`.

---

## Variables d'environnement

```
# .env.local (ne pas committer)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Utilisé uniquement côté serveur (/api/*)
```

---

## Schéma Supabase (tracking affiliation)

```sql
-- clicks : un enregistrement par clic sur un lien affilié
CREATE TABLE clicks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id    text UNIQUE NOT NULL,
  product_id  text NOT NULL,
  merchant    text NOT NULL,
  destination_url text,
  source_page text,
  referrer    text,
  device      text,
  clicked_at  timestamptz DEFAULT now()
);

-- conversions : postback réseau affilié
CREATE TABLE conversions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id    text REFERENCES clicks(click_id),
  order_id    text UNIQUE NOT NULL,
  amount      numeric(10,2) DEFAULT 0,
  commission  numeric(10,2) DEFAULT 0,
  merchant    text,
  status      text DEFAULT 'pending',
  converted_at timestamptz DEFAULT now()
);
```

---

## Ton éditorial

- **Public cible** : adultes 25–55 ans, consommateurs informés, sceptiques du marketing.
- **Ton** : expert, factuel, sans bullshit. Ni trop académique, ni trop commercial.
- **Longueur** : guides ~1500–3000 mots. Fiches produit ~800–1500 mots.
- **Structure** : H2 pour les sections majeures, H3 pour les sous-sections. Pas de H4.
- **Preuves** : toute affirmation sur les effets doit être sourcée (étude clinique ou méta-analyse).
- **Affiliation** : signaler systématiquement les liens affiliés. Ne jamais présenter un produit comme "le meilleur" sans justification factuelle.

---

## Commandes utiles

```bash
npm run dev        # Dev server (port 4321)
npm run build      # Build production
npm run preview    # Preview build local
npm run typecheck  # TypeScript check
```

---

## Décisions en attente (ne pas implémenter avant validation)

1. **Identité visuelle** : garder l'actuelle ou refonte complète.
2. **Source données produits** : Amazon PAAPI / éditorial manuel / scraping.
3. **Migration DNS** : guidecollagene.fr → Vercel (fin de projet).
4. **Dashboard admin** : pages protégées pour stats affiliation.
