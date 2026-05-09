import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    const since = new Date('2026-05-01T00:00:00.000Z')

    const [annonces, reponses, estimations, users] = await Promise.all([
      prisma.annonce.count({ where: { createdAt: { gte: since }, type: { not: 'estimation' } } }),
      prisma.reponse.count({ where: { createdAt: { gte: since } } }),
      prisma.annonce.count({ where: { createdAt: { gte: since }, type: 'estimation' } }),
      prisma.user.count(),
    ])

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ annonces, reponses, estimations, users })
  } catch(e) {
    res.status(200).json({ annonces: 0, reponses: 0, estimations: 0, users: 0 })
  }
}
