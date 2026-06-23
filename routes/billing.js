/**
 * CRÉAZIO — Route Billing
 * Gestion complète des abonnements Stripe avec tarification dynamique
 */

import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { notifyDiscord } from '../server.js';
import { handlePaymentFailure, generateAndStoreInvoice, handleChargeback } from '../services/problems-handler.js';
import { pickTeamMember, signatureHTML } from '../services/team.js';

const router   = express.Router();
const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend   = new Resend(process.env.RESEND_API_KEY);

// ══════════════════════════════════════════════════════════
//  POST /api/billing/create-checkout
//  Crée une session de paiement Stripe avec prix dynamique
// ══════════════════════════════════════════════════════════
router.post('/create-checkout', async (req, res) => {
  const { userId, planName, monthlyPrice, creationPrice, addons, onetimeAddons, paymentType, projectDescription } = req.body;

  try {
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    if (!profile) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Calculer la date de fin d'essai
    const now = new Date();
    const trial14 = new Date(now.getTime() + 14 * 86400000);
    const firstOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const trialEnd = trial14 > firstOfNext ? trial14 : firstOfNext;
    const billingStart = new Date(trialEnd.getFullYear(), trialEnd.getMonth() + (trialEnd.getDate() > 1 ? 1 : 0), 1);
    const trialEndTimestamp = Math.floor(billingStart.getTime() / 1000);

    // Construire les line items selon le type de paiement
    const lineItems = [];

    // Frais de création one-time (toujours facturés une seule fois,
    // qu'il s'agisse d'un abonnement ou d'un paiement comptant).
    // Inclut le supplément e-commerce et les options à paiement
    // unique (réservation, blog, multilingue).
    if (creationPrice && creationPrice > 0) {
      const onetimeDesc = (onetimeAddons || []).length > 0
        ? ' (incl. ' + (onetimeAddons || []).map(a => a.name).join(', ') + ')'
        : '';
      lineItems.push({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(creationPrice * 100),
          product_data: {
            name: `Création de site Créazio — ${planName}${onetimeDesc}`,
            description: projectDescription?.substring(0, 200) || 'Site professionnel créé par Créazio',
          },
        },
        quantity: 1,
      });
    }

    // Abonnement mensuel avec prix dynamique
    const totalMonthly = monthlyPrice + (addons || []).reduce((s, a) => s + a.price, 0);

    const addonDesc = (addons || []).length > 0
      ? ' + ' + (addons || []).map(a => a.name).join(', ')
      : '';

    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(totalMonthly * 100),
        recurring: { interval: 'month' },
        product_data: {
          name: `Créazio ${planName}${addonDesc}`,
          description: `Site professionnel — ${planName}${addonDesc}`,
          metadata: {
            plan: planName.toLowerCase(),
            addons: JSON.stringify(addons || []),
            monthly_base: monthlyPrice,
          },
        },
      },
      quantity: 1,
    });

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: paymentType === 'comptant' ? 'payment' : 'subscription',
      subscription_data: paymentType !== 'comptant' ? {
        trial_end: trialEndTimestamp,
        metadata: {
          user_id: userId,
          plan: planName.toLowerCase(),
          monthly_price: totalMonthly,
          creation_price: creationPrice,
          payment_type: paymentType,
        },
      } : undefined,
      success_url: `${process.env.FRONTEND_URL}/dashboard.html?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/create.html?cancelled=true`,
      metadata: {
        user_id: userId,
        plan: planName.toLowerCase(),
        payment_type: paymentType,
      },
      locale: 'fr',
      custom_text: {
        submit: { message: 'Aucun débit avant la fin de votre période d\'essai gratuit.' },
      },
    });

    res.json({ success: true, checkoutUrl: session.url, sessionId: session.id });

  } catch (err) {
    console.error('[BILLING checkout]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  POST /api/billing/create-subscription-dynamic
//  Crée un abonnement avec prix totalement dynamique
// ══════════════════════════════════════════════════════════
router.post('/create-subscription-dynamic', async (req, res) => {
  const { userId, monthlyAmount, description, trialDays } = req.body;

  try {
    const { data: profile } = await supabase
      .from('profiles').select('stripe_customer_id').eq('id', userId).single();

    const trialEnd = trialDays
      ? Math.floor((Date.now() + trialDays * 86400000) / 1000)
      : undefined;

    const subscription = await stripe.subscriptions.create({
      customer: profile.stripe_customer_id,
      items: [{
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(monthlyAmount * 100),
          recurring: { interval: 'month' },
          product_data: { name: description || 'Créazio — Abonnement mensuel' },
        },
      }],
      trial_end: trialEnd,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  POST /webhook/stripe — Webhooks Stripe
// ══════════════════════════════════════════════════════════
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[WEBHOOK] Signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('[WEBHOOK]', event.type);

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      if (!userId) break;

      await supabase.from('profiles').update({
        plan: session.metadata?.plan || 'starter',
        plan_active: true,
        plan_status: 'active',
        stripe_subscription_id: session.subscription,
      }).eq('id', userId);

      const { data: profile } = await supabase
        .from('profiles').select('email, first_name').eq('id', userId).single();

      // Email "paiement reçu" — signé par un membre de l'équipe
      if (profile?.email) {
        const signer = pickTeamMember('support');
        await resend.emails.send({
          from: 'Créazio <facturation@creazio.fr>',
          to: profile.email,
          subject: '✓ Paiement reçu — votre projet va démarrer',
          html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px">
            <div style="font-size:1.3rem;font-weight:700;margin-bottom:28px">Créazio<em style="font-style:italic">.</em></div>
            <h2 style="font-size:1.2rem;font-weight:400;margin-bottom:12px">Paiement confirmé ✓</h2>
            <p style="color:#555;line-height:1.7;margin-bottom:16px">Bonjour ${profile.first_name || ''},<br><br>
            Nous avons bien reçu votre paiement. Merci de votre confiance !</p>
            <p style="color:#555;line-height:1.7;margin-bottom:16px">
            Notre équipe va maintenant prendre en main votre projet. Vous recevrez un email de confirmation dès que le travail aura démarré, généralement sous quelques heures.
            </p>
            ${signatureHTML(signer)}
            <hr style="border:none;border-top:1px solid #f0f0ee;margin:28px 0">
            <p style="font-size:.72rem;color:#aaa">Créazio · creazio.fr · Vos données sont hébergées sur des serveurs européens conformes au RGPD.</p>
          </div>`,
        });
      }

      await notifyDiscord('CLIENTS_PAYANTS',
        `💰 **Nouveau client payant !**\n` +
        `👤 ${profile?.first_name || 'Client'} (${profile?.email})\n` +
        `📋 Plan : ${session.metadata?.plan}\n` +
        `💳 Type : ${session.metadata?.payment_type}`,
        0x00875a
      );
      break;
    }

    case 'customer.subscription.trial_will_end': {
      const sub = event.data.object;
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('stripe_subscription_id', sub.id).single();
      if (!profile) break;

      await resend.emails.send({
        from: 'Créazio <facturation@creazio.fr>',
        to: profile.email,
        subject: '⏰ Votre essai gratuit se termine dans 3 jours',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <p>Bonjour ${profile.first_name},</p>
          <p style="margin-top:12px">Votre essai gratuit Créazio se termine dans <strong>3 jours</strong>. Votre site restera en ligne et votre abonnement démarrera automatiquement.</p>
          <p style="margin-top:12px;color:#888;font-size:.82rem">Si vous ne souhaitez pas continuer, résiliez depuis votre dashboard avant la date de facturation. Aucun débit ne sera effectué.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard.html" style="display:inline-block;margin-top:16px;background:#111;color:#fff;padding:10px 20px;border-radius:7px;text-decoration:none;font-weight:600;font-size:.85rem">Accéder à mon dashboard →</a>
        </div>`,
      });

      await notifyDiscord('ESSAIS_ACTIFS',
        `⏰ **Trial expire dans 3 jours**\n👤 ${profile.email}`,
        0xf59e0b
      );
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      await generateAndStoreInvoice(invoice);

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('stripe_customer_id', invoice.customer).single();
      if (!profile) break;

      await supabase.from('profiles').update({
        plan_status: 'active',
        plan_active: true,
        last_payment_date: new Date().toISOString(),
      }).eq('id', profile.id);

      await notifyDiscord('PAIEMENTS_RECUS',
        `✅ **Paiement reçu**\n` +
        `👤 ${profile.first_name} ${profile.last_name} (${profile.email})\n` +
        `💰 ${(invoice.amount_paid / 100).toFixed(2)}€\n` +
        `📋 Facture : ${invoice.number}`,
        0x00875a
      );
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const attempt = invoice.attempt_count;
      await handlePaymentFailure(invoice, attempt);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('stripe_subscription_id', sub.id).single();
      if (!profile) break;

      await supabase.from('profiles').update({
        plan_status: 'cancelled',
        plan_active: false,
      }).eq('id', profile.id);

      await supabase.from('projects').update({ status: 'paused' })
        .eq('user_id', profile.id);

      await notifyDiscord('RESILIATIONS',
        `❌ **Résiliation**\n👤 ${profile.email}\n📋 Plan : ${profile.plan}`,
        0xef4444
      );
      break;
    }

    case 'charge.dispute.created': {
      await handleChargeback(event.data.object);
      break;
    }
  }

  res.json({ received: true });
});

// ══════════════════════════════════════════════════════════
//  GET /api/billing/portal/:userId — Portail Stripe
// ══════════════════════════════════════════════════════════
router.get('/portal/:userId', async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles').select('stripe_customer_id').eq('id', req.params.userId).single();

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard.html`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  GET /api/billing/invoices/:userId — Liste des factures
// ══════════════════════════════════════════════════════════
router.get('/invoices/:userId', async (req, res) => {
  try {
    const { data: invoices } = await supabase
      .from('invoices').select('*').eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });
    res.json({ success: true, invoices: invoices || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
