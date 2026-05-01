import { requireAuth } from '../../../lib/auth'
import { stripe } from '../../../lib/stripe'
import { prisma } from '../../../lib/db'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name || '' })
    customerId = customer.id
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: process.env.NEXT_PUBLIC_URL + '/dashboard?subscribed=true',
    cancel_url: process.env.NEXT_PUBLIC_URL + '/pricing',
    metadata: { userId: user.id, ref: user.refBy || '' }
  })

  res.status(200).json({ url: session.url })
})
