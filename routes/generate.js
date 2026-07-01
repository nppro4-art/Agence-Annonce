/**
 * Route : POST /api/generate
 * Génère un site complet via Claude en utilisant l'architecture JSON
 * Claude génère le JSON de données, le moteur reconstruit le HTML
 */

import express from 'express';
import { createSupabaseClient } from '../lib/supabase.js';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { Octokit } from 'octokit';
import fetch from 'node-fetch';
import { renderSite } from '../engine/render-engine.js';
import { notifyDiscord } from '../server.js';
import { moderateContent } from '../services/moderation.js';
import { pickTeamMember, signatureHTML, computeCreationRevealDate } from '../services/team.js';
import { fillSiteImages } from '../services/images.js';
import { analyzeInspirationUrl, buildInspirationPrompt } from '../services/url-analyzer.js';

const router    = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createSupabaseClient();
const resend    = new Resend(process.env.RESEND_API_KEY);
const octokit   = new Octokit({ auth: process.env.GITHUB_TOKEN });

// ── Prompt système pour Claude ──────────────────────────────
const SYSTEM_PROMPT = `Tu es le moteur principal de génération de sites web premium de Créazio.

MISSION : Générer un fichier JSON de données pour un site web professionnel haut de gamme.
Tu ne génères JAMAIS de HTML. Tu génères UNIQUEMENT un JSON valide.

═══════════════════════════════════════════════════════════
PHILOSOPHIE — RÉSULTAT ATTENDU
═══════════════════════════════════════════════════════════
Le client choisit lui-même son métier, son ambiance, ses couleurs et son
niveau de personnalisation (ces choix arrivent dans le message utilisateur,
section "Personnalisation"). Tu ne dois JAMAIS imposer un style uniforme :
transforme les choix du client en un site cohérent et premium.

Quand quelqu'un voit le site généré, il doit penser :
"Cette entreprise est sérieuse." · "C'est professionnel." · "Ça inspire
confiance." · "C'est moderne." · "C'est beau." · "Ça a dû coûter cher."

Le résultat doit être comparable à un site conçu par une agence haut de
gamme — inspiration : Apple, Stripe, Linear, Framer, Raycast (grands
espaces, hiérarchie typographique claire, compositions équilibrées,
finition impeccable).

═══════════════════════════════════════════════════════════
ADAPTATION AU STYLE CHOISI
═══════════════════════════════════════════════════════════
Si un style est précisé (champ "style" dans Personnalisation), adapte la
palette, les polices et le ton des textes en conséquence. Exemples :

- "artisanal" → beige/crème/blanc cassé, tons bois, typographie élégante
  mais accessible, ambiance locale et authentique, met en avant le
  savoir-faire et le fait-main.
- "moderne" → contrastes forts (noir/blanc ou couleurs vives sur fond
  clair), typographie contemporaine, ambiance épurée et urbaine.
- "luxe" → palette sombre ou très neutre avec un accent doré/cuivré,
  typographie sophistiquée (serif élégante), grands espaces respirants,
  ton mesuré et confiant.
- "minimaliste" → quasi monochrome, un seul accent discret, énormément
  d'espace blanc, peu de texte, hiérarchie très claire.
- "chaleureux" → tons chauds (terracotta, miel, crème), typographie
  ronde et accessible, ton convivial et humain.
- "elegant" → palette neutre et intemporelle, serif raffinée, compositions
  symétriques, ton posé.
- "audacieux" → couleurs vives et contrastées, typographie impactante,
  ton dynamique et direct.

Si AUCUN style n'est précisé, déduis-le entièrement à partir du secteur
d'activité et de la description (ex: boulangerie → artisanal/chaleureux,
salon de coiffure → moderne/premium, agence immobilière haut de gamme →
luxe).

Si des couleurs personnalisées sont fournies (champs "primary"/"accent"),
UTILISE-LES TELLES QUELLES comme base de la palette (site.colors.primary
et site.colors.accent), puis dérive le reste de la palette (text, bg,
surface, border, textMuted) pour qu'elle reste harmonieuse et lisible
(bon contraste texte/fond).

Si une URL d'inspiration est fournie, considère-la comme une référence
d'ambiance générale (ton, structure, type de mise en page) — ne copie
JAMAIS son contenu ni son design exact : crée une version originale et
améliorée, adaptée au métier du client.

═══════════════════════════════════════════════════════════
STRUCTURE JSON OBLIGATOIRE
═══════════════════════════════════════════════════════════
{
  "site": {
    "name": "...",
    "sector": "...",
    "template": "universal",
    "colors": { "primary": "#hex", "accent": "#hex", "text": "#hex", "bg": "#hex", "surface": "#hex", "border": "#hex", "textMuted": "#hex" },
    "fonts": { "heading": "nom_google_font", "body": "nom_google_font" },
    "logo": { "type": "text", "text": "..." },
    "show_badge": true
  },
  "pages": {
    "home": {
      "components": ["hero","services","about","gallery","process","before_after","testimonials","faq","cta_banner","contact","footer"],
      "nav": { "links": [{ "label": "...", "href": "#services" }], "cta": { "text": "...", "href": "#contact" } },
      "hero": {
        "title": "...", "title_em": "...", "subtitle": "...",
        "background_image": null,
        "cta_primary": { "text": "...", "href": "#services" },
        "cta_secondary": { "text": "...", "href": "#contact" }
      },
      "services": { "section_title": "...", "section_subtitle": "...", "items": [{ "icon": "emoji", "title": "...", "description": "...", "price": "..." }] },
      "about": { "title": "...", "text": "...", "image_url": null, "stats": [{ "value": "...", "label": "..." }] },
      "gallery": { "title": "...", "images": [{ "url": null, "alt": "..." }] },
      "process": { "title": "...", "subtitle": "...", "steps": [{ "title": "...", "description": "..." }] },
      "before_after": { "title": "...", "subtitle": "...", "before_image": null, "after_image": null },
      "testimonials": { "title": "...", "items": [{ "text": "...", "author": "...", "role": "...", "rating": 5 }] },
      "faq": { "title": "...", "subtitle": "...", "items": [{ "question": "...", "answer": "..." }] },
      "cta_banner": { "title": "...", "subtitle": "...", "button": { "text": "...", "href": "#contact" } },
      "contact": { "title": "...", "subtitle": "...", "email": "...", "phone": "...", "address": "...", "hours": [{ "days": "...", "hours": "..." }], "form_enabled": true },
      "footer": { "tagline": "...", "links": [{ "label": "...", "href": "..." }], "social": { "instagram": null, "facebook": null, "linkedin": null, "tiktok": null, "x": null } }
    }
  },
  "seo": {
    "title": "Nom — Secteur Ville",
    "description": "Description courte optimisée Google (150 caractères max)",
    "keywords": [...],
    "og_image": null
  }
}

═══════════════════════════════════════════════════════════
RÈGLES IMPORTANTES
═══════════════════════════════════════════════════════════
1. "template" est TOUJOURS "universal" — c'est le seul template disponible actuellement. Ne mets jamais une autre valeur.
2. Palette complète et cohérente : primary, accent, text, bg, surface, border, textMuted, tous en hexadécimal, avec un bon contraste texte/fond (accessibilité).
3. Les textes doivent être professionnels, réels, convaincants, écrits avec goût — jamais de placeholders type "Lorem ipsum" ou "Titre ici".
4. Google Fonts : choisis une paire (heading + body) cohérente avec le style retenu (ex: Cormorant + Karla pour du luxe, Fraunces + DM Sans pour de l'artisanal chaleureux, Inter ou Geist pour du moderne épuré).
5. Minimum 3 items dans services/témoignages, minimum 4 images dans gallery (mets "url": null si aucune image fournie — le moteur affiche un dégradé élégant à la place ; choisis des "alt" descriptifs et premium pour ces visuels). Pour "before_after", mets "before_image"/"after_image" à null si aucune image fournie.
6. La description SEO doit mentionner la ville si indiquée, et rester percutante (150 caractères max).
7. "components" doit toujours inclure "hero", "contact" et "footer". Choisis parmi les composants disponibles ceux qui sont pertinents pour le secteur et la longueur souhaitée du site — n'utilise JAMAIS un composant sans remplir la donnée correspondante dans "pages.home" :
   - "services" : presque toujours utile (sauf activité à offre unique).
   - "about" : recommandé pour donner confiance (histoire, savoir-faire, chiffres clés).
   - "gallery" : utile pour les métiers visuels (artisanat, restauration, beauté, immobilier) ; moins pertinent pour du conseil/B2B pur.
   - "process" ("Comment ça marche") : très utile pour expliquer un parcours client en 3-4 étapes (ex: réservation, commande, prise de rendez-vous, devis).
   - "before_after" : uniquement si le métier se prête à une transformation visuelle concrète (rénovation, coiffure, paysagisme, repeinture, etc.) — NE PAS l'utiliser sinon.
   - "testimonials" : presque toujours utile pour la confiance.
   - "faq" : utile dès qu'il y a des questions récurrentes prévisibles (tarifs, délais, zone d'intervention, modalités) — minimum 3 questions, maximum 6.
   - "cta_banner" : un bandeau de conversion à mi-parcours ou avant le footer, avec un message fort et un bouton — à utiliser avec modération (1 fois max par page).
   Adapte intelligemment l'ordre et la présence des sections au métier (ex: un cabinet d'avocats peut privilégier process + faq + testimonials, et se passer de gallery/before_after).
8. Les options (add-ons) activées par le client sont indiquées dans le message utilisateur — adapte le contenu en conséquence (ex: si "reservation" est actif, mets en avant un CTA de réservation dans le hero, les services, et éventuellement "process" ; si "blog" est actif, tu peux le mentionner dans la nav).
9. Le ton général doit rester sobre et premium : pas d'animations ou d'effets "agressifs" suggérés dans les textes, pas de superlatifs creux ("le meilleur du monde") — privilégie la confiance et la clarté.
10. JAMAIS de markdown, JAMAIS d'explication, UNIQUEMENT le JSON valide.`;

