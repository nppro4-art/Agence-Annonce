import { buffer } from 'micro'
import { stripe } from '../../../lib/stripe'
import { prisma } from '../../../lib/db'
import { addCredits, PACK_MAP } from '../../../lib/credits'
import { sendPaymentConfirmationEmail, sendCancellationEmail, sendNewSaleToAdmin } from '../../../lib/email'

export const config = { api: { bodyParser: false } }

async function sendDiscord(webhook, message) {
  if (!webhook) return
  try {
    await fetch(webhook, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    })
  } catch(e) {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch(e) {
    return res.status(400).json({ error: 'Webhook invalide' })
  }

  const settings = await prisma.settings.findUnique({ where: { id: 'main' } })
  const adminWebhook = settings?.adminWebhook || process.env.DISCORD_WEBHOOK
  const adminEmail = process.env.ADMIN_EMAIL

  // ── ABONNEMENT ELITE ──────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    const ref = session.metadata?.ref

    // Vérifier si c'est un pack ou un abonnement
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
    const priceId = lineItems.data[0]?.price?.id

    // C'est un pack
    if (priceId && PACK_MAP[priceId]) {
      const pack = PACK_MAP[priceId]
      if (userId) {
        await addCredits(userId, pack.type, pack.qty, pack.name, pack.amount, session.id)
        const user = await prisma.user.findUnique({ where: { id: userId } })
        await sendDiscord(adminWebhook, [
          '📦 **PACK ACHETÉ**',
          'Client : ' + (user?.email || 'Inconnu'),
          'Pack : ' + pack.name,
          'Crédits ajoutés : ' + pack.qty + ' ' + pack.type,
          'Montant : ' + pack.amount + '€'
        ].join('\n'))
      }
    } else {
      // C'est un abonnement Elite
      if (userId) {
        const user = await prisma.user.update({
          where: { id: userId },
          data: { plan: 'pro', subStatus: 'active', stripeSubId: session.subscription }
        })
        await sendPaymentConfirmationEmail({ to: user.email, name: user.name })
        if (adminEmail) await sendNewSaleToAdmin({ adminEmail, clientEmail: user.email, ref, amount: '5,99' })

        if (ref) {
          const emp = await prisma.employee.findUnique({ where: { code: ref } })
          if (emp) {
            const commAmount = settings?.commissionFirst || 6
            await prisma.commission.create({
              data: { employeeId: emp.id, userId, amount: commAmount, type: 'first' }
            })
            await sendDiscord(emp.webhook, [
              '💰 **NOUVELLE VENTE ELITE**',
              'Client : ' + user.email,
              'Commission : ' + commAmount + '€'
            ].join('\n'))
          }
        }
        await sendDiscord(adminWebhook, [
          '✅ **NOUVEL ABONNÉ ELITE**',
          'Email : ' + user.email,
          'Ref : ' + (ref || 'Direct'),
          'Montant : 5,99€/semaine'
        ].join('\n'))
      }
    }
  }

  // ── RENOUVELLEMENT ────────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object
    if (invoice.billing_reason === 'subscription_cycle') {
      const user = await prisma.user.findFirst({ where: { stripeSubId: invoice.subscription } })
      if (user?.refBy) {
        const emp = await prisma.employee.findUnique({ where: { code: user.refBy } })
        if (emp) {
          const commAmount = settings?.commissionRecurring || 2
          await prisma.commission.create({
            data: { employeeId: emp.id, userId: user.id, amount: commAmount, type: 'recurring' }
          })
          await sendDiscord(emp.webhook, '🔄 Renouvellement · ' + user.email + ' · Commission : ' + commAmount + '€')
        }
      }
      await sendDiscord(adminWebhook, '🔄 **RENOUVELLEMENT** · ' + (user?.email || 'Inconnu') + ' · 5,99€')
    }
  }

  // ── ANNULATION ────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const user = await prisma.user.findFirst({ where: { stripeSubId: sub.id } })
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'free', subStatus: 'cancelled', stripeSubId: null }
      })
      await sendCancellationEmail({ to: user.email, name: user.name })
      await sendDiscord(adminWebhook, '❌ **ANNULATION** · ' + user.email)
    }
  }

  res.status(200).json({ received: true })
}
