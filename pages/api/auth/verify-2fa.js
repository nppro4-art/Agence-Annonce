import { prisma } from '../../../lib/db'
import { signToken } from '../../../lib/auth'
import { serialize } from 'cookie'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, code } = req.body
  if (!email || !code) return res.status(400).json({ error: 'Email et code requis' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(400).json({ error: 'Code invalide' })

  const record = await prisma.twoFACode.findUnique({ where: { userId: user.id } }).catch(() => null)

  if (!record) return res.status(400).json({ error: 'Code invalide' })
  if (record.used) return res.status(400).json({ error: 'Code deja utilise' })
  if (new Date() > record.expiresAt) return res.status(400).json({ error: 'Code expire. Reconnectez-vous.' })
  if (record.code !== code) return res.status(400).json({ error: 'Code incorrect' })

  // Vérifier que le bouton "Accepter" a été cliqué depuis l'email
  if (!record.confirmed) {
    return res.status(400).json({
      error: 'Vous devez d\'abord accepter la connexion depuis l\'email que vous avez recu.'
    })
  }

  // Marquer comme utilisé
  await prisma.twoFACode.update({ where: { userId: user.id }, data: { used: true } }).catch(() => {})

  const role = user.email === process.env.ADMIN_EMAIL ? 'admin' : 'user'
  const token = signToken({ id: user.id, email: user.email, role })
  res.setHeader('Set-Cookie', serialize('token', token, {
    httpOnly: true, path: '/', maxAge: 604800, sameSite: 'lax'
  }))

  res.status(200).json({ success: true, user: { id: user.id, email: user.email, role } })
}