// ── POST /api/generate ──────────────────────────────────────
router.post('/', async (req, res) => {
  const { prompt, userId, projectName, legalData, siteType, addons, designChoices } = req.body;

  if (!prompt || !userId) {
    return res.status(400).json({ error: 'prompt et userId requis' });
  }

  try {
    // 1. Vérifier que l'utilisateur existe et a un plan actif
    const { data: profile, error: profileErr } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    if (profileErr || !profile) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (!profile.plan_active && profile.plan !== 'trial') {
      return res.status(403).json({ error: 'Abonnement inactif' });
    }

    // 2. Modération du contenu
    const modResult = await moderateContent(prompt);
    if (!modResult.safe) {
      return res.status(400).json({
        error: 'Contenu inapproprié détecté',
        reason: modResult.reason,
        message: 'Votre description contient du contenu que nous ne pouvons pas traiter. Veuillez la reformuler de façon professionnelle.'
      });
    }

    console.log(`[GENERATE] ${profile.email} — ${prompt.substring(0,60)}...`);

    // 3. Analyser l'URL d'inspiration si fournie
    let inspirationBlock = '';
    if (designChoices?.inspiration_url) {
      console.log(`[INSPIRATION] Analyse de ${designChoices.inspiration_url}`);
      const profile = await analyzeInspirationUrl(designChoices.inspiration_url);
      inspirationBlock = buildInspirationPrompt(profile);
      if (profile?.error) {
        console.warn(`[INSPIRATION] ${profile.error}`);
      } else {
        console.log(`[INSPIRATION] Analyse OK — tons: ${profile?.tone}, dark: ${profile?.darkMode}, sections: ${profile?.sections?.join(',')}`);
      }
    }

    // 3b. Générer le JSON via Claude
    const personalizationBlock = buildPersonalizationBlock(addons, designChoices);

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Génère le JSON pour ce site web :\n\nDescription : ${prompt}\nNom du projet : ${projectName || 'Mon Site'}\nType : ${siteType || 'vitrine'}\n${personalizationBlock}${inspirationBlock}\nInformations légales à intégrer :\n${JSON.stringify(legalData || {})}`
      }],
    });

    let siteJSON;
    try {
      const rawText = aiResponse.content[0].text.trim()
        .replace(/^```json\s*/i, '').replace(/```\s*$/, '');
      siteJSON = JSON.parse(rawText);
    } catch {
      throw new Error('Claude a retourné un JSON invalide');
    }

    // 4. Injecter les données légales obligatoires
    siteJSON.legal = {
      company_name: legalData?.raison_sociale || projectName,
      legal_form:   legalData?.forme_juridique || '',
      siret:        legalData?.siret || '',
      capital:      legalData?.capital || '',
      vat_number:   legalData?.tva || '',
      address:      legalData?.adresse || '',
      email:        legalData?.email_public || profile.email,
      phone:        legalData?.telephone_public || '',
      director:     `${profile.first_name} ${profile.last_name}`,
    };

    siteJSON.meta = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      user_id: userId,
    };

    // 4.5. Remplir les images vides (hero, about, galerie) via Unsplash
    await fillSiteImages(siteJSON);

    // 5. Générer le HTML via le moteur de rendu
    const finalHTML = renderSite(siteJSON);

    // 6. Créer le projet dans Supabase
    const projectId = `proj-${Date.now()}`;
    const repoName  = `creazio-${projectId}`;

    const { error: projErr } = await supabase.from('projects').insert({
      id: projectId,
      user_id: userId,
      name: projectName || siteJSON.site.name || 'Mon Site',
      prompt,
      repo_name: repoName,
      status: 'building',
      client_status: 'creating',
      site_data: siteJSON,
      created_at: new Date().toISOString(),
    });
    if (projErr) throw new Error(projErr.message);

    // 7. Stocker JSON + HTML dans Supabase Storage
    await supabase.storage.from('site-codes')
      .upload(`${projectId}/v1/data.json`, JSON.stringify(siteJSON, null, 2), {
        contentType: 'application/json', upsert: true,
      });
    await supabase.storage.from('site-codes')
      .upload(`${projectId}/v1/index.html`, finalHTML, {
        contentType: 'text/html', upsert: true,
      });

    // 8. Enregistrer la version
    await supabase.from('versions').insert({
      project_id: projectId,
      version: 1,
      instruction: `Création initiale : ${prompt}`,
      storage_path: `${projectId}/v1`,
      site_data: siteJSON,
      created_at: new Date().toISOString(),
    });

    // 9. Push GitHub
    const { repoUrl } = await pushToGitHub(repoName, finalHTML, siteJSON, projectName, prompt);

    // 10. Déployer sur Vercel
    const deployUrl = await deployToVercel(repoName, projectName);

    // 11. Mettre à jour le projet — déployé techniquement, mais pas
    //     encore visible pour le client (effet "petite équipe au travail")
    const revealAt = computeCreationRevealDate(profile.plan || 'solo');
    await supabase.from('projects').update({
      repo_url: repoUrl,
      deploy_url: deployUrl,
      status: 'live',
      client_status: 'creating',
      reveal_at: revealAt.toISOString(),
    }).eq('id', projectId);

    // 12. Email "projet lancé" au client — pas de lien vers le site,
    //     pour préserver l'effet d'attente.
    const launchSigner = pickTeamMember('support');
    await resend.emails.send({
      from: 'Créazio <sites@creazio.fr>',
      to: profile.email,
      subject: `✦ Votre projet "${projectName}" est lancé`,
      html: buildProjectLaunchedEmail(profile.first_name, projectName, launchSigner),
    });

    // 13. Notification admin (Discord) — le site est prêt en coulisses,
    //     avec le lien réel pour vérification avant révélation au client.
    await notifyDiscord('SITES_GENERES',
      `✦ **Site prêt en coulisses (en attente de révélation)**\n` +
      `👤 Client : ${profile.email}\n` +
      `🏷️ Projet : ${projectName}\n` +
      `🌐 URL (privée pour l'instant) : ${deployUrl}\n` +
      `📋 Template : ${siteJSON.site.template}\n` +
      `🗓️ Révélation prévue : ${revealAt.toLocaleString('fr-FR')}`,
      0x00875a
    );

    res.json({
      success: true,
      projectId,
      deployUrl,
      repoUrl,
      siteData: siteJSON,
      revealAt: revealAt.toISOString(),
      message: `Site généré — visible par le client à partir du ${revealAt.toLocaleDateString('fr-FR')}`,
    });

  } catch (err) {
    console.error('[GENERATE ERROR]', err.message);
    await notifyDiscord('ERREURS_SYSTEME',
      `❌ **Erreur génération**\n${err.message}`, 0xcc0000);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/generate/stream — Génération en streaming ────
router.post('/stream', async (req, res) => {
  const { prompt, userId, projectName } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (event, data) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    send('status', { step: 'Analyse de votre projet...', pct: 10 });

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Génère le JSON pour : ${prompt}` }],
    });

    let fullText = '';
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullText += chunk.delta.text;
        send('chunk', { text: chunk.delta.text });
        const pct = Math.min(10 + Math.floor(fullText.length / 50), 80);
        if (fullText.length % 300 < 5) send('status', { step: 'Construction du site...', pct });
      }
    }

    send('status', { step: 'Rendu du HTML...', pct: 85 });
    const siteJSON = JSON.parse(fullText.replace(/^```json\s*/i, '').replace(/```\s*$/, ''));
    const finalHTML = renderSite(siteJSON);

    send('status', { step: 'Déploiement...', pct: 92 });
    const repoName  = `creazio-${Date.now()}`;
    const { repoUrl } = await pushToGitHub(repoName, finalHTML, siteJSON, projectName, prompt);
    const deployUrl   = await deployToVercel(repoName, projectName);

    send('status', { step: 'Site en ligne !', pct: 100 });
    send('done', { siteData: siteJSON, repoUrl, deployUrl });
    res.end();

  } catch (err) {
    send('error', { message: err.message });
    res.end();
  }
});

// ── Helpers GitHub & Vercel ─────────────────────────────────
async function pushToGitHub(repoName, html, jsonData, projectName, commitMsg, update = false) {
  const owner = process.env.GITHUB_USERNAME;
  try {
    if (!update) {
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: `Créazio — ${projectName}`,
        private: true,
        auto_init: false,
      });
    }

    let htmlSha, jsonSha;
    if (update) {
      try {
        const { data: f1 } = await octokit.rest.repos.getContent({ owner, repo: repoName, path: 'index.html' });
        htmlSha = f1.sha;
      } catch {}
      try {
        const { data: f2 } = await octokit.rest.repos.getContent({ owner, repo: repoName, path: 'data.json' });
        jsonSha = f2.sha;
      } catch {}
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo: repoName, path: 'index.html',
      message: commitMsg || 'Créazio — Création initiale',
      content: Buffer.from(html).toString('base64'),
      ...(htmlSha ? { sha: htmlSha } : {}),
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo: repoName, path: 'data.json',
      message: 'Créazio — Données du site',
      content: Buffer.from(JSON.stringify(jsonData, null, 2)).toString('base64'),
      ...(jsonSha ? { sha: jsonSha } : {}),
    });

    return { repoUrl: `https://github.com/${owner}/${repoName}` };
  } catch (err) {
    console.error('[GITHUB]', err.message);
    return { repoUrl: null };
  }
}

async function deployToVercel(repoName, projectName) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return `https://${repoName}.vercel.app`;
  try {
    await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: repoName,
        gitRepository: { type: 'github', repo: `${process.env.GITHUB_USERNAME}/${repoName}` },
        framework: null,
      }),
    });
    return `https://${repoName}.vercel.app`;
  } catch (err) {
    console.error('[VERCEL]', err.message);
    return `https://${repoName}.vercel.app`;
  }
}

