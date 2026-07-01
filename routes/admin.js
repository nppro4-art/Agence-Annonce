/**
 * Routes admin — Gestion automatique de tous les problèmes
 * POST /api/admin/report-content    — Signalement contenu illégal
 * POST /api/admin/delete-account    — Suppression RGPD
 * POST /api/admin/transfer          — Transfert de compte
 * GET  /api/admin/invoices/:userId  — Factures d'un client
 * POST /api/admin/validate-siret    — Vérification SIRET
 */

import express from 'express';
import {
  validateSiret,
  handleIllegalContentReport,
  deleteUserData,
  transferAccount,
  autoDebugSite,
  pauseUserSites,
  activateUserSites,
} from '../services/problems-handler.js';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { notifyDiscord } from '../server.js';

const router   = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend   = new Resend(process.env.RESEND_API_KEY);

// ── Middleware : vérifie la clé admin sur toutes les routes sauf /login ──
router.use((req, res, next) => {
  if (req.path === '/login') return next();
  if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: 'Non autorisé' });
  }
  next();
});

// ── Connexion admin (mot de passe) ──────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }
  res.json({ success: true, key: process.env.ADMIN_SECRET_KEY });
});

// ── Validation SIRET en temps réel ──────────────────────────
router.post('/validate-siret', async (req, res) => {
  const { siret } = req.body;
  try {
    const result = await validateSiret(siret);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Signalement contenu illégal ─────────────────────────────
router.post('/report-content', async (req, res) => {
  const { siteId, reporterEmail, description, url } = req.body;
  if (!siteId || !reporterEmail || !description) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  try {
    await handleIllegalContentReport({ siteId, reporterEmail, description, url });
    res.json({ success: true, message: 'Signalement reçu et traité' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Suppression compte RGPD ─────────────────────────────────
router.post('/delete-account', async (req, res) => {
  const { userId, confirmation } = req.body;
  if (confirmation !== 'SUPPRIMER_MON_COMPTE') {
    return res.status(400).json({ error: 'Confirmation invalide' });
  }
  try {
    await deleteUserData(userId);
    res.json({ success: true, message: 'Compte supprimé — données effacées sous 72h' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Transfert de compte ─────────────────────────────────────
router.post('/transfer', async (req, res) => {
  const { fromUserId, toEmail, projectId } = req.body;
  try {
    await transferAccount(fromUserId, toEmail, projectId);
    res.json({ success: true, message: 'Transfert effectué' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Factures d'un client ────────────────────────────────────
router.get('/invoices/:userId', async (req, res) => {
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });
    res.json({ success: true, invoices: invoices || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Auto-debug manuel ───────────────────────────────────────
router.post('/debug', async (req, res) => {
  const { projectId, errorDetails } = req.body;
  try {
    const fixedCode = await autoDebugSite(projectId, errorDetails);
    res.json({ success: true, fixedCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard admin (pour toi) ──────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [profiles, projects, invoices, reports, messages] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('content_reports').select('*').eq('status', 'pending'),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    const allProfiles = profiles.data || [];
    const allProjects = projects.data || [];

    const prices = { trial: 0, solo: 69.99, business: 149.99, expert: 299.99 };

    const mrr = allProfiles.reduce((sum, p) => {
      if (!p.plan_active) return sum;
      return sum + (prices[p.plan] || 0);
    }, 0);

    // Répartition par plan (clients actifs uniquement)
    const planBreakdown = {};
    allProfiles.filter(p => p.plan_active).forEach(p => {
      const plan = p.plan || 'trial';
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
    });

    // Map user_id -> nombre de sites
    const sitesPerUser = {};
    allProjects.forEach(pr => {
      sitesPerUser[pr.user_id] = (sitesPerUser[pr.user_id] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        total_clients: allProfiles.length,
        active_clients: allProfiles.filter(p => p.plan_active).length,
        trial_clients: allProfiles.filter(p => p.plan === 'trial' || p.plan_status === 'trialing').length,
        unpaid_clients: allProfiles.filter(p => p.plan_status === 'past_due' || p.plan_status === 'unpaid').length,
        mrr,
        arr: mrr * 12,
        total_sites: allProjects.length,
        live_sites: allProjects.filter(p => p.status === 'live').length,
        offline_sites: allProjects.filter(p => p.status === 'error' || p.status === 'offline').length,
        pending_reports: reports.data?.length || 0,
        plan_breakdown: planBreakdown,
        sites_per_user: sitesPerUser,
      },
      recent_clients: allProfiles.slice(0, 20),
      recent_invoices: invoices.data || [],
      pending_reports: reports.data || [],
      sites: allProjects,
      recent_messages: messages.data || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Suspendre un client ──────────────────────────────────────
router.post('/suspend', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requis' });
  try {
    await supabase.from('profiles').update({ plan_active: false, plan_status: 'suspended' }).eq('id', userId);
    await pauseUserSites(userId);
    res.json({ success: true, message: 'Client suspendu et sites mis en pause' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Réactiver un client ──────────────────────────────────────
router.post('/reactivate', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requis' });
  try {
    await supabase.from('profiles').update({ plan_active: true, plan_status: 'active' }).eq('id', userId);
    await activateUserSites(userId);
    res.json({ success: true, message: 'Client réactivé et sites remis en ligne' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Redéploiement manuel d'un site ──────────────────────────
router.post('/redeploy', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'projectId requis' });
  try {
    await supabase.from('projects').update({ status: 'building' }).eq('id', projectId);
    res.json({ success: true, message: 'Redéploiement lancé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Email ciblé à un client ─────────────────────────────────
router.post('/email-client', async (req, res) => {
  const { email, subject, message } = req.body;
  if (!email || !subject || !message) return res.status(400).json({ error: 'Champs requis manquants' });
  try {
    await resend.emails.send({
      from: 'Créazio <support@creazio.fr>',
      to: email,
      subject,
      html: `<div style="font-family:sans-serif;line-height:1.6">${message.replace(/\n/g, '<br>')}</div>`,
    });
    res.json({ success: true, message: 'Email envoyé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Message à tous les clients actifs ───────────────────────
router.post('/broadcast', async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Champs requis manquants' });
  try {
    const { data: profiles } = await supabase.from('profiles').select('email').eq('plan_active', true);
    const recipients = (profiles || []).map(p => p.email).filter(Boolean);
    for (const email of recipients) {
      await resend.emails.send({
        from: 'Créazio <support@creazio.fr>',
        to: email,
        subject,
        html: `<div style="font-family:sans-serif;line-height:1.6">${message.replace(/\n/g, '<br>')}</div>`,
      });
    }
    await notifyDiscord('BROADCAST', `📢 Message envoyé à ${recipients.length} clients : "${subject}"`);
    res.json({ success: true, message: `Message envoyé à ${recipients.length} clients` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
