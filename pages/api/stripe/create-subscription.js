import { requireAuth } from '../../../lib/auth'
import { stripe } from '../../../lib/stripe'
import { prisma } from '../../../lib/db'

const PRICE_MAP = {
  starter:  process.env.STRIPE_PRICE_STARTER,
  business: process.env.STRIPE_PRICE_BUSINESS,
  expert:   process.env.STRIPE_PRICE_EXPERT,
  pro:      process.env.STRIPE_PRICE_ID,
}

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { planKey = 'business' } = req.body || {}
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouve' })

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name || '' })
    customerId = customer.id
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
  }

  const priceId = PRICE_MAP[planKey] || process.env.STRIPE_PRICE_ID
  if (!priceId) return res.status(400).json({ error: 'Plan non configure. Ajoutez STRIPE_PRICE_STARTER/BUSINESS/EXPERT dans Vercel.' })

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: (process.env.NEXT_PUBLIC_URL || 'https://annonza.business') + '/merci?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: (process.env.NEXT_PUBLIC_URL || 'https://annonza.business') + '/pricing',
      metadata: { userId: user.id, ref: user.refBy || '', planKey }
    })
    res.status(200).json({ url: session.url })
  } catch(e) {
    console.error('Stripe error:', e.message)
    res.status(500).json({ error: e.message })
  }
})
