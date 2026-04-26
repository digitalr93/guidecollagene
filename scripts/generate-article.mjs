#!/usr/bin/env node
/**
 * generate-article.mjs
 * Prend le prochain article dans content-queue.json,
 * appelle l'API Anthropic pour le générer,
 * et le sauvegarde dans src/content/articles/.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-article.mjs
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-article.mjs --slug collagene-sport-performance
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const QUEUE_PATH = join(__dirname, 'content-queue.json');
const ARTICLES_DIR = join(ROOT, 'src/content/articles');
const PUBLISHED_PATH = join(__dirname, 'published.json');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY manquante');
  process.exit(1);
}

// Charger la queue
const queue = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
const published = existsSync(PUBLISHED_PATH)
  ? JSON.parse(readFileSync(PUBLISHED_PATH, 'utf8'))
  : [];

// Trouver le prochain article à générer
let targetSlug = null;
const slugArg = process.argv.find(a => a.startsWith('--slug='));
if (slugArg) {
  targetSlug = slugArg.split('=')[1];
}

const nextItem = targetSlug
  ? queue.find(q => q.slug === targetSlug)
  : queue.find(q => !published.includes(q.slug));

if (!nextItem) {
  console.log('✅ Tous les articles de la queue ont été générés !');
  process.exit(0);
}

const outputPath = join(ARTICLES_DIR, `${nextItem.slug}.md`);
if (existsSync(outputPath) && !process.env.FORCE) {
  console.log(`⏭️  Article déjà existant: ${nextItem.slug} (utilise FORCE=1 pour écraser)`);
  if (!published.includes(nextItem.slug)) {
    published.push(nextItem.slug);
    writeFileSync(PUBLISHED_PATH, JSON.stringify(published, null, 2));
  }
  process.exit(0);
}

console.log(`📝 Génération de: ${nextItem.slug}`);

// Construire la date du jour
const today = new Date().toISOString().split('T')[0];

// Construire featuredProducts YAML
const featuredProductsYaml = nextItem.featuredProducts?.length
  ? `featuredProducts:\n${nextItem.featuredProducts.map(p => `  - "${p}"`).join('\n')}`
  : '';

// Construire les tags YAML
const tagsYaml = nextItem.tags?.length
  ? `tags:\n${nextItem.tags.map(t => `  - "${t}"`).join('\n')}`
  : 'tags: []';

const systemPrompt = `Tu es un expert en nutrition et compléments alimentaires, rédacteur principal de guidecollagene.fr.
Site de référence sur les compléments de collagène, public : adultes 25-55 ans, consommateurs informés et sceptiques du marketing.
Ton : expert, factuel, sans bullshit. Ni trop académique, ni trop commercial.
Tu cites des études réelles quand tu en parles (auteur + année suffisent).
Tu signales toujours les liens commerciaux.
Tu utilises le code promo NME_GC (-5%) pour Nutrimuscle quand tu le mentionnes.`;

const userPrompt = `Écris un article complet pour guidecollagene.fr sur le sujet suivant.

**Slug :** ${nextItem.slug}
**Titre :** ${nextItem.title}
**Angle éditorial :** ${nextItem.angle}

**Format de sortie — OBLIGATOIRE :**
Génère UNIQUEMENT un fichier Markdown valide commençant par le frontmatter YAML suivant, sans rien avant ni après :

\`\`\`
---
title: "${nextItem.title}"
description: "[Ta description SEO 130-155 caractères]"
category: ${nextItem.category}
${tagsYaml}
author: "Le pro du collagène"
publishedAt: ${today}
updatedAt: ${today}
image: "[URL Unsplash pertinente format https://images.unsplash.com/photo-XXXXX?w=1200&q=80]"
imageAlt: "[Description alt text de l'image]"
draft: false
featured: false
${featuredProductsYaml}
faq:
  - question: "[Question fréquente 1]"
    answer: "[Réponse concise et factuelle]"
  - question: "[Question fréquente 2]"
    answer: "[Réponse concise et factuelle]"
  - question: "[Question fréquente 3]"
    answer: "[Réponse concise et factuelle]"
---
\`\`\`

**Contenu :**
- 1500 à 2500 mots
- H2 pour les sections majeures, H3 pour les sous-sections (pas de H4)
- Au moins un tableau comparatif si pertinent
- Citer 2-4 études réelles (auteur, année)
- Mentionner Nutrimuscle avec lien [Nutrimuscle Marin](/produit/nutrimuscle-collagene-marin) ou [Nutrimuscle Bovin](/produit/nutrimuscle-collagene-bovin) et code NME_GC au moins une fois
- Terminer par une section "Notre verdict" ou "En pratique" avec recommandation actionnable
- Disclosure affilié : "Liens sponsorisés · Code NME_GC pour -5% sur Nutrimuscle"

Génère UNIQUEMENT le contenu Markdown (frontmatter + corps), sans bloc de code englobant, sans commentaire autour.`;

// Appel API Anthropic
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-opus-4-5',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }),
});

if (!response.ok) {
  const err = await response.text();
  console.error('❌ Erreur API Anthropic:', response.status, err);
  process.exit(1);
}

const data = await response.json();
let content = data.content?.[0]?.text ?? '';

// Nettoyer si le modèle a quand même mis des backticks
content = content.replace(/^```(?:markdown|md)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();

// Vérifier que ça commence bien par ---
if (!content.startsWith('---')) {
  console.error('❌ La réponse ne commence pas par un frontmatter YAML valide');
  console.error('Début reçu:', content.substring(0, 200));
  process.exit(1);
}

// Sauvegarder
writeFileSync(outputPath, content, 'utf8');
console.log(`✅ Article généré : ${outputPath}`);

// Marquer comme publié
if (!published.includes(nextItem.slug)) {
  published.push(nextItem.slug);
}
writeFileSync(PUBLISHED_PATH, JSON.stringify(published, null, 2));
console.log(`📋 Queue mise à jour : ${published.length}/${queue.length} articles générés`);
