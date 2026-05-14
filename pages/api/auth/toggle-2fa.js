import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()

  const newValue = !user.twoFAEnabled
  await prisma.user.update({ where: { id: user.id }, data: { twoFAEnabled: newValue } })

  res.status(200).json({ success: true, enabled: newValue })
})
