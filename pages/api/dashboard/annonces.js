import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
export default requireAuth(async function(req, res) {
  const annonces = await prisma.annonce.findMany({
    where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20
  })
  res.status(200).json({ annonces })
})
