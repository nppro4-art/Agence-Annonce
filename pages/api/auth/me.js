import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    const payload = getUserFromRequest(req)
    if (!payload) return res.status(401).json({ error: 'Non connecte' })

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, plan: true, planKey: true, subStatus: true, createdAt: true, referralCode: true }
    })
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouve' })

    const isAdmin = user.email === process.env.ADMIN_EMAIL
    const role = isAdmin ? 'admin' : 'user'

    res.status(200).json({ user: { ...user, role } })
  } catch(e) {
    console.error('me.js error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
