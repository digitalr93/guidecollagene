#!/usr/bin/env node
/**
 * replenish-queue.mjs
 * Maintient toujours ~30 sujets non publiés dans content-queue.json.
 * Appelle l'API Anthropic pour générer de nouveaux sujets SEO uniques.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/replenish-queue.mjs
 *   ANTHROPIC_API_KEY=sk-... node scripts/replenish-queue.mjs --target=40
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = join(__dirname, 'content-queue.json');
const PUBLISHED_PATH = join(__dirname, 'published.json');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY manquante');
  process.exit(1);
}

const TARGET = parseInt(
  process.argv.find(a => a.startsWith('--target='))?.split('=')[1] ?? '30'
);

const queue = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
const published = existsSync(PUBLISHED_PATH)
  ? JSON.parse(readFileSync(PUBLISHED_PATH, 'utf8'))
  : [];

const remaining = queue.filter(q => !published.includes(q.slug)).length;
const needed = TARGET - remaining;

if (needed <= 0) {
  console.log(`✅ Queue suffisante : ${remaining} sujets restants (cible : ${TARGET})`);
  process.exit(0);
}

console.log(`📋 Queue : ${remaining} restants → génération de ${needed} nouveaux sujets...`);

// Tous les slugs existants pour éviter les doublons
const allSlugs = queue.map(q => q.slug);

const systemPrompt = `Tu es un expert SEO et éditorial spécialisé dans les compléments alimentaires de collagène.
Tu génères des sujets d'articles pour guidecollagene.fr — site de référence français sur le collagène.
Public : adultes 25-55 ans, consommateurs informés.
Objectif : trafic organique Google France via des articles de fond (evergreen).`;

const userPrompt = `Génère exactement ${needed} nouveaux sujets d'articles pour guidecollagene.fr.

**Slugs déjà existants à NE PAS répéter :**
${allSlugs.map(s => `- ${s}`).join('\n')}

**Catégories disponibles :** Science, Sante, Sport, Beaute, Guide, comparatif, peptides, vegetal, Alimentation

**Produits affiliés disponibles :**
- nutrimuscle-collagene-marin
- nutrimuscle-collagene-bovin
- kreme-paris-creme-collagene

**Critères pour les sujets :**
- Fort potentiel SEO France (recherches informationelles ou transactionnelles réelles)
- Pas de doublons avec la liste ci-dessus
- Variété : mélanger science, santé, beauté, sport, comparatifs, guides pratiques
- Angle original, pas générique

**Format de réponse — OBLIGATOIRE : JSON valide uniquement, sans aucun texte avant ou après :**
[
  {
    "slug": "slug-en-kebab-case",
    "title": "Titre de l'article en français",
    "category": "UneDesCategories",
    "tags": ["tag1", "tag2", "tag3"],
    "featuredProducts": ["nutrimuscle-collagene-marin"],
    "angle": "Description de l'angle éditorial en 1-2 phrases, sources à citer, point de différenciation"
  }
]

Génère exactement ${needed} objets dans le tableau JSON.`;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
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
let raw = data.content?.[0]?.text ?? '';

// Nettoyer si le modèle a mis des backticks ou du texte autour
raw = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();

// Extraire le tableau JSON si du texte parasite entoure
const match = raw.match(/\[[\s\S]*\]/);
if (!match) {
  console.error('❌ Réponse non parseable:', raw.substring(0, 300));
  process.exit(1);
}

let newTopics;
try {
  newTopics = JSON.parse(match[0]);
} catch (e) {
  console.error('❌ JSON invalide:', e.message);
  console.error('Reçu:', match[0].substring(0, 300));
  process.exit(1);
}

// Dédupliquer par rapport aux slugs existants
const existingSlugs = new Set(allSlugs);
const filtered = newTopics.filter(t => {
  if (!t.slug || existingSlugs.has(t.slug)) {
    console.log(`⏭️  Doublon ignoré : ${t.slug}`);
    return false;
  }
  existingSlugs.add(t.slug);
  return true;
});

if (filtered.length === 0) {
  console.warn('⚠️ Aucun sujet unique généré');
  process.exit(0);
}

// Ajouter à la queue
const updatedQueue = [...queue, ...filtered];
writeFileSync(QUEUE_PATH, JSON.stringify(updatedQueue, null, 2), 'utf8');

console.log(`✅ ${filtered.length} sujet(s) ajouté(s) à la queue`);
console.log(`📊 Queue totale : ${updatedQueue.length} sujets (${TARGET - (remaining + filtered.length) <= 0 ? '✅' : '⚠️'} cible atteinte)`);
filtered.forEach(t => console.log(`   + ${t.slug}`));
