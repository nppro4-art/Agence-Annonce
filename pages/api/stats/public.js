import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    const since = new Date('2026-05-01T00:00:00.000Z')
    const [annonces, reponses] = await Promise.all([
      prisma.annonce.count({ where: { createdAt: { gte: since } } }),
      prisma.reponse.count({ where: { createdAt: { gte: since } } }),
    ])
    const estimations = Math.floor(annonces * 0.6 + reponses * 0.2)
    res.status(200).json({ annonces, reponses, estimations })
  } catch(e) {
    res.status(200).json({ annonces: 0, reponses: 0, estimations: 0 })
  }
}
