import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Stripe from 'stripe';
import { notifyDiscord } from '../server.js';

const router   = express.Router();
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend    = new Resend(process.env.RESEND_API_KEY);
const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY);

// ── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, phone, sector } = req.body;
  if (!email || !password || !firstName) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  let step = 'init';
  try {
    // Vérifications de configuration critiques
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Configuration serveur : SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant');
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Configuration serveur : STRIPE_SECRET_KEY manquant');
    }

    step = 'supabase_auth';
    console.log(`[AUTH REGISTER] Étape ${step} : création utilisateur Supabase pour ${email}`);
    // Créer dans Supabase Auth — nécessite la clé service_role
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });
    if (authErr) throw new Error(`Supabase Auth : ${authErr.message}`);
    if (!authData?.user?.id) throw new Error('Supabase Auth : aucun user.id retourné');
    const userId = authData.user.id;
    console.log(`[AUTH REGISTER] Utilisateur Supabase créé : ${userId}`);

    step = 'stripe_customer';
    console.log(`[AUTH REGISTER] Étape ${step} : création customer Stripe`);
    let customer;
    try {
      customer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`,
        phone,
        metadata: { supabase_id: userId },
      });
    } catch (stripeErr) {
      // Rollback : supprimer l'utilisateur Supabase créé si Stripe échoue
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      throw new Error(`Stripe Customer : ${stripeErr.message}`);
    }
    console.log(`[AUTH REGISTER] Customer Stripe créé : ${customer.id}`);

    step = 'supabase_profile';
    console.log(`[AUTH REGISTER] Étape ${step} : insertion profil`);
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: userId, email,
      first_name: firstName,
      last_name: lastName,
      phone, sector,
      plan: 'trial',
      plan_active: true,
      plan_status: 'trialing',
      stripe_customer_id: customer.id,
      created_at: new Date().toISOString(),
    });
    if (profileErr) {
      // Rollback Stripe + Supabase Auth si le profil échoue
      await stripe.customers.del(customer.id).catch(() => {});
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      throw new Error(`Supabase Profile : ${profileErr.message}`);
    }
    console.log(`[AUTH REGISTER] Profil inséré pour ${userId}`);

    step = 'welcome_email';
    console.log(`[AUTH REGISTER] Étape ${step} : envoi email de bienvenue`);
    try {
      await resend.emails.send({
        from: 'Créazio <bonjour@creazio.fr>',
        to: email,
        subject: 'Bienvenue sur Créazio ✦',
        html: welcomeEmail(firstName),
      });
    } catch (emailErr) {
      console.warn('[AUTH REGISTER] Email de bienvenue non envoyé :', emailErr.message);
      // On ne bloque pas l'inscription si l'email échoue
    }

    step = 'discord';
    try {
      await notifyDiscord('NOUVEAUX_INSCRITS',
        `🎉 **Nouvel inscrit**\n👤 ${firstName} ${lastName}\n📧 ${email}\n🏷️ ${sector || 'Non précisé'}`,
        0x00875a);
    } catch (discordErr) {
      console.warn('[AUTH REGISTER] Discord notification failed :', discordErr.message);
    }

    console.log(`[AUTH REGISTER] Succès : ${userId}`);
    res.json({ success: true, userId, message: 'Compte créé' });
  } catch (err) {
    console.error(`[AUTH REGISTER] ÉCHEC à l'étape "${step}" :`, err.message);
    console.error(err.stack);
    res.status(500).json({ error: err.message, step });
  }
});

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', data.user.id).single();

    res.json({ success: true, session: data.session, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/forgot-password ─────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    res.json({ success: true, message: 'Email de réinitialisation envoyé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/profile/:userId ───────────────────────────
router.get('/profile/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', req.params.userId).single();
    if (error) return res.status(404).json({ error: 'Profil introuvable' });
    res.json({ success: true, profile: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/projects/:userId ──────────────────────────
// Renvoie les projets du client avec leur statut visible
// (client_status : 'creating' | 'modifying' | 'ready')
router.get('/projects/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, deploy_url, custom_domain, status, client_status, reveal_at, created_at, updated_at')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, projects: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/auth/profile/:userId ───────────────────────────
router.put('/profile/:userId', async (req, res) => {
  const { firstName, lastName, phone, sector } = req.body;
  try {
    await supabase.from('profiles').update({
      first_name: firstName,
      last_name: lastName,
      phone, sector,
      updated_at: new Date().toISOString(),
    }).eq('id', req.params.userId);
    res.json({ success: true, message: 'Profil mis à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function welcomeEmail(name) {
  return `<div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px">
  <div style="font-size:1.3rem;font-weight:700;margin-bottom:28px">Créazio<em style="font-style:italic">.</em></div>
  <h2 style="font-size:1.2rem;font-weight:400;margin-bottom:12px">Bienvenue ${name} ✦</h2>
  <p style="color:#555;line-height:1.7;margin-bottom:20px">Votre compte est actif. Vous pouvez maintenant créer votre premier site en décrivant simplement votre activité.</p>
  <a href="${process.env.FRONTEND_URL}/create.html" style="background:#111;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-weight:600;font-size:.88rem;display:inline-block">Créer mon premier site →</a>
  <p style="color:#aaa;font-size:.72rem;margin-top:28px">Créazio · creazio.fr · Données hébergées en Europe 🇪🇺</p>
</div>`;
}

export default router;
