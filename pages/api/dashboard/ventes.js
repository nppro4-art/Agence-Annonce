import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    const objets = await prisma.objetEnVente.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
    // Stats
    const vendu = objets.filter(o => o.statut === 'vendu')
    const totalGagne = vendu.reduce((a, o) => a + (o.prixFinal || o.prix), 0)
    const enCours = objets.filter(o => o.statut === 'actif').length
    return res.status(200).json({ objets, stats: { vendu: vendu.length, totalGagne, enCours } })
  }

  if (req.method === 'POST') {
    const { titre, prix, annonceId, notes } = req.body
    if (!titre || !prix) return res.status(400).json({ error: 'Titre et prix requis' })
    const { cuid } = require('@paralleldrive/cuid2')
    const objet = await prisma.objetEnVente.create({
      data: { id: cuid(), userId: req.user.id, titre, prix: parseFloat(prix), annonceId, notes }
    })
    return res.status(201).json({ objet })
  }

  if (req.method === 'PUT') {
    const { id, statut, prixFinal, notes } = req.body
    const objet = await prisma.objetEnVente.update({
      where: { id, userId: req.user.id },
      data: { statut, prixFinal: prixFinal ? parseFloat(prixFinal) : undefined, notes }
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
