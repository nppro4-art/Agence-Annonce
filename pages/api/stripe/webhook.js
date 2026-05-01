import { buffer } from 'micro'
import { stripe } from '../../../lib/stripe'
import { prisma } from '../../../lib/db'
import {
  sendPaymentConfirmationEmail,
  sendCancellationEmail,
  sendNewSaleToAdmin
} from '../../../lib/email'

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    const ref = session.metadata?.ref
    if (userId) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { plan: 'pro', subStatus: 'active', stripeSubId: session.subscription }
      })

      // Email confirmation client
      await sendPaymentConfirmationEmail({ to: user.email, name: user.name })

      // Email admin
      if (adminEmail) await sendNewSaleToAdmin({ adminEmail, clientEmail: user.email, ref, amount: '19,99' })

      // Commission employé
      if (ref) {
        const emp = await prisma.employee.findUnique({ where: { code: ref } })
        if (emp) {
          const commAmount = settings?.commissionFirst || 6
          await prisma.commission.create({
            data: { employeeId: emp.id, userId, amount: commAmount, type: 'first' }
          })
          await sendDiscord(emp.webhook, [
            '💰 NOUVELLE VENTE',
            'Client : ' + user.email,
            'Commission : ' + commAmount + 'EUR',
            'Statut : En attente de versement'
          ].join('\n'))
        }
      }

      await sendDiscord(adminWebhook, [
        '✅ NOUVEL ABONNE PRO',
        'Email : ' + user.email,
        'Ref : ' + (ref || 'Direct'),
        'Montant : 19,99EUR'
      ].join('\n'))
    }
  }

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
          await sendDiscord(emp.webhook, [
            '🔄 RENOUVELLEMENT',
            'Client : ' + user.email,
            'Commission recurrente : ' + commAmount + 'EUR'
          ].join('\n'))
        }
      }
      await sendDiscord(adminWebhook, '🔄 RENOUVELLEMENT : ' + (user?.email || 'Inconnu') + ' — 19,99EUR')
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const user = await prisma.user.findFirst({ where: { stripeSubId: sub.id } })
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'free', subStatus: 'cancelled', stripeSubId: null }
      })
      await sendCancellationEmail({ to: user.email, name: user.name })
      await sendDiscord(adminWebhook, '❌ RESILIATION : ' + user.email)
    }
  }

  res.status(200).json({ received: true })
}
