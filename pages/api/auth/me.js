import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
export default requireAuth(async function handler(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, plan: true, subStatus: true, createdAt: true }
  })
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
  res.status(200).json({ user })
})
