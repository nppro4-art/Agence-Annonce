import { requireAdmin } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAdmin(async function handler(req, res) {
  if (req.method === 'GET') {
    const commissions = await prisma.commission.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    })
    return res.status(200).json({ commissions })
  }
  if (req.method === 'POST') {
    const { ids } = req.body
    await prisma.commission.updateMany({ where: { id: { in: ids } }, data: { paid: true } })
    return res.status(200).json({ success: true })
  }
  res.status(405).end()
})