// ── Construit le bloc "Personnalisation" du prompt utilisateur ─
// à partir des options activées et des choix de design optionnels
// transmis depuis create.html. Renvoie une chaîne vide si rien
// n'est renseigné — l'IA déduit alors tout depuis la description.
const ADDON_LABELS = {
  ecom: 'E-commerce (vente en ligne avec paiement)',
  resa: 'Réservation en ligne',
  social: 'Publication réseaux sociaux',
  seo: 'SEO avancé',
  chat: 'Chat IA assistant',
};

const STYLE_LABELS = {
  artisanal: 'Artisanal — chaleureux, authentique, fait-main',
  moderne: 'Moderne — épuré, contrasté, contemporain',
  luxe: 'Luxe — sophistiqué, prestige, haut de gamme',
  minimaliste: 'Minimaliste — sobre, espaces, essentiel',
  chaleureux: 'Chaleureux — convivial, accueillant, doux',
  elegant: 'Élégant — raffiné, intemporel',
  audacieux: 'Audacieux — couleurs vives, dynamique',
};

function buildPersonalizationBlock(addons, designChoices) {
  const lines = [];

  if (Array.isArray(addons) && addons.length > 0) {
    const labels = addons.map(id => ADDON_LABELS[id] || id).filter(Boolean);
    if (labels.length > 0) {
      lines.push(`Options activées par le client : ${labels.join(', ')}.`);
    }
  }

  if (designChoices?.style) {
    lines.push(`Style/ambiance choisi par le client : ${STYLE_LABELS[designChoices.style] || designChoices.style}.`);
  }

  if (designChoices?.colors?.primary || designChoices?.colors?.accent) {
    const parts = [];
    if (designChoices.colors.primary) parts.push(`couleur principale = ${designChoices.colors.primary}`);
    if (designChoices.colors.accent) parts.push(`couleur d'accent = ${designChoices.colors.accent}`);
    lines.push(`Couleurs personnalisées choisies par le client (à utiliser telles quelles, dérive le reste de la palette autour) : ${parts.join(', ')}.`);
  }

  if (designChoices?.inspiration_url) {
    lines.push(`Site d'inspiration fourni par le client : ${designChoices.inspiration_url} (utilise-le uniquement comme référence d'ambiance générale, ne copie jamais son contenu ni son design).`);
  }

  if (lines.length === 0) return '';
  return `\nPersonnalisation demandée par le client :\n${lines.map(l => `- ${l}`).join('\n')}\n`;
}

