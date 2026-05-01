import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { generateReponse } from '../../../lib/ai'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()
  if (user.plan !== 'pro') return res.status(403).json({ error: 'Fonctionnalité Pro uniquement' })

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
    res.status(200).json({ reponse, raw: result })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
