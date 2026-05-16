import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../../../lib/auth'

const prisma = new PrismaClient()

const PLAN_LIMITS = {
  free:     { annonces: 0,        reponses: 0   },
  starter:  { annonces: 10,       reponses: 30  },
  business: { annonces: 30,       reponses: 100 },
  pro:      { annonces: 30,       reponses: 100 },
  expert:   { annonces: 999999,   reponses: 999999 },
  premium:  { annonces: 999999,   reponses: 999999 },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Non authentifié' })
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })

  const { userId, planKey } = req.body
  if (!userId || !planKey) return res.status(400).json({ error: 'Paramètres manquants' })

  const validPlans = ['free', 'starter', 'business', 'expert', 'premium']
  if (!validPlans.includes(planKey)) return res.status(400).json({ error: 'Plan invalide' })

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        planKey,
        plan: planKey,
        subStatus: planKey === 'free' ? 'inactive' : 'active',
      }
    })

    return res.status(200).json({ success: true, planKey })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
