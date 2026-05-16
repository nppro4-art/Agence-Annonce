import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../../../lib/auth'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Non authentifié' })
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'ID manquant' })

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        annonces: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id:true, titre:true, type:true, createdAt:true }
        },
        reponses: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id:true, createdAt:true }
        },
        chatBots: {
          select: { id:true, titre:true, actif:true, createdAt:true }
        },
        purchases: {
          orderBy: { createdAt: 'desc' },
          select: { id:true, packName:true, packType:true, amount:true, quantity:true, createdAt:true }
        },
      }
    })

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const totalSpent = user.purchases.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalEstimations = user.annonces.filter(a => a.type === 'estimation').length
    const totalAnalyses = user.annonces.filter(a => a.type === 'analyser').length
    const totalAnnonces = user.annonces.filter(a => a.type !== 'estimation' && a.type !== 'analyser').length

    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      planKey: user.planKey || user.plan || 'free',
      subStatus: user.subStatus,
      clientCode: user.clientCode,
      twoFAEnabled: user.twoFAEnabled,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      refBy: user.refBy,
      totalAnnonces,
      totalReponses: user.reponses.length,
      totalEstimations,
      totalAnalyses,
      totalChatbots: user.chatBots.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      annonces: user.annonces.slice(0, 10),
      purchases: user.purchases,
      chatBots: user.chatBots,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
