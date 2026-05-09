import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    const objets = await prisma.objetEnVente.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
    return res.status(200).json({ objets })
  }

  if (req.method === 'POST') {
    const { titre, prix, statut, annonceId, notes } = req.body
    const objet = await prisma.objetEnVente.create({
      data: { userId: req.user.id, titre, prix: parseFloat(prix)||0, statut: statut||'actif', annonceId, notes }
    })
    return res.status(201).json({ objet })
  }

  if (req.method === 'PUT') {
    const { id, statut, notes, prixFinal } = req.body
    const objet = await prisma.objetEnVente.update({
      where: { id, userId: req.user.id },
      data: { statut, notes, prixFinal: prixFinal ? parseFloat(prixFinal) : undefined }
    })
    return res.status(200).json({ objet })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    await prisma.objetEnVente.delete({ where: { id, userId: req.user.id } })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
})
