import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { stripe } from '../../../lib/stripe'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Code manquant' })
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()
  if (user.referralUsed) return res.status(400).json({ error: 'Code parrainage deja utilise' })
  const referrer = await prisma.user.findFirst({ where: { referralCode: code, plan: 'pro' } })
  if (!referrer) return res.status(404).json({ error: 'Code parrainage invalide' })
  if (referrer.id === user.id) return res.status(400).json({ error: 'Vous ne pouvez pas utiliser votre propre code' })
  if (user.stripeSubId) {
    try {
      await stripe.subscriptions.update(user.stripeSubId, {
        trial_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      })
    } catch(e) {}
  }
  await prisma.user.update({ where: { id: user.id }, data: { referralUsed: code } })
  res.status(200).json({ success: true, message: '1 mois gratuit applique !' })
})
