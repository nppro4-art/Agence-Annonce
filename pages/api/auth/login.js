import bcrypt from 'bcryptjs'
import { serialize } from 'cookie'
import { prisma } from '../../../lib/db'
import { signToken } from '../../../lib/auth'
import { authLimiter } from '../../../lib/rateLimit'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const { limited } = authLimiter(ip)
  if (limited) return res.status(429).json({ error: 'Trop de tentatives. Reessayez dans 15 minutes.' })

  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' })

  // Si 2FA activé, demander le code
  if (user.twoFAEnabled) {
    return res.status(200).json({ requires2FA: true })
  }

  const role = user.email === process.env.ADMIN_EMAIL ? 'admin' : 'user'
  const token = signToken({ id: user.id, email: user.email, role })
  res.setHeader('Set-Cookie', serialize('token', token, {
    httpOnly: true, path: '/', maxAge: 604800, sameSite: 'lax'
  }))
  res.status(200).json({ success: true, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, planKey: user.planKey, role } })
}
