import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { generateReponse } from '../../../lib/ai'
import { aiReponseLimiter } from '../../../lib/rateLimit'
import { canUse, useCredit } from '../../../lib/credits'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()

  const { allowed, source, remaining } = await canUse(user.id, 'reponses', user.plan)
  if (!allowed) return res.status(403).json({
    error: 'Crédits épuisés',
    message: 'Vous n\'avez plus de crédits réponses. Achetez un pack ou passez Elite.',
    upgrade: true,
    remaining: 0
  })

  if (source === 'elite') {
    const { limited } = aiReponseLimiter(user.id)
    if (limited) return res.status(429).json({ error: 'Limite mensuelle atteinte' })
  }

  const { message, contexte } = req.body
  if (!message) return res.status(400).json({ error: 'Message manquant' })

  try {
    const result = await generateReponse(message, contexte)
    const get = (p) => (result.match(p) || [])[1]?.trim() || ''
    const reponse = await prisma.reponse.create({
      data: {
        userId: user.id,
        messageAcheteur: message,
        reponsePrete: get(/RÉPONSE\s*[:\-]\s*([\s\S]+?)(?=SUGGESTION|TON|$)/i) || result,
        suggestion: get(/SUGGESTION\s*[:\-]?\s*([\s\S]+?)(?=TON|$)/i),
      }
    })
    if (source === 'pack') await useCredit(user.id, 'reponses')
    res.status(200).json({ reponse, raw: result, remaining: source === 'pack' ? remaining - 1 : null, source })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
