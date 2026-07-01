/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CRÉAZIO — Backend V1 MVP                                    ║
 * ║  Node.js + Express                                           ║
 * ║                                                              ║
 * ║  V1 inclut :                                                 ║
 * ║  • Auth (inscription/connexion)                              ║
 * ║  • Génération site via Claude + architecture JSON            ║
 * ║  • Modification via IA                                       ║
 * ║  • Auto-debug                                                ║
 * ║  • GitHub + Vercel déploiement                               ║
 * ║  • Stripe abonnements (Starter + Pro)                        ║
 * ║  • Supabase (DB + Storage)                                   ║
 * ║  • Resend (emails)                                           ║
 * ║  • Discord (notifications)                                   ║
 * ║  • Formulaires de contact                                    ║
 * ║  • Historique des versions                                   ║
 * ║  • Modération contenu                                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import express       from 'express';
import cors          from 'cors';
import dotenv        from 'dotenv';
import Anthropic     from '@anthropic-ai/sdk';
import { Octokit }   from 'octokit';
import fetch         from 'node-fetch';
import { Resend }    from 'resend';
import Stripe        from 'stripe';
import cron          from 'node-cron';
import { createSupabaseClient, cleanSupabaseUrl, inspectServiceKey } from './lib/supabase.js';

dotenv.config();

const app       = express();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const octokit   = new Octokit({ auth: process.env.GITHUB_TOKEN });
const supabase  = createSupabaseClient();
const resend    = new Resend(process.env.RESEND_API_KEY);
const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook Stripe — body brut obligatoire (monté AVANT le JSON parser global)
app.use('/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: '10mb' }));

// ── Import routes ──────────────────────────────────────────
import authRoutes      from './routes/auth.js';
import generateRoutes  from './routes/generate.js';
import modifyRoutes    from './routes/modify.js';
import billingRoutes   from './routes/billing.js';
import versionsRoutes  from './routes/versions.js';
import contactRoutes   from './routes/contact.js';
import adminRoutes     from './routes/admin.js';
import deployRoutes    from './routes/deploy.js';
import statsRoutes     from './routes/stats.js';
import financeRoutes   from './routes/finance.js';
import { buildSiteRevealEmail } from './routes/generate.js';
import { pickTeamMember, signatureHTML } from './services/team.js';

app.use('/api/auth',     authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/modify',   modifyRoutes);
// Montage explicite du webhook Stripe avant les routes billing standards
app.use('/webhook/stripe', billingRoutes);
app.use('/api/billing',  billingRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api/contact',  contactRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/deploy',   deployRoutes);
app.use('/api/stats',    statsRoutes);
app.use('/api/finance',  financeRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: 'v1-mvp', timestamp: new Date().toISOString() });
});

// ── Health check configuration (utile sans shell Render) ───
// Protégé par une clé admin pour éviter de divulguer la config publiquement.
// Secret : ADMIN_SECRET_KEY, ADMIN_PASSWORD, ou fallback "CREAZIO2026ADMIN".
app.get('/health/env', (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD || 'CREAZIO2026ADMIN';
  const provided = req.query.secret || req.headers['x-admin-secret'];
  if (provided !== adminSecret) {
    return res.status(401).json({ error: 'Secret admin requis' });
  }

  const required = [
    'ANTHROPIC_API_KEY', 'GITHUB_TOKEN', 'GITHUB_USERNAME',
    'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'RESEND_API_KEY',
    'STRIPE_SECRET_KEY', 'FRONTEND_URL',
  ];
  const missing = required.filter(k => !process.env[k]);

  const rawUrl = process.env.SUPABASE_URL;
  const cleanUrl = cleanSupabaseUrl(rawUrl);
  const role = inspectServiceKey(process.env.SUPABASE_SERVICE_KEY);
  res.json({
    status: missing.length === 0 && role === 'service_role' ? 'ok' : 'ko',
    all_good: missing.length === 0 && role === 'service_role',
    supabase_url_raw: rawUrl || null,
    supabase_url_cleaned: cleanUrl || null,
    supabase_url_cleaned_ok: !!(cleanUrl && cleanUrl.startsWith('https://') && cleanUrl.includes('.supabase.co')),
    supabase_key_role: role,
    supabase_key_role_ok: role === 'service_role',
    missing_required_vars: missing,
    frontend_url: process.env.FRONTEND_URL || null,
    timestamp: new Date().toISOString(),
  });
});

