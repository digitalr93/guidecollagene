/**
 * /api/audit-email
 * Génère le rapport d'audit quotidien et l'envoie par email.
 * Appelé automatiquement par le cron Vercel chaque matin.
 *
 * ENV requis : RESEND_API_KEY (https://resend.com — gratuit 3 000 emails/mois)
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { Resend } from 'resend';

const RECIPIENT = 'reekgis@gmail.com';
const SITE = 'https://guidecollagene.fr';

export const GET: APIRoute = async () => {
  const apiKey = import.meta.env.RESEND_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY manquant dans les variables d\'environnement.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 1. Collecte des données ───────────────────────────────────────────
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  const [articles, produits] = await Promise.all([
    getCollection('articles', ({ data }) => !data.draft),
    getCollection('produits',  ({ data }) => !data.draft),
  ]);

  const totalArticles = articles.length;
  const totalProduits = produits.length;

  // Articles les plus récents (7 derniers jours)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newArticles = articles
    .filter(a => a.data.publishedAt >= oneWeekAgo)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  // Articles par catégorie
  const byCategory = articles.reduce<Record<string, number>>((acc, a) => {
    acc[a.data.category] = (acc[a.data.category] ?? 0) + 1;
    return acc;
  }, {});

  // ── Stats Nutrimuscle (clics coupon des 7 derniers jours) ────────────
  let nmClicks = 0;
  let nmCopies = 0;
  let nmCtas = 0;

  if (supabaseUrl && supabaseKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(
        `${supabaseUrl}/rest/v1/clicks?product_id=eq.nutrimuscle-coupon&clicked_at=gte.${since}&select=destination_url`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const rows: { destination_url: string }[] = await res.json();
        nmClicks = rows.length;
        nmCopies = rows.filter(r => r.destination_url?.includes('code-copy')).length;
        nmCtas   = rows.filter(r => r.destination_url?.includes('nmsquad')).length;
      }
    } catch (_) { /* silencieux si Supabase indisponible ou timeout */ }
  }

  // Opportunités de contenu manquant (URLs WP encore sans article dédié)
  const missingTopics = [
    { url: '/collagene-marin-vitamine-c/', article: '/guide/collagene-acide-hyaluronique' },
    { url: '/tripeptides-de-collagene/', article: '/guide/collagene-type-1-2-3' },
    { url: '/collagene-7-bienfaits-prouves-pour-la-peau-et-la-sante/', article: '/guide/bienfaits-collagene' },
    { url: '/collagene-fait-il-grossir/', article: '/guide/collagene-prise-de-poids' },
  ];

  // ── 2. Suggestion du jour (rotatif selon le jour de la semaine) ───────
  const contentIdeas = [
    { title: 'Collagène et sport : le guide complet 2026', desc: 'Tendons, récupération, endurance — tout ce que le sportif doit savoir.' },
    { title: 'Quel collagène pour la cellulite ?', desc: 'Tissu conjonctif, collagène de type IV, protocoles. Volume de recherche élevé, peu de concurrence.' },
    { title: 'Collagène et intestin perméable (leaky gut)', desc: 'Glycine, muqueuse intestinale, études. Sujet santé fort.' },
    { title: 'Les 5 erreurs à ne pas faire avec le collagène', desc: 'Format listicle très partageable, intent informatif.' },
    { title: 'Meilleur collagène bovin 2026 : notre sélection', desc: 'Comparatif bovin — intent commercial fort, bon complément au marin.' },
    { title: 'Collagène en gélules vs poudre : quelle forme choisir ?', desc: 'Comparatif format, biodisponibilité, praticité. Very Searched.' },
    { title: 'Collagène et grossesse : ce qu\'on peut vraiment prendre', desc: 'Sujet ultra-cherché, peu d\'articles qualitatifs.' },
  ];

  const todayIdea = contentIdeas[new Date().getDay() % contentIdeas.length];

  // ── 3. Construction du HTML ────────────────────────────────────────────
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const categoryRows = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => `<tr><td style="padding:4px 12px;border-bottom:1px solid #f1f5f9;">${cat}</td><td style="padding:4px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;">${n}</td></tr>`)
    .join('');

  const newArticlesHtml = newArticles.length
    ? newArticles.map(a => `<li><a href="${SITE}/guide/${a.id}" style="color:#d44d2e;">${a.data.title}</a></li>`).join('')
    : '<li><em>Aucun article publié cette semaine.</em></li>';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#d44d2e;padding:24px 32px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">${today}</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:700;">📊 Audit quotidien — guidecollagene.fr</h1>
    </div>

    <div style="padding:32px;">

      <!-- Stats globales -->
      <h2 style="margin:0 0 16px;font-size:15px;color:#0f172a;text-transform:uppercase;letter-spacing:.05em;">Vue d'ensemble</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="background:#fef4f1;">
          <td style="padding:12px 16px;border-radius:8px 0 0 8px;font-size:13px;color:#64748b;">Articles publiés</td>
          <td style="padding:12px 16px;border-radius:0 8px 8px 0;font-size:22px;font-weight:700;color:#d44d2e;text-align:right;">${totalArticles}</td>
        </tr>
        <tr><td colspan="2" style="height:8px;"></td></tr>
        <tr style="background:#fef4f1;">
          <td style="padding:12px 16px;border-radius:8px 0 0 8px;font-size:13px;color:#64748b;">Produits référencés</td>
          <td style="padding:12px 16px;border-radius:0 8px 8px 0;font-size:22px;font-weight:700;color:#d44d2e;text-align:right;">${totalProduits}</td>
        </tr>
      </table>

      <!-- Répartition par catégorie -->
      <h2 style="margin:0 0 12px;font-size:15px;color:#0f172a;text-transform:uppercase;letter-spacing:.05em;">Articles par catégorie</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
        ${categoryRows}
      </table>

      <!-- Nouveaux articles -->
      <h2 style="margin:0 0 12px;font-size:15px;color:#0f172a;text-transform:uppercase;letter-spacing:.05em;">Nouveautés (7 jours)</h2>
      <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:1.8;">
        ${newArticlesHtml}
      </ul>

      <!-- Redirects en attente -->
      <h2 style="margin:0 0 12px;font-size:15px;color:#0f172a;text-transform:uppercase;letter-spacing:.05em;">Redirects WP → Astro</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px;">
        <thead><tr style="background:#f8fafc;"><th style="padding:6px 10px;text-align:left;">Ancienne URL</th><th style="padding:6px 10px;text-align:left;">Nouvelle URL</th></tr></thead>
        <tbody>
          ${missingTopics.map(t => `<tr><td style="padding:4px 10px;color:#64748b;">${t.url}</td><td style="padding:4px 10px;"><a href="${SITE}${t.article}" style="color:#d44d2e;">${t.article}</a></td></tr>`).join('')}
        </tbody>
      </table>

      <!-- Nutrimuscle coupon stats -->
      <h2 style="margin:0 0 12px;font-size:15px;color:#0f172a;text-transform:uppercase;letter-spacing:.05em;">🏷️ Coupon Nutrimuscle (7 jours)</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="background:#fffbeb;">
          <td style="padding:10px 14px;border-radius:8px 0 0 8px;font-size:13px;color:#64748b;">Total interactions</td>
          <td style="padding:10px 14px;border-radius:0 8px 8px 0;font-size:20px;font-weight:700;color:#d97706;text-align:right;">${nmClicks}</td>
        </tr>
        <tr><td colspan="2" style="height:6px;"></td></tr>
        <tr style="background:#fffbeb;">
          <td style="padding:10px 14px;border-radius:8px 0 0 8px;font-size:13px;color:#64748b;">Code copié (NME_GC)</td>
          <td style="padding:10px 14px;border-radius:0 8px 8px 0;font-size:20px;font-weight:700;color:#d97706;text-align:right;">${nmCopies}</td>
        </tr>
        <tr><td colspan="2" style="height:6px;"></td></tr>
        <tr style="background:#fffbeb;">
          <td style="padding:10px 14px;border-radius:8px 0 0 8px;font-size:13px;color:#64748b;">Clics "En profiter →"</td>
          <td style="padding:10px 14px;border-radius:0 8px 8px 0;font-size:20px;font-weight:700;color:#d97706;text-align:right;">${nmCtas}</td>
        </tr>
      </table>

      <!-- Idée du jour -->
      <div style="background:#fef4f1;border-left:4px solid #d44d2e;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:8px;">
        <p style="margin:0 0 4px;font-size:12px;color:#d44d2e;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">💡 Idée d'article du jour</p>
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0f172a;">${todayIdea.title}</p>
        <p style="margin:0;font-size:13px;color:#64748b;">${todayIdea.desc}</p>
      </div>

    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">
        Envoyé automatiquement par guidecollagene.fr ·
        <a href="${SITE}" style="color:#d44d2e;">Voir le site</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  // ── 4. Envoi ───────────────────────────────────────────────────────────
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: 'Guide Collagène <audit@guidecollagene.fr>',
    to: RECIPIENT,
    subject: `📊 Audit quotidien — ${today}`,
    html,
  });

  if (error) {
    console.error('Resend error:', error);
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ sent: true, to: RECIPIENT, date: today }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
