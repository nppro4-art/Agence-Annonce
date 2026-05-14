import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import bcrypt from 'bcryptjs'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Champs requis' })
  if (newPassword.length < 8) return res.status(400).json({ error: 'Minimum 8 caracteres' })
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' })
  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } })
  res.status(200).json({ success: true })
})
