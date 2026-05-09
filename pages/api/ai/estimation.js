import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { estimatePrix } from '../../../lib/ai'

const DAILY_LIMIT = 3

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { specs } = req.body
  if (!specs) return res.status(400).json({ error: 'Description manquante' })

  // Verifier la limite quotidienne via IP pour les non-connectes
  let userId = null
  try {
    const { getUserFromRequest } = await import('../../../lib/auth')
    const payload = getUserFromRequest(req)
    if (payload) userId = payload.id
  } catch(e) {}

  if (!userId) {
    // Limite par IP pour les non-connectes
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const today = new Date(); today.setHours(0,0,0,0)
    const count = await prisma.annonce.count({
      where: { userId: 'anon-'+ip, createdAt: { gte: today } }
    }).catch(() => 0)
    if (count >= DAILY_LIMIT) {
      return res.status(429).json({
        error: 'Limite atteinte',
        message: '3 estimations gratuites par jour. Revenez demain ou creez un compte.',
        upgrade: true
      })
    }
  }

  try {
    const result = await estimatePrix(specs)
    if (!result || (!result.low && !result.mid && !result.high)) {
      return res.status(200).json({
        low: 0, mid: 0, high: 0,
        note: 'Impossible d'estimer ce produit avec les informations fournies. Essayez d'etre plus precis.',
        warning: true
      })
    }
    // Ajouter avertissement standard
    const note = (result.note || '') + ' Note : Cette estimation est indicative. Les prix peuvent varier selon le marche local, l'etat reel de l'article et la rapidite de vente souhaitee. L'IA peut manquer d'informations sur les modeles tres recents.'
    res.status(200).json({ ...result, note })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
