/**
 * /api/diagnostic-lead
 * POST — Enregistre le lead diagnostic (email + réponses) et envoie l'email personnalisé.
 *
 * Supabase : créer la table via le dashboard SQL Editor :
 * ─────────────────────────────────────────────────────
 * CREATE TABLE diagnostic_leads (
 *   id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   email        text NOT NULL,
 *   objectif     text,
 *   budget       text,
 *   format       text,
 *   product_slug text,
 *   created_at   timestamptz DEFAULT now()
 * );
 * CREATE INDEX ON diagnostic_leads (email);
 * ─────────────────────────────────────────────────────
 *
 * ENV requis : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const SITE = 'https://guidecollagene.fr';

// ─── Labels lisibles ───────────────────────────────────────────────────────

const OBJECTIF_LABELS: Record<string, string> = {
  peau:          'Peau & anti-âge',
  articulations: 'Articulations & mobilité',
  sport:         'Sport & récupération',
  cheveux:       'Cheveux & ongles',
  vitalite:      'Vitalité & énergie',
};

const BUDGET_LABELS: Record<string, string> = {
  eco:      'économique (< 25 €/mois)',
  standard: 'standard (25–45 €/mois)',
  premium:  'premium (> 45 €/mois)',
};

// ─── Contenu personnalisé par objectif ────────────────────────────────────

type ObjectifContent = {
  intro: string;
  protocol: string[];
  science: string;
  tip: string;
  guideUrl: string;
  guideLabel: string;
};

const CONTENT: Record<string, ObjectifContent> = {
  peau: {
    intro: "Le collagène est l'actif anti-âge le mieux documenté pour la peau. Voici exactement comment en tirer le maximum.",
    protocol: [
      "10 g/jour de peptides hydrolysés (ou 2,5 g si vous utilisez des peptides Verisol®)",
      "Associer à 200–500 mg de vitamine C (cofacteur indispensable)",
      "Durée minimale : 8 semaines — résultats optimaux à 12–16 semaines",
      "Prendre de préférence le matin à jeun ou dans votre café",
    ],
    science: "Une méta-analyse de Bolke et al. (2019, <em>Nutrients</em>) portant sur 11 études randomisées (805 participants) confirme une amélioration significative de l'élasticité cutanée (+28 % d'hydratation) après 8 à 12 semaines à 2,5–10 g/jour.",
    tip: "Les UV dégradent le collagène 10× plus vite que vous ne pouvez en synthétiser. Appliquer un SPF 50 tous les matins est l'acte anti-âge le plus rentable — avant même la supplémentation.",
    guideUrl: "/guide/bienfaits-collagene",
    guideLabel: "Bienfaits du collagène : ce que disent les études",
  },
  articulations: {
    intro: "Pour les articulations, le choix du type de collagène et du dosage est crucial. Voici le protocole validé cliniquement.",
    protocol: [
      "10 g/jour de peptides hydrolysés (Peptan® ou équivalent certifié)",
      "OU UC-II® 40 mg/jour (type II natif — mécanisme différent, souvent plus puissant)",
      "Associer à 200 mg de vitamine C",
      "Durée : minimum 12 semaines, effets optimaux à 24 semaines",
      "Prendre 30 minutes avant une activité physique pour optimiser l'apport aux cartilages",
    ],
    science: "L'étude Clark et al. (2008, <em>Current Medical Research and Opinion</em>) sur 147 athlètes universitaires montre une réduction significative de la douleur articulaire après 24 semaines à 10 g/jour. Une étude comparative (Crowley et al., 2009) a démontré la supériorité du UC-II® 40 mg sur la glucosamine + chondroïtine à 180 jours.",
    tip: "La chaleur appliquée sur l'articulation 30 minutes après la prise augmente le flux sanguin local et améliore la distribution des peptides vers le cartilage.",
    guideUrl: "/guide/bienfaits-collagene",
    guideLabel: "Bienfaits du collagène : ce que disent les études",
  },
  sport: {
    intro: "Pour les sportifs, le timing est aussi important que le dosage. Un protocole précis maximise la synthèse tendineuse.",
    protocol: [
      "15 g de peptides de collagène hydrolysé",
      "Associer à 50–200 mg de vitamine C",
      "Prendre 30 à 60 minutes AVANT l'entraînement (pas après)",
      "Compléter avec 20–30 g de protéines riches en leucine après l'effort (whey ou source animale) — le collagène est pauvre en BCAA",
      "Durée : 8–12 semaines pour des effets tendineux mesurables",
    ],
    science: "Shaw et al. (2017, <em>American Journal of Clinical Nutrition</em>) ont montré que 15 g de gélatine + vitamine C pris 1h avant un exercice augmentent significativement la synthèse de collagène dans les tendons. Le timing pré-entraînement est documenté — l'activité physique « dirige » les peptides vers les tissus conjonctifs sollicités.",
    tip: "Le collagène ne remplace pas la whey pour la masse musculaire — il est pauvre en leucine. Utilisez-le pour les tendons et ligaments, la whey pour les muscles. Les deux sont complémentaires.",
    guideUrl: "/guide/collagene-sport-performance",
    guideLabel: "Collagène et sport : le guide complet",
  },
  cheveux: {
    intro: "Les cheveux poussent lentement — il faut anticiper. Voici le protocole efficace avec les bons actifs associés.",
    protocol: [
      "5 à 10 g/jour de collagène marin type I hydrolysé",
      "Associer à de la biotine (5 mg/jour)",
      "Zinc 10–15 mg/jour (cofacteur de la synthèse de kératine)",
      "Vitamine C 200 mg/jour",
      "Durée minimum : 3 à 6 mois (le cycle capillaire est long — patience requise)",
    ],
    science: "Le collagène type I fournit les précurseurs (proline, glycine, hydroxyproline) nécessaires à la synthèse de kératine, la protéine principale du cheveu. Les données cliniques directes restent limitées, mais l'association collagène + biotine + zinc est la triade la plus utilisée par les dermatologues pour les troubles capillaires.",
    tip: "Un manque de protéines alimentaires est souvent plus responsable de la chute de cheveux que tout autre facteur. Vérifiez votre apport total en protéines (1,2–1,6 g/kg/jour) avant d'investir dans des compléments.",
    guideUrl: "/guide/bienfaits-collagene",
    guideLabel: "Bienfaits du collagène : ce que disent les études",
  },
  vitalite: {
    intro: "La glycine du collagène a des effets documentés sur la qualité du sommeil et l'énergie. Voici comment optimiser votre protocole.",
    protocol: [
      "10 g/jour de collagène hydrolysé (pour couvrir les besoins en glycine : ~2,5–3 g/prise)",
      "Prendre de préférence le soir — la glycine améliore la qualité du sommeil profond",
      "Associer à du magnésium bisglycinate (300 mg le soir) pour l'effet synergique",
      "Vitamine C 200 mg/jour",
      "Durée : 8 semaines minimum",
    ],
    science: "La glycine (acide aminé dominant du collagène, ~33 % de sa composition) a des effets documentés sur la qualité du sommeil en réduisant la température corporelle centrale (Bannai et al., 2012, <em>Sleep and Biological Rhythms</em>). Une étude sur 3 g de glycine avant le coucher a montré une amélioration subjective et objective de la qualité du sommeil.",
    tip: "Le collagène multi-types (I, II, III, V, X) est intéressant pour la vitalité globale car il couvre l'ensemble des tissus conjonctifs — peau, articulations, intestins, vaisseaux. C'est la forme la plus polyvalente.",
    guideUrl: "/guide/bienfaits-collagene",
    guideLabel: "Bienfaits du collagène : ce que disent les études",
  },
};

// ─── Générateur HTML email ─────────────────────────────────────────────────

function buildEmailHtml(params: {
  objectif: string;
  budget: string;
  productTitle: string;
  productBrand: string;
  productSlug: string;
}): string {
  const { objectif, budget, productTitle, productBrand, productSlug } = params;

  const objectifLabel = OBJECTIF_LABELS[objectif] ?? objectif;
  const budgetLabel   = BUDGET_LABELS[budget] ?? budget;
  const content       = CONTENT[objectif] ?? CONTENT.peau;
  const productUrl    = `${SITE}/produit/${productSlug}`;

  const protocolItems = content.protocol
    .map(item => `<li style="padding:6px 0;color:#334155;font-size:14px;line-height:1.6;">${item}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Votre protocole collagène personnalisé</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#d44d2e,#b83a1e);padding:32px;text-align:center;">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Guide Collagène</p>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
        Votre protocole personnalisé<br/>
        <span style="font-weight:400;font-size:16px;opacity:0.9;">${objectifLabel}</span>
      </h1>
    </div>

    <div style="padding:32px;">

      <!-- Intro -->
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
        ${content.intro}
      </p>

      <!-- Produit recommandé -->
      <div style="background:#fef4f1;border:2px solid #fca89a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#d44d2e;text-transform:uppercase;letter-spacing:0.08em;">⭐ Votre sélection — budget ${budgetLabel}</p>
        <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0f172a;">${productTitle}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#64748b;">${productBrand}</p>
        <a href="${productUrl}" style="display:inline-block;background:#d44d2e;color:#ffffff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Voir la fiche produit →
        </a>
      </div>

      <!-- Protocole -->
      <h2 style="margin:0 0 12px;font-size:15px;color:#0f172a;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
        📋 Votre protocole
      </h2>
      <ul style="margin:0 0 24px;padding-left:20px;">
        ${protocolItems}
      </ul>

      <!-- Science -->
      <div style="background:#f1f5f9;border-left:4px solid #d44d2e;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#d44d2e;text-transform:uppercase;letter-spacing:0.05em;">🔬 Ce que dit la science</p>
        <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">${content.science}</p>
      </div>

      <!-- Conseil pratique -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">💡 Conseil pratique</p>
        <p style="margin:0;font-size:13px;color:#78350f;line-height:1.7;">${content.tip}</p>
      </div>

      <!-- CTA guide -->
      <p style="margin:0 0 8px;font-size:14px;color:#475569;">Pour aller plus loin :</p>
      <a href="${SITE}${content.guideUrl}" style="display:block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 20px;text-decoration:none;color:#0f172a;font-size:14px;font-weight:600;">
        📖 ${content.guideLabel} →
      </a>

    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
        Vous recevez cet email car vous avez utilisé le diagnostic sur <a href="${SITE}" style="color:#d44d2e;">guidecollagene.fr</a>.
      </p>
      <p style="margin:0;font-size:11px;color:#cbd5e1;">
        Liens affiliés — les avis sont indépendants du référencement.
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Handler ───────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps JSON invalide.' }), { status: 400, headers });
  }

  const { email, objectif, budget, format, productSlug, productTitle, productBrand } = body;

  // Validation email
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRe.test(email)) {
    return new Response(JSON.stringify({ error: 'Email invalide.' }), { status: 400, headers });
  }

  // ── 1. Supabase : enregistrement du lead ────────────────────────────────
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/diagnostic_leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          email,
          objectif: objectif ?? null,
          budget:   budget ?? null,
          format:   format ?? null,
          product_slug: productSlug ?? null,
        }),
      });
    } catch (err) {
      console.error('[diagnostic-lead] Supabase error:', err);
      // On continue même si Supabase échoue — l'email est prioritaire
    }
  }

  // ── 2. Resend : email personnalisé ──────────────────────────────────────
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY manquant.' }), { status: 500, headers });
  }

  const resend = new Resend(apiKey);
  const objectifLabel = OBJECTIF_LABELS[objectif] ?? 'Collagène';

  const { error } = await resend.emails.send({
    from: 'Guide Collagène <onboarding@resend.dev>',
    to:   email,
    subject: `Votre protocole collagène — ${objectifLabel}`,
    html: buildEmailHtml({
      objectif:     objectif ?? 'peau',
      budget:       budget ?? 'standard',
      productTitle: productTitle ?? '',
      productBrand: productBrand ?? '',
      productSlug:  productSlug ?? 'nutriandco-collagene-naticol',
    }),
  });

  if (error) {
    console.error('[diagnostic-lead] Resend error:', error);
    return new Response(JSON.stringify({ error: 'Erreur envoi email.' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};
