import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { getCredits } from '../../../lib/credits'

export default requireAuth(async function handler(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()

  const credits = await getCredits(user.id)
  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  res.status(200).json({ credits, purchases, plan: user.plan, subStatus: user.subStatus })
})
