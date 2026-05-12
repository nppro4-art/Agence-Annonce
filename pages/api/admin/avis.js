import { requireAdmin } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAdmin(async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const avis = await prisma.avis.findMany({ orderBy: { createdAt: 'desc' } })
      return res.status(200).json({ avis })
    } catch(e) { return res.status(200).json({ avis: [] }) }
  }
  if (req.method === 'POST') {
    const { id, action } = req.body
    try {
      await prisma.avis.update({ where: { id }, data: { statut: action==='approve'?'approved':'rejected' } })
      return res.status(200).json({ success: true })
    } catch(e) { return res.status(500).json({ error: e.message }) }
  }
  res.status(405).end()
})
