import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'id requis' })

  const bot = await prisma.chatBot.findFirst({ where: { id, userId: req.user.id } })
  if (!bot) return res.status(404).json({ error: 'Chatbot non trouvé' })

  await prisma.chatBot.update({ where: { id }, data: { actif: !bot.actif } })
  res.status(200).json({ success: true, actif: !bot.actif })
})