// ── Cron jobs automatiques ──────────────────────────────────

// Chaque nuit à 3h — sauvegardes + alertes sites hors ligne
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Vérification nocturne...');
  await checkSitesHealth();
});

// 1er de chaque mois à 8h — rapports mensuels
cron.schedule('0 8 1 * *', async () => {
  console.log('[CRON] Envoi rapports mensuels...');
  await sendMonthlyReports();
});

// Chaque lundi à 9h — rapport hebdo Discord
cron.schedule('0 9 * * 1', async () => {
  await sendWeeklyDiscordReport();
});

// Chaque soir à 20h — résumé quotidien Discord
cron.schedule('0 20 * * *', async () => {
  await sendDailyDiscordSummary();
});

// Toutes les 30 minutes — révéler les sites/modifications dont le
// délai "équipe" est écoulé (effet petite agence humaine)
cron.schedule('*/30 * * * *', async () => {
  await revealReadyProjects();
  await applyPendingModifications();
});

// ── Révélation des sites en fin de "création" ───────────────
async function revealReadyProjects() {
  try {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, user_id, name, deploy_url, client_status, reveal_at')
      .eq('client_status', 'creating')
      .not('reveal_at', 'is', null)
      .lte('reveal_at', new Date().toISOString());

    for (const project of projects || []) {
      const { data: profile } = await supabase
        .from('profiles').select('email, first_name').eq('id', project.user_id).single();
      if (!profile?.email || !project.deploy_url) continue;

      const signer = pickTeamMember('developer');
      await resend.emails.send({
        from: 'Créazio <sites@creazio.fr>',
        to: profile.email,
        subject: `✦ Votre site "${project.name}" est prêt`,
        html: buildSiteRevealEmail(profile.first_name, project.name, project.deploy_url, signer),
      });

      await supabase.from('projects').update({ client_status: 'ready' }).eq('id', project.id);

      await notifyDiscord('SITES_GENERES',
        `🎉 **Site révélé au client**\n👤 ${profile.email}\n🏷️ ${project.name}`,
        0x00875a
      );
    }
  } catch (err) {
    console.error('[CRON revealReadyProjects]', err.message);
  }
}

