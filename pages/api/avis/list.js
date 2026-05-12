import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    const avis = await prisma.avis.findMany({
      where: { statut: 'approved' },
      orderBy: { createdAt: 'desc' }, take: 20,
      select: { id:true, nom:true, ville:true, article:true, note:true, commentaire:true, createdAt:true }
    })
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ avis })
  } catch(e) { res.status(200).json({ avis: [] }) }
}
