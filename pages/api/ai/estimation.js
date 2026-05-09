import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { estimatePrix } from '../../../lib/ai'

const DAILY_LIMIT = 3
const WARNING = "Note : Cette estimation est indicative. Les prix peuvent varier selon le marche local, l'etat reel de l'article et la rapidite de vente souhaitee."

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { specs } = req.body
  if (!specs) return res.status(400).json({ error: 'Description manquante' })

  let userId = null
  try {
    const payload = getUserFromRequest(req)
    if (payload) userId = payload.id
  } catch(e) {}

  if (userId) {
    const today = new Date(); today.setHours(0,0,0,0)
    const count = await prisma.annonce.count({
      where: { userId, type: 'estimation', createdAt: { gte: today } }
    }).catch(() => 0)
    if (count >= DAILY_LIMIT) {
      return res.status(429).json({
        error: 'Limite atteinte',
        message: '3 estimations gratuites par jour. Revenez demain.',
        upgrade: true
      })
    }
  }

  try {
    const result = await estimatePrix(specs)

    if (userId) {
      await prisma.annonce.create({
        data: {
          userId,
          type: 'estimation',
          inputData: { specs: specs.slice(0, 200) },
          titre: 'Estimation: ' + specs.slice(0, 50),
        }
      }).catch(() => {})
    }

    const note = result.note ? result.note + ' ' + WARNING : WARNING
    res.status(200).json({ ...result, note })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
