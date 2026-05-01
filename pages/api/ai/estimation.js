import { prisma } from '../../../lib/db'
import { estimatePrix } from '../../../lib/ai'
import { estimationAnonLimiter, estimationProLimiter } from '../../../lib/rateLimit'
import { getUserFromRequest } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { specs } = req.body
  if (!specs) return res.status(400).json({ error: 'Specs manquantes' })

  const userPayload = getUserFromRequest(req)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress

  if (userPayload) {
    // Utilisateur connecté
    const user = await prisma.user.findUnique({ where: { id: userPayload.id } })
    if (!user) return res.status(404).end()

    if (user.plan !== 'pro') {
      // Gratuit : limité à 3 estimations par jour par IP
      const { limited } = estimationAnonLimiter(ip)
      if (limited) return res.status(429).json({
        error: 'Limite atteinte',
        message: 'Vous avez utilisé vos 3 estimations gratuites du jour. Passez Pro pour des estimations illimitées.',
        upgrade: true
      })
    } else {
      // Pro : 50 estimations par mois
      const { limited } = estimationProLimiter(user.id)
      if (limited) return res.status(429).json({
        error: 'Limite mensuelle atteinte',
        message: 'Limite de 50 estimations par mois atteinte.',
        upgrade: false
      })
    }
  } else {
    // Non connecté : 3 par jour par IP
    const { limited } = estimationAnonLimiter(ip)
    if (limited) return res.status(429).json({
      error: 'Limite atteinte',
      message: 'Créez un compte gratuit pour continuer à utiliser les estimations.',
      upgrade: true
    })
  }

  try {
    const result = await estimatePrix(specs)
    res.status(200).json(result)
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
