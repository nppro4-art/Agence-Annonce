import { requireAdmin } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAdmin(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requis' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé — il doit d\'abord créer un compte.' })

  await prisma.user.update({
    where: { email },
    data: { plan: 'pro', subStatus: 'active' }
  })

  res.status(200).json({ success: true, message: email + ' est maintenant Elite.' })
})
