import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAuth(async function handler(req, res) {
  const bots = await prisma.chatBot.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id:true, code:true, titre:true, actif:true, nbQuestions:true, createdAt:true }
  })
  res.status(200).json({ bots })
})