// ── Application des modifications en attente ────────────────
async function applyPendingModifications() {
  try {
    const { data: versions } = await supabase
      .from('versions')
      .select('id, project_id, instruction')
      .eq('applied', false)
      .not('apply_at', 'is', null)
      .lte('apply_at', new Date().toISOString());

    for (const version of versions || []) {
      const { data: project } = await supabase
        .from('projects').select('id, user_id, name, client_status').eq('id', version.project_id).single();
      if (!project) continue;

      const { data: profile } = await supabase
        .from('profiles').select('email, first_name').eq('id', project.user_id).single();

      if (profile?.email) {
        const signer = pickTeamMember('developer');
        await resend.emails.send({
          from: 'Créazio <sites@creazio.fr>',
          to: profile.email,
          subject: `✓ Modification appliquée — ${project.name}`,
          html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px">
            <div style="font-size:1.3rem;font-weight:700;margin-bottom:28px">Créazio<em style="font-style:italic">.</em></div>
            <h2 style="font-size:1.2rem;font-weight:400;margin-bottom:12px">Modification terminée ✓</h2>
            <p style="color:#555;line-height:1.7;margin-bottom:16px">Bonjour ${profile.first_name || ''},<br><br>
            Nous avons terminé la modification demandée sur <strong>${project.name}</strong>.</p>
            <div style="background:#f7f7f5;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:.85rem;color:#555;font-style:italic">
              « ${version.instruction} »
            </div>
            <p style="color:#555;font-size:.85rem;line-height:1.7;margin-bottom:24px">
              Votre site a été mis à jour. N'hésitez pas si vous souhaitez d'autres ajustements.
            </p>
            <a href="${process.env.FRONTEND_URL}/dashboard.html"
               style="background:#111;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-weight:600;font-size:.88rem;display:inline-block">
              Voir mon site →
            </a>
            ${signatureHTML(signer)}
            <hr style="border:none;border-top:1px solid #f0f0ee;margin:28px 0">
            <p style="font-size:.72rem;color:#aaa">Créazio · creazio.fr</p>
          </div>`,
        });
      }

      await supabase.from('versions').update({ applied: true }).eq('id', version.id);

      // Le projet redevient "ready" si c'est sa modif la plus récente qui vient d'être traitée
      if (project.client_status === 'modifying') {
        await supabase.from('projects').update({ client_status: 'ready' }).eq('id', project.id);
      }
    }
  } catch (err) {
    console.error('[CRON applyPendingModifications]', err.message);
  }
}

// ── Vérification santé des sites ───────────────────────────
async function checkSitesHealth() {
  const { data: projects } = await supabase
    .from('projects')
    .select('id, deploy_url, user_id, name')
    .eq('status', 'live');

  for (const project of projects || []) {
    if (!project.deploy_url) continue;
    try {
      const res = await fetch(project.deploy_url, { timeout: 10000 });
      if (!res.ok) throw new Error(`Status ${res.status}`);
    } catch {
      // Site hors ligne
      await supabase.from('projects')
        .update({ status: 'error' }).eq('id', project.id);

      const { data: profile } = await supabase
        .from('profiles').select('email,name').eq('id', project.user_id).single();

      if (profile) {
        await resend.emails.send({
          from: 'Créazio <alertes@creazio.fr>',
          to: profile.email,
          subject: `⚠️ Votre site "${project.name}" est hors ligne`,
          html: `<p>Bonjour ${profile.name},<br>Votre site <strong>${project.name}</strong> semble inaccessible. Notre équipe surveille la situation et vous tiendra informé.</p>`,
        });
        await notifyDiscord('SITES_HORS_LIGNE',
          `🔴 **Site hors ligne** : ${project.name} (${project.deploy_url}) — Client: ${profile.email}`, 0xcc0000);
      }
    }
  }
}

// ── Rapports mensuels ──────────────────────────────────────
async function sendMonthlyReports() {
  const { data: profiles } = await supabase
    .from('profiles').select('*').eq('plan_active', true);

  for (const profile of profiles || []) {
    const { data: projects } = await supabase
      .from('projects').select('*').eq('user_id', profile.id);

    await resend.emails.send({
      from: 'Créazio <rapports@creazio.fr>',
      to: profile.email,
      subject: `📊 Votre rapport mensuel Créazio — ${new Date().toLocaleString('fr-FR', { month: 'long' })}`,
      html: buildMonthlyReportEmail(profile, projects || []),
    });
  }
  console.log(`[CRON] ${profiles?.length || 0} rapports envoyés`);
}

function buildMonthlyReportEmail(profile, projects) {
  return `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="font-size:1.3rem;font-weight:700;margin-bottom:28px">Créazio<em style="font-style:italic">.</em></div>
  <h2 style="font-size:1.2rem;font-weight:400;margin-bottom:16px">Bonjour ${profile.name}, voici votre rapport du mois ✦</h2>
  <div style="background:#f7f7f5;border-radius:10px;padding:20px;margin-bottom:20px">
    <div style="font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#a0a09c;margin-bottom:12px">VOS SITES</div>
    ${projects.map(p => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e8e8e4;font-size:.85rem">
      <span style="font-weight:600">${p.name}</span>
      <span style="color:${p.status === 'live' ? '#007a50' : '#c42b2b'}">${p.status === 'live' ? '✓ En ligne' : '✗ Hors ligne'}</span>
    </div>`).join('')}
  </div>
  <div style="margin-bottom:20px">
    <div style="font-size:.8rem;color:#666;line-height:1.7">
      Notre IA a analysé votre site ce mois. Voici 3 recommandations pour améliorer vos performances :
    </div>
    <ul style="margin-top:12px;font-size:.82rem;color:#555;line-height:1.8">
      <li>Ajoutez une section témoignages pour renforcer la confiance de vos visiteurs</li>
      <li>Mettez à jour vos horaires d'ouverture si nécessaire</li>
      <li>Vérifiez que vos coordonnées sont à jour</li>
    </ul>
  </div>
  <a href="${process.env.FRONTEND_URL}/dashboard"
     style="background:#111;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-weight:600;font-size:.85rem;display:inline-block">
    Accéder à mon dashboard →
  </a>
  <p style="color:#aaa;font-size:.72rem;margin-top:28px">Créazio — creazio.fr | Se désabonner des rapports</p>
</div>`;
}

// ══════════════════════════════════════════════════════════
//  DISCORD — Notifications centralisées
// ══════════════════════════════════════════════════════════
const DISCORD_WEBHOOKS = {
  NOUVEAUX_INSCRITS:    process.env.DISCORD_WEBHOOK_INSCRITS,
  CLIENTS_PAYANTS:      process.env.DISCORD_WEBHOOK_PAYANTS,
  ESSAIS_ACTIFS:        process.env.DISCORD_WEBHOOK_ESSAIS,
  RESILIATIONS:         process.env.DISCORD_WEBHOOK_RESILIATIONS,
  PAIEMENTS_RECUS:      process.env.DISCORD_WEBHOOK_PAIEMENTS_OK,
  PAIEMENTS_ECHOUES:    process.env.DISCORD_WEBHOOK_PAIEMENTS_KO,
  SITES_GENERES:        process.env.DISCORD_WEBHOOK_SITES,
  SITES_HORS_LIGNE:     process.env.DISCORD_WEBHOOK_HORS_LIGNE,
  ERREURS_SYSTEME:      process.env.DISCORD_WEBHOOK_ERREURS,
  RAPPORT_HEBDO:        process.env.DISCORD_WEBHOOK_HEBDO,
  MESSAGES_CLIENTS:     process.env.DISCORD_WEBHOOK_MESSAGES,
};

export async function notifyDiscord(channel, message, color = 0x111110) {
  const webhookUrl = DISCORD_WEBHOOKS[channel];
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          description: message,
          color,
          timestamp: new Date().toISOString(),
          footer: { text: 'Créazio · ' + new Date().toLocaleString('fr-FR') },
        }]
      }),
    });
  } catch (err) {
    console.error('[DISCORD]', err.message);
  }
}

