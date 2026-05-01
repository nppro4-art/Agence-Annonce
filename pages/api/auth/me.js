import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  const payload = getUserFromRequest(req)
  if (!payload) return res.status(401).json({ error: 'Non autorisé' })

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, plan: true, subStatus: true, createdAt: true }
  })
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

  // Vérifier le rôle admin
  const role = user.email === process.env.ADMIN_EMAIL ? 'admin' : 'user'

  res.status(200).json({ user: { ...user, role } })
}
