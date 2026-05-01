import { requireAuth } from '../../../lib/auth'
import { stripe } from '../../../lib/stripe'
import { prisma } from '../../../lib/db'

export default requireAuth(async function handler(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user?.stripeCustomerId) return res.status(400).json({ error: 'Aucun abonnement' })
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: process.env.NEXT_PUBLIC_URL + '/dashboard'
  })
  res.status(200).json({ url: session.url })
})