async function sendWeeklyDiscordReport() {
  const { count: newClients } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());

  const { data: activeSubs } = await supabase
    .from('profiles').select('plan').eq('plan_active', true);

  const planPrices = { solo: 69.99, business: 149.99, expert: 299.99, starter: 69.99, pro: 149.99 };
  const mrr = (activeSubs || []).reduce((sum, p) => {
    return sum + (planPrices[p.plan] || 0);
  }, 0);

  await notifyDiscord('RAPPORT_HEBDO',
    `📊 **Rapport hebdomadaire Créazio**\n\n` +
    `👤 Nouveaux clients cette semaine : **${newClients}**\n` +
    `💰 MRR actuel : **${mrr}€**\n` +
    `✅ Abonnements actifs : **${activeSubs?.length || 0}**`,
    0x0055cc
  );
}

async function sendDailyDiscordSummary() {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const { count: newToday } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  const { count: sitesToday } = await supabase
    .from('projects').select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  await notifyDiscord('RAPPORT_HEBDO',
    `🌙 **Résumé du ${today.toLocaleDateString('fr-FR')}**\n` +
    `• Nouveaux inscrits : **${newToday}**\n` +
    `• Sites créés : **${sitesToday}**`,
    0x5865f2
  );
}

// ── Démarrage ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   CRÉAZIO Backend V1-MVP — Démarré ✓      ║
  ║   http://localhost:${PORT}                   ║
  ╠═══════════════════════════════════════════╣
  ║   Claude ✓  GitHub ✓  Vercel ✓            ║
  ║   Supabase ✓  Resend ✓  Stripe ✓          ║
  ║   Discord ✓  Cron Jobs ✓                  ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;
