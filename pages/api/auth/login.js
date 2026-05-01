import bcrypt from 'bcryptjs'
import { serialize } from 'cookie'
import { prisma } from '../../../lib/db'
import { signToken } from '../../../lib/auth'
import { authLimiter } from '../../../lib/rateLimit'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const { limited } = authLimiter(ip)
  if (limited) return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' })

  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' })

  // Vérifier si c'est l'admin via ADMIN_EMAIL
  const isAdmin = email === process.env.ADMIN_EMAIL
  const role = isAdmin ? 'admin' : 'user'

  const token = signToken({ id: user.id, email: user.email, role })
  res.setHeader('Set-Cookie', serialize('token', token, {
    httpOnly: true, path: '/', maxAge: 604800, sameSite: 'lax', secure: process.env.NODE_ENV === 'production'
  }))
  res.status(200).json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role }
  })
}