// ── Email templates ─────────────────────────────────────────
function buildProjectLaunchedEmail(name, projectName, signer) {
  return `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px">
  <div style="font-size:1.3rem;font-weight:700;margin-bottom:28px">Créazio<em style="font-style:italic">.</em></div>
  <h2 style="font-size:1.2rem;font-weight:400;margin-bottom:12px">Votre projet est lancé ✦</h2>
  <p style="color:#555;line-height:1.7;margin-bottom:16px">Bonjour ${name},<br><br>
  Bonne nouvelle : votre paiement a bien été pris en compte et notre équipe a commencé le travail sur <strong>${projectName}</strong>.</p>
  <p style="color:#555;line-height:1.7;margin-bottom:16px">
  Nous allons concevoir le design, rédiger les textes, optimiser le référencement et préparer la mise en ligne. Vous recevrez un email dès que votre site sera prêt et accessible depuis votre dashboard.
  </p>
  <div style="background:#f7f7f5;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:.85rem;color:#555">
    En attendant, votre dashboard affichera le statut <strong>« En cours de création »</strong> — c'est normal, c'est notre équipe qui travaille dessus.
  </div>
  ${signatureHTML(signer)}
  <hr style="border:none;border-top:1px solid #f0f0ee;margin:28px 0">
  <p style="font-size:.72rem;color:#aaa">Créazio · creazio.fr · Vos données sont hébergées sur des serveurs européens conformes au RGPD.</p>
</div>`;
}

