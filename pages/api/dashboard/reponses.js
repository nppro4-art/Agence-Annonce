import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
export default requireAuth(async function(req, res) {
  const reponses = await prisma.reponse.findMany({
    where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20
  })
  res.status(200).json({ reponses })
})
