import { buffer } from 'micro'
import { stripe } from '../../../lib/stripe'
import { prisma } from '../../../lib/db'
import { addCredits, PACK_MAP, PLAN_WEEKLY_COMMISSION } from '../../../lib/credits'
import { sendPaymentConfirmationEmail, sendNewSaleToAdmin } from '../../../lib/email'

export const config = { api: { bodyParser: false } }

async function sendDiscord(webhook, message) {
  if (!webhook) return
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    })
  } catch(e) {}
}

function formatEUR(amount) {
  return Number(amount).toFixed(2) + ' EUR'
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

  const settings = await prisma.settings.findUnique({ where: { id: 'main' } }).catch(() => null)
  const adminWebhook = settings?.adminWebhook || process.env.DISCORD_WEBHOOK

  // ── PAIEMENT INITIAL ──────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    const ref = session.metadata?.ref
    const planKey = session.metadata?.planKey || 'business'

    // Détecter si c'est un pack
    let lineItems = null
    try {
      const li = await stripe.checkout.sessions.listLineItems(session.id)
      lineItems = li.data
    } catch(e) {}

    const priceId = lineItems?.[0]?.price?.id
    const pack = priceId ? PACK_MAP[priceId] : null

    if (pack && userId) {
      await addCredits(userId, pack.type, pack.qty, pack.name, pack.amount, session.id)
      const user = await prisma.user.findUnique({ where: { id: userId } })
      await sendDiscord(adminWebhook,
        '📦 PACK ACHETE\n' +
        'Client : ' + (user?.email || 'Inconnu') + '\n' +
        'Pack : ' + pack.name + '\n' +
        'Montant : ' + formatEUR(pack.amount)
      )
    } else if (userId && session.subscription) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { plan: 'pro', planKey, subStatus: 'active', stripeSubId: session.subscription }
      })

      await sendPaymentConfirmationEmail({ to: user.email, name: user.name }).catch(() => {})

      // Commission affilié premier paiement
      if (ref) {
        const emp = await prisma.employee.findUnique({ where: { code: ref } })
        if (emp) {
          const commAmount = settings?.commissionFirst || 6
          await prisma.commission.create({
            data: { employeeId: emp.id, userId, amount: commAmount, type: 'first', planKey }
          })
          // Notifier l'affilié
          await sendDiscord(emp.webhook,
            '🎉 NOUVELLE VENTE VIA VOTRE LIEN !\n' +
            'Plan : ' + planKey.charAt(0).toUpperCase() + planKey.slice(1) + '\n' +
            'Commission gagnee : ' + formatEUR(commAmount) + '\n' +
            'Total a recevoir : voir votre dashboard'
          )
          // Marquer le click comme converti
          await prisma.click.updateMany({
            where: { employeeId: emp.id, converted: false },
            data: { converted: true, planKey }
          })
        }
      }

      // Notifier l'admin
      await sendDiscord(adminWebhook,
        '✅ NOUVEL ABONNE\n' +
        'Email : ' + user.email + '\n' +
        'Plan : ' + planKey + '\n' +
        'Ref affilié : ' + (ref || 'Direct') + '\n' +
        'CA semaine : voir admin'
      )
    }
  }

  // ── RENOUVELLEMENT HEBDOMADAIRE ────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object
    if (invoice.billing_reason === 'subscription_cycle') {
      const user = await prisma.user.findFirst({ where: { stripeSubId: invoice.subscription } })
      if (!user) { res.status(200).json({ received: true }); return }

      const planKey = user.planKey || 'business'
      const weeklyComm = PLAN_WEEKLY_COMMISSION[planKey] || 1.50

      if (user.refBy) {
        const emp = await prisma.employee.findUnique({ where: { code: user.refBy } })
        if (emp) {
          await prisma.commission.create({
            data: { employeeId: emp.id, userId: user.id, amount: weeklyComm, type: 'recurring', planKey }
          })
          // Notifier l'affilié de son renouvellement
          await sendDiscord(emp.webhook,
            '🔄 RENOUVELLEMENT - Commission gagnee !\n' +
            'Plan client : ' + planKey + '\n' +
            'Commission : ' + formatEUR(weeklyComm) + '\n' +
            'Cumul a recevoir : voir votre dashboard'
          )
        }
      }

      await sendDiscord(adminWebhook,
        '🔄 RENOUVELLEMENT\n' +
        'Client : ' + (user?.email || 'Inconnu') + '\n' +
        'Plan : ' + planKey
      )
    }
  }

  // ── ANNULATION ────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const user = await prisma.user.findFirst({ where: { stripeSubId: sub.id } })
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'free', planKey: 'free', subStatus: 'cancelled', stripeSubId: null }
      })
      await sendDiscord(adminWebhook,
        '❌ ANNULATION\n' +
        'Client : ' + user.email + '\n' +
        'Ancien plan : ' + (user.planKey || '?')
      )
    }
  }

  res.status(200).json({ received: true })
}
