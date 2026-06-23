import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { notifyDiscord } from '../server.js';

const router   = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend   = new Resend(process.env.RESEND_API_KEY);

// ── POST /api/contact — Soumission formulaire ───────────────
router.post('/', async (req, res) => {
  const { siteId, name, email, phone, message, subject } = req.body;
  if (!siteId || !email || !message) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  try {
    const { data: project } = await supabase
      .from('projects').select('user_id, name, site_data').eq('id', siteId).single();
    if (!project) return res.status(404).json({ error: 'Site introuvable' });

    const { data: owner } = await supabase
      .from('profiles').select('email, first_name').eq('id', project.user_id).single();

    // Enregistrer le message dans Supabase
    await supabase.from('contact_messages').insert({
      project_id: siteId,
      user_id: project.user_id,
      name: name || 'Anonyme',
      email, phone: phone || '',
      subject: subject || 'Nouveau message',
      message,
      read: false,
      created_at: new Date().toISOString(),
    });

    // Email de notification au propriétaire du site
    const publicEmail = project.site_data?.legal?.email || owner.email;
    await resend.emails.send({
      from: 'Créazio <notifications@creazio.fr>',
      to: owner.email,
      replyTo: email,
      subject: `📬 Nouveau message depuis ${project.name}`,
      html: `<div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:36px 24px">
  <div style="font-size:1.2rem;font-weight:700;margin-bottom:20px">Créazio<em style="font-style:italic">.</em></div>
  <h2 style="font-size:1.1rem;font-weight:400;margin-bottom:16px">📬 Nouveau message — ${project.name}</h2>
  <div style="background:#f7f7f5;border-radius:9px;padding:16px 18px;margin-bottom:16px">
    <div style="font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9d9d96;margin-bottom:10px">Expéditeur</div>
    <div style="font-size:.85rem;margin-bottom:4px"><strong>${name || 'Anonyme'}</strong></div>
    <div style="font-size:.82rem;color:#555">${email}</div>
    ${phone ? `<div style="font-size:.82rem;color:#555">${phone}</div>` : ''}
  </div>
  <div style="background:#f7f7f5;border-radius:9px;padding:16px 18px;margin-bottom:20px">
    <div style="font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9d9d96;margin-bottom:8px">Message</div>
    <div style="font-size:.85rem;color:#333;line-height:1.7">${message.replace(/\n/g,'<br>')}</div>
  </div>
  <a href="${process.env.FRONTEND_URL}/dashboard.html" style="background:#111;color:#fff;padding:10px 20px;border-radius:7px;text-decoration:none;font-weight:600;font-size:.84rem;display:inline-block">Voir dans mon dashboard →</a>
  <p style="color:#aaa;font-size:.7rem;margin-top:24px">Créazio · creazio.fr</p>
</div>`,
    });

    // Email de confirmation à l'expéditeur
    const sitePublicEmail = project.site_data?.pages?.home?.contact?.email;
    if (sitePublicEmail) {
      await resend.emails.send({
        from: `${project.name} <notifications@creazio.fr>`,
        to: email,
        subject: `Votre message a bien été reçu`,
        html: `<div style="font-family:'Helvetica Neue',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
  <p style="font-size:.95rem;color:#333;line-height:1.7">Bonjour ${name || ''},<br><br>
  Votre message a bien été reçu par <strong>${project.name}</strong>. Vous recevrez une réponse dans les meilleurs délais.</p>
</div>`,
      });
    }

    // Notification Discord
    await notifyDiscord('MESSAGES_CLIENTS',
      `📬 **Nouveau message client**\nSite: ${project.name}\nDe: ${name||'Anonyme'} (${email})\nMessage: ${message.substring(0,100)}...`,
      0x5865f2);

    res.json({ success: true, message: 'Message envoyé' });
  } catch (err) {
    console.error('[CONTACT]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/contact/:userId — Messages reçus ───────────────
router.get('/:userId', async (req, res) => {
  try {
    const { data: messages } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });
    res.json({ success: true, messages: messages || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/contact/read/:messageId ────────────────────────
router.put('/read/:messageId', async (req, res) => {
  try {
    await supabase.from('contact_messages')
      .update({ read: true }).eq('id', req.params.messageId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
