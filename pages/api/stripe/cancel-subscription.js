import { requireAuth } from '../../../lib/auth'
import { stripe } from '../../../lib/stripe'
import { prisma } from '../../../lib/db'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user?.stripeSubId) return res.status(400).json({ error: 'Aucun abonnement actif' })

  try {
    // cancel_at_period_end = true : annulation a la fin de la periode payee
    // Le client garde acces jusqu'a la fin de la semaine
    await stripe.subscriptions.update(user.stripeSubId, {
      cancel_at_period_end: true
    })

    // Mettre a jour le statut en base
    await prisma.user.update({
      where: { id: user.id },
      data: { subStatus: 'cancelling' }
    })

    res.status(200).json({ success: true, message: 'Abonnement annule a la fin de la periode' })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
