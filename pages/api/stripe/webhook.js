import { buffer } from 'micro'
import { stripe } from '../../../lib/stripe'
import { prisma } from '../../../lib/db'
import { addCredits, PACK_MAP } from '../../../lib/credits'
import { sendPaymentConfirmationEmail, sendCancellationEmail, sendNewSaleToAdmin } from '../../../lib/email'

export const config = { api: { bodyParser: false } }

// Commissions hebdomadaires par plan
const PLAN_WEEKLY_COMMISSION = {
  starter: 0.50,
  business: 1.50,
  expert: 2.50,
  pro: 1.50, // ancien plan = business
}

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

  const settings = await prisma.settings.findUnique({ where: { id: 'main' } }).catch(() => null)
  const adminWebhook = settings?.adminWebhook || process.env.DISCORD_WEBHOOK
  const adminEmail = process.env.ADMIN_EMAIL

  // PAIEMENT INITIAL (abonnement ou pack)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    const ref = session.metadata?.ref
    const planKey = session.metadata?.planKey || 'business'

    // Detecter si c'est un pack
    let lineItems = null
    try {
      const li = await stripe.checkout.sessions.listLineItems(session.id)
      lineItems = li.data
    } catch(e) {}

    const priceId = lineItems?.[0]?.price?.id
    const pack = priceId ? PACK_MAP[priceId] : null

    if (pack && userId) {
      // C'est un pack
      await addCredits(userId, pack.type, pack.qty, pack.name, pack.amount, session.id)
      const user = await prisma.user.findUnique({ where: { id: userId } })
      await sendDiscord(adminWebhook, '📦 PACK ACHETE\nClient : ' + (user?.email || 'Inconnu') + '\nPack : ' + pack.name + '\nMontant : ' + pack.amount + 'EUR')
    } else if (userId && session.subscription) {
      // C'est un abonnement
      const user = await prisma.user.update({
        where: { id: userId },
        data: { plan: 'pro', planKey, subStatus: 'active', stripeSubId: session.subscription }
      })
      await sendPaymentConfirmationEmail({ to: user.email, name: user.name }).catch(() => {})
      if (adminEmail) await sendNewSaleToAdmin({ adminEmail, clientEmail: user.email, ref, amount: session.amount_total ? (session.amount_total / 100).toFixed(2) : '?' }).catch(() => {})

      // Commission affilié
      if (ref) {
        const emp = await prisma.employee.findUnique({ where: { code: ref } })
        if (emp) {
          const commAmount = settings?.commissionFirst || 6
          await prisma.commission.create({
            data: { employeeId: emp.id, userId, amount: commAmount, type: 'first', planKey }
          })
          await sendDiscord(emp.webhook, '💰 NOUVELLE VENTE\nClient : ' + user.email + '\nPlan : ' + planKey + '\nCommission : ' + commAmount + 'EUR')
        }
      }
      await sendDiscord(adminWebhook, '✅ NOUVEL ABONNE\nEmail : ' + user.email + '\nPlan : ' + planKey + '\nRef : ' + (ref || 'Direct'))
    }
  }

  // RENOUVELLEMENT HEBDOMADAIRE
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object
    if (invoice.billing_reason === 'subscription_cycle') {
      const user = await prisma.user.findFirst({ where: { stripeSubId: invoice.subscription } })
      if (user?.refBy) {
        const emp = await prisma.employee.findUnique({ where: { code: user.refBy } })
        if (emp) {
          const planKey = user.planKey || 'business'
          const commAmount = PLAN_WEEKLY_COMMISSION[planKey] || 1.50
          await prisma.commission.create({
            data: { employeeId: emp.id, userId: user.id, amount: commAmount, type: 'recurring', planKey }
          })
          await sendDiscord(emp.webhook, '🔄 RENOUVELLEMENT\nClient : ' + user.email + '\nPlan : ' + planKey + '\nCommission semaine : ' + commAmount + 'EUR')
        }
      }
      await sendDiscord(adminWebhook, '🔄 RENOUVELLEMENT : ' + (user?.email || 'Inconnu') + ' · Plan : ' + (user?.planKey || '?'))
    }
  }

  // ANNULATION
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const user = await prisma.user.findFirst({ where: { stripeSubId: sub.id } })
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { plan: 'free', planKey: 'free', subStatus: 'cancelled', stripeSubId: null } })
      await sendCancellationEmail({ to: user.email, name: user.name }).catch(() => {})
      await sendDiscord(adminWebhook, '❌ ANNULATION : ' + user.email)
    }
  }

  res.status(200).json({ received: true })
}
