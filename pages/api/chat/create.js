import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { nanoid } from 'nanoid'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { annonceId } = req.body
  if (!annonceId) return res.status(400).json({ error: 'annonceId requis' })

  // Vérifier que l'annonce appartient à l'utilisateur
  const annonce = await prisma.annonce.findFirst({
    where: { id: annonceId, userId: req.user.id }
  })
  if (!annonce) return res.status(404).json({ error: 'Annonce non trouvee' })

  // Vérifier si un chatbot existe déjà
  const existing = await prisma.chatBot.findUnique({ where: { annonceId } })
  if (existing) return res.status(200).json({ chatBot: existing })

  // Générer un code court unique
  const code = nanoid(8).toUpperCase()

  const chatBot = await prisma.chatBot.create({
    data: {
      code,
      userId: req.user.id,
      annonceId,
      titre: annonce.titre || 'Article en vente',
      inputData: annonce.inputData || {},
    }
  })

  // Mettre à jour l'annonce avec le code
  await prisma.annonce.update({
    where: { id: annonceId },
    data: { chatBotCode: code }
  }).catch(() => {})

  res.status(201).json({ chatBot })
})