function buildSiteRevealEmail(name, projectName, url, signer) {
  return `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px">
  <div style="font-size:1.3rem;font-weight:700;margin-bottom:28px">Créazio<em style="font-style:italic">.</em></div>
  <h2 style="font-size:1.2rem;font-weight:400;margin-bottom:12px">Votre site est prêt ✦</h2>
  <p style="color:#555;line-height:1.7;margin-bottom:16px">Bonjour ${name},<br><br>
  Nous avons terminé le travail sur <strong>${projectName}</strong> ! Votre site est désormais en ligne et accessible à l'adresse suivante :</p>
  <div style="background:#f7f7f5;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-family:monospace;font-size:.9rem">
    <a href="${url}" style="color:#0050b8">${url}</a>
  </div>
  <p style="color:#555;font-size:.85rem;line-height:1.7;margin-bottom:24px">
    Vous pouvez le consulter et le modifier à tout moment depuis votre dashboard, en décrivant simplement les changements souhaités.
  </p>
  <a href="${process.env.FRONTEND_URL}/dashboard.html"
     style="background:#111;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-weight:600;font-size:.88rem;display:inline-block">
    Accéder à mon dashboard →
  </a>
  ${signatureHTML(signer)}
  <hr style="border:none;border-top:1px solid #f0f0ee;margin:28px 0">
  <p style="font-size:.72rem;color:#aaa">Créazio · creazio.fr · Vos données sont hébergées sur des serveurs européens conformes au RGPD.</p>
</div>`;
}

export { pushToGitHub, deployToVercel, buildSiteRevealEmail };
export default router;
