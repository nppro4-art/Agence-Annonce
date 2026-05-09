import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    // Annonces créées dans les 14 derniers jours = "actives"
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const active = await prisma.annonce.count({
      where: { createdAt: { gte: since }, type: { not: 'estimation' } }
    })
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ active })
  } catch(e) {
    res.status(200).json({ active: 0 })
  }
}
