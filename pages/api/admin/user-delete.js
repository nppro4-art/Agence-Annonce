import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../../../lib/auth'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end()

  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Non authentifié' })
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'ID manquant' })

  // Sécurité : ne pas supprimer un admin
  try {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } })
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' })
    if (target.role === 'admin') return res.status(403).json({ error: 'Impossible de supprimer un admin' })

    // Supprimer en cascade dans l'ordre (relations)
    await prisma.chatMessage.deleteMany({ where: { chatBot: { userId } } })
    await prisma.chatBot.deleteMany({ where: { userId } })
    await prisma.reponse.deleteMany({ where: { userId } })
    await prisma.annonce.deleteMany({ where: { userId } })
    await prisma.purchase.deleteMany({ where: { userId } })
    await prisma.credit.deleteMany({ where: { userId } })
    await prisma.obJetEnVente.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.twoFACode.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.emailChange.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } })

    return res.status(200).json({ success: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Erreur serveur: ' + e.message })
  }
}
